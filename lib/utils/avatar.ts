'use client';

/**
 * Compresses an uploaded image file (from PC, mobile, camera) to max 256x256
 * and stores it as a lightweight base64 Data URL in localStorage.
 */
export async function compressAndSaveAvatar(file: File, userId: string = 'guest'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        try {
          if (typeof window !== 'undefined') {
            const key = `profmatch_user_avatar_${userId}`;
            localStorage.setItem(key, dataUrl);
            localStorage.setItem('profmatch_user_avatar_guest', dataUrl);
            localStorage.setItem('profmatch_user_avatar_usr_guest', dataUrl);

            window.dispatchEvent(new CustomEvent('profmatch_avatar_updated', { detail: dataUrl }));

            // Authoritative Cloud Sync to Supabase PostgreSQL & Auth user_metadata
            if (userId && userId !== 'guest' && userId !== 'usr_guest') {
              fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, avatarUrl: dataUrl }),
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error('Failed to save avatar to localStorage:', err);
        }

        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function cacheServerAvatar(
  userIdOrUrl: string,
  avatarUrlOrUserId?: string | null,
  userEmail?: string
): void {
  if (typeof window === 'undefined') return;
  let url: string | null = null;
  let uid: string | null = null;

  if (userIdOrUrl && (userIdOrUrl.startsWith('data:image') || userIdOrUrl.startsWith('http') || userIdOrUrl.startsWith('/'))) {
    url = userIdOrUrl;
    uid = avatarUrlOrUserId || 'guest';
  } else {
    uid = userIdOrUrl || 'guest';
    url = avatarUrlOrUserId || null;
  }

  if (!url || typeof url !== 'string') return;

  try {
    if (uid && uid !== 'guest') {
      localStorage.setItem(`profmatch_user_avatar_${uid}`, url);
    }
    if (userEmail) {
      localStorage.setItem(`profmatch_user_avatar_${userEmail.toLowerCase().trim()}`, url);
    }
    localStorage.setItem('profmatch_user_avatar_guest', url);
    localStorage.setItem('profmatch_user_avatar_usr_guest', url);
  } catch {}
}

export function getSavedAvatar(userId: string = 'guest', userEmail?: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Direct user ID key
    if (userId && userId !== 'guest') {
      const saved = localStorage.getItem(`profmatch_user_avatar_${userId}`);
      if (saved && saved.startsWith('data:image')) return saved;
    }

    // 2. Email key fallback
    if (userEmail) {
      const emailSaved = localStorage.getItem(`profmatch_user_avatar_${userEmail.toLowerCase().trim()}`);
      if (emailSaved && emailSaved.startsWith('data:image')) {
        if (userId && userId !== 'guest') {
          localStorage.setItem(`profmatch_user_avatar_${userId}`, emailSaved);
        }
        return emailSaved;
      }
    }

    // 3. Guest avatar fallback
    const guestSaved = localStorage.getItem('profmatch_user_avatar_guest');
    if (guestSaved && guestSaved.startsWith('data:image')) {
      if (userId && userId !== 'guest') {
        localStorage.setItem(`profmatch_user_avatar_${userId}`, guestSaved);
      }
      return guestSaved;
    }

    // 4. Usr_guest fallback
    const usrGuestSaved = localStorage.getItem('profmatch_user_avatar_usr_guest');
    if (usrGuestSaved && usrGuestSaved.startsWith('data:image')) {
      if (userId && userId !== 'guest') {
        localStorage.setItem(`profmatch_user_avatar_${userId}`, usrGuestSaved);
      }
      return usrGuestSaved;
    }
  } catch {}
  return null;
}

export function removeSavedAvatar(userId: string = 'guest'): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `profmatch_user_avatar_${userId}`;
    localStorage.removeItem(key);
    localStorage.removeItem('profmatch_user_avatar_guest');
    localStorage.removeItem('profmatch_user_avatar_usr_guest');

    // Notify backend to remove avatar from database
    if (userId && userId !== 'guest') {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, removeAvatar: true }),
      }).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('profmatch_avatar_updated', { detail: null }));
  } catch {}
}
