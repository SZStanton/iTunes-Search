import { createContext, useCallback, useMemo, useState } from 'react';

const OverlayContext = createContext(null);

// A count rather than a boolean, since a lightbox can open over a drawer and
// the first one to close would otherwise clear the flag for both
function OverlayProvider({ children }) {
  const [open, setOpen] = useState(0);

  const register = useCallback(() => {
    setOpen(count => count + 1);

    return () => setOpen(count => count - 1);
  }, []);

  const value = useMemo(
    () => ({ overlayOpen: open > 0, register }),
    [open, register],
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}

export { OverlayContext, OverlayProvider };
