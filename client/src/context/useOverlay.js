import { useContext, useEffect } from 'react';
import { OverlayContext } from './OverlayContext';

// Missing provider is not worth throwing over. Nothing here is load bearing,
// it only tells edge paging and the arrow keys to stay out of the way
function useOverlayOpen() {
  return useContext(OverlayContext)?.overlayOpen ?? false;
}

// Called by anything covering the page, for as long as it is covering it
function useRegisterOverlay(open) {
  const register = useContext(OverlayContext)?.register;

  useEffect(() => {
    if (!open || !register) return;

    return register();
  }, [open, register]);
}

export { useOverlayOpen, useRegisterOverlay };
