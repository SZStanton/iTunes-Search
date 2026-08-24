import { useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { activeTheme, applyTheme } from '../themeMode';
import IconButton from './ui/IconButton';

// Suppress transitions for a moment, or the whole palette animates at once
// and reads as a flash.
function swapWithoutFlashing(next) {
  const root = document.documentElement;

  root.classList.add('theme-swapping');
  applyTheme(next);

  // A hidden tab throttles rAF, so a timeout clears the class as well.
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
