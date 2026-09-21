import { useEffect } from 'react';

/**
 * Hook to lock body scrolling when a modal or overlay is active.
 * Restores original scroll position on close.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    const originalScrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${originalScrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      const top = document.body.style.top;
      document.body.style.top = originalTop;

      if (top) {
        window.scrollTo(0, -parseInt(top, 10) || originalScrollY);
      }
    };
  }, [isLocked]);
}
