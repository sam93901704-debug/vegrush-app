'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for parallax effect
 * Returns scroll progress (0 to 1) and scrollY
 */
export function useParallax(elementRef?: React.RefObject<HTMLElement>) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      if (elementRef?.current) {
        const elementTop = elementRef.current.getBoundingClientRect().top + scrollPosition;
        const elementHeight = elementRef.current.offsetHeight;
        const elementBottom = elementTop + elementHeight;
        
        // Calculate progress within the element
        const start = elementTop - windowHeight;
        const end = elementBottom;
        const progress = Math.max(0, Math.min(1, (scrollPosition - start) / (end - start)));
        setScrollProgress(progress);
      } else {
        // Simple scroll progress based on viewport
        const progress = Math.min(1, scrollPosition / windowHeight);
        setScrollProgress(progress);
      }
      
      setScrollY(scrollPosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [elementRef]);

  return { scrollProgress, scrollY };
}

