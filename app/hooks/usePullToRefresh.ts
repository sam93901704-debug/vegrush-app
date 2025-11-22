'use client';

import { useState, useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number; // Distance to pull before triggering refresh (in pixels)
  resistance?: number; // How much resistance when pulling (0-1)
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canPull: boolean; // Whether we can start pulling (at top of page)
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 0.5,
}: UsePullToRefreshOptions): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canPull, setCanPull] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if we're at the top of the page
    const checkCanPull = () => {
      setCanPull(window.scrollY === 0 || window.pageYOffset === 0);
    };

    const handleTouchStart = (e: TouchEvent) => {
      checkCanPull();
      if (!canPull) return;

      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      isPullingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      // Only allow pulling down (positive deltaY)
      if (deltaY > 0 && canPull) {
        e.preventDefault(); // Prevent default scroll behavior
        
        if (!isPullingRef.current) {
          setIsPulling(true);
          isPullingRef.current = true;
        }

        // Apply resistance after threshold
        const distance = deltaY > threshold 
          ? threshold + (deltaY - threshold) * resistance
          : deltaY;
        
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;

      setIsPulling(false);
      isPullingRef.current = false;

      // Trigger refresh if pulled past threshold
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(0);
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Pull to refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        // Snap back
        setPullDistance(0);
      }
    };

    // Listen for scroll to check if we're at top
    window.addEventListener('scroll', checkCanPull, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkCanPull);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, canPull, threshold, resistance, onRefresh]); // Removed pullDistance from dependencies

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    canPull,
  };
}

