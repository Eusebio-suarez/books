import { useEffect, useState } from 'react';

function getInitialOnlineStatus(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
