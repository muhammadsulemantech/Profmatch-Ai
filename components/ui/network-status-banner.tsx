'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2.5 text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
        isOffline
          ? 'bg-amber-500 text-slate-950 border-b border-amber-600'
          : 'bg-emerald-500 text-slate-950 border-b border-emerald-600'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 animate-pulse flex-shrink-0" />
          <span>⚡ No Internet Connection — You are currently offline. Check your Wi-Fi or network.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span>✓ Internet connection restored. You are back online!</span>
        </>
      )}
    </div>
  );
}

