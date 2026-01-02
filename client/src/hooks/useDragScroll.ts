import { useEffect, useRef } from 'react';

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Ignorer si c'est un bouton, lien ou input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        return;
      }

      isDownRef.current = true;
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
      startXRef.current = e.pageX - element.offsetLeft;
      startYRef.current = e.pageY - element.offsetTop;
      scrollLeftRef.current = element.scrollLeft;
      scrollTopRef.current = element.scrollTop;
    };

    const handleMouseLeave = () => {
      isDownRef.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
    };

    const handleMouseUp = () => {
      isDownRef.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDownRef.current) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      const walkX = (x - startXRef.current) * 2;
      const walkY = (y - startYRef.current) * 2;
      element.scrollLeft = scrollLeftRef.current - walkX;
      element.scrollTop = scrollTopRef.current - walkY;
    };

    element.style.cursor = 'grab';
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return ref;
}
