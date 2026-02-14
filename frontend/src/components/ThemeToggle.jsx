import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('auto');
    else setTheme('light');
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} />;
      case 'dark':
        return <Moon size={20} />;
      default:
        return <Monitor size={20} />;
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 
        bg-medical-gray-100 dark:bg-medical-gray-800 
        hover:bg-medical-gray-200 dark:hover:bg-medical-gray-700
        text-medical-gray-700 dark:text-medical-gray-300 ${className}`}
      title={`Switch to ${theme === 'light' ? 'Dark' : theme === 'dark' ? 'Auto' : 'Light'} mode`}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
