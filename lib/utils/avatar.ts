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
            window.dispatchEvent(new CustomEvent('profmatch_avatar_updated', { detail: dataUrl }));
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

export function getSavedAvatar(userId: string = 'guest'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `profmatch_user_avatar_${userId}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;

    // Fallback to guest avatar if specific user key not found
    if (userId !== 'guest') {
      return localStorage.getItem('profmatch_user_avatar_guest');
    }
  } catch {}
  return null;
}

export function removeSavedAvatar(userId: string = 'guest'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`profmatch_user_avatar_${userId}`);
    localStorage.removeItem('profmatch_user_avatar_guest');
    window.dispatchEvent(new CustomEvent('profmatch_avatar_updated', { detail: null }));
  } catch {}
}
