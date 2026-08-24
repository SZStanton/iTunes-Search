import { useContext, useEffect } from 'react';
import { OverlayContext } from './OverlayContext';

// A missing provider is not worth throwing over. It only tells edge paging
// and the arrow keys to stay out of the way.
function useOverlayOpen() {
  return useContext(OverlayContext)?.overlayOpen ?? false;
}

// Called by anything covering the page, for as long as it covers it.
function useRegisterOverlay(open) {
  const register = useContext(OverlayContext)?.register;

  useEffect(() => {
    if (!open || !register) return;

    return register();
  }, [open, register]);
}

export { useOverlayOpen, useRegisterOverlay };
