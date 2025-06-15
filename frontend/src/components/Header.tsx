// src/components/Header.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Sun, Moon, Calendar, List } from 'lucide-react';
import type { TodoFilter } from '@/types';

interface HeaderProps {
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
}

const Header: React.FC<HeaderProps> = ({ filter, onFilterChange }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">
              Persyste
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              filter === 'all'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <List className="h-4 w-4 mr-2" />
            All
          </button>
          
          <button
            onClick={() => onFilterChange('today')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              filter === 'today'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
