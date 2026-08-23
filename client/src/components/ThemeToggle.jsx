import { useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { activeTheme, applyTheme } from '../themeMode';
import IconButton from './ui/IconButton';

// Suppressing transitions for a moment stops every element animating between
// the two palettes at once, which reads as a flash rather than a change
function swapWithoutFlashing(next) {
  const root = document.documentElement;

  root.classList.add('theme-swapping');
  applyTheme(next);

  // A hidden tab throttles rAF to nothing and the class would stick, so a
  // timeout clears it as well
  const done = () => root.classList.remove('theme-swapping');

  requestAnimationFrame(done);
  setTimeout(done, 200);
}

function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(activeTheme);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';

    swapWithoutFlashing(next);
    setTheme(next);
  };

  return (
    <IconButton
      label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      onClick={toggle}
      className={className}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}

export default ThemeToggle;
