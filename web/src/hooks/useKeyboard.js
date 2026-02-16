import { useEffect } from 'react';

export function useKeyboard(dispatch) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'NEXT_STEP' });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        dispatch({ type: 'NEXT_STEP' });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        dispatch({ type: 'PREV_STEP' });
      } else if (e.key === 'Escape') {
        dispatch({ type: 'CLOSE_TOC' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);
}
