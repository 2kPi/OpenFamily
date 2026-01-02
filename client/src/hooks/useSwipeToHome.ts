import { useEffect, useRef, useState } from 'react';

interface UseSwipeToHomeProps {
  onSwipeRight: () => void;
  enabled?: boolean;
}

export function useSwipeToHome({ onSwipeRight, enabled = true }: UseSwipeToHomeProps) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Ignorer si le toucher commence sur un élément interactif
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        return;
      }

      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      currentX.current = touch.clientX;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      currentX.current = touch.clientX;

      // Déterminer si c'est un swipe horizontal (plus horizontal que vertical)
      if (!isSwiping.current && Math.abs(deltaX) > 10) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isSwiping.current = true;
        }
      }

      // Si c'est un swipe vers la droite
      if (isSwiping.current && deltaX > 0) {
        // Calculer le pourcentage de progression (0 à 1)
        const progress = Math.min(deltaX / (window.innerWidth * 0.5), 1);
        setSwipeProgress(progress);

        // Empêcher le scroll pendant le swipe
        if (progress > 0.1) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) {
        touchStartX.current = 0;
        touchStartY.current = 0;
        setSwipeProgress(0);
        return;
      }

      const deltaX = currentX.current - touchStartX.current;
      const screenWidth = window.innerWidth;

      // Si le swipe dépasse 50% de l'écran (centre), déclencher l'action
      if (deltaX > screenWidth * 0.5) {
        onSwipeRight();
      }

      // Réinitialiser
      touchStartX.current = 0;
      touchStartY.current = 0;
      currentX.current = 0;
      isSwiping.current = false;
      setSwipeProgress(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, onSwipeRight]);

  return swipeProgress;
}
