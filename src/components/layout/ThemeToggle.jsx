import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-sunken hover:text-ink ${className}`}
    >
      {dark ? <Sun className="size-[1.15rem]" /> : <Moon className="size-[1.15rem]" />}
    </button>
  );
}
