import React, { useState } from 'react';
import type { AdminPage } from '../../types';

const ThemeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    const toggleTheme = () => {
        const newIsDark = !isDarkMode;
        setIsDarkMode(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="btn-no-lift p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-brand-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
        >
            <i className={`text-xl ${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}`}></i>
        </button>
    );
};

interface AdminHeaderProps {
  currentPage: AdminPage;
  setCurrentPage: (page: AdminPage) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  notificationBadge?: number;
  showConfirmation: (message: string, onConfirm: () => void) => void;
  messageBadge: number;
  onMessageIconClick: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar, isSidebarOpen, messageBadge, onMessageIconClick }) => {
    
    return (
      <header className="bg-white dark:bg-brand-primary text-gray-800 dark:text-white shadow-sm border-b border-gray-100 dark:border-none h-16 sticky top-0 z-30 flex-shrink-0">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            
            <div className="flex items-center gap-4">
                 {/* Mobile Menu Button */}
                <button
                    onClick={toggleSidebar}
                    className="btn-no-lift lg:hidden p-2 -ml-2 text-gray-500 dark:text-gray-300 hover:text-brand-primary dark:hover:text-white focus:outline-none transition-colors"
                    aria-label="Open main menu"
                >
                    <i className="fas fa-bars text-2xl"></i>
                </button>
                
                {/* Title */}
                <span className="text-lg font-bold font-quicksand tracking-wider lg:hidden uppercase text-brand-primary dark:text-white">ADMIN PANEL</span>
            </div>

            <div className="flex items-center space-x-4">
                 {/* Messages Icon */}
                 <button
                    onClick={onMessageIconClick}
                    className="btn-no-lift relative p-2 text-gray-500 dark:text-gray-300 hover:text-brand-primary dark:hover:text-white transition-colors"
                    title="Pesan"
                 >
                     <i className="fas fa-paper-plane text-xl"></i>
                     {messageBadge > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">{messageBadge}</span>
                     )}
                 </button>

                 <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 mx-2 hidden lg:block"></div>
                 <ThemeToggle />
            </div>
        </div>
      </header>
    );
};

export default AdminHeader;