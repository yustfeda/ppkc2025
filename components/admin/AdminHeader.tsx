
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
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
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
      <header className="bg-brand-primary text-white shadow-md h-16 sticky top-0 z-30 flex-shrink-0">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            
            <div className="flex items-center gap-4">
                 {/* Mobile Menu Button */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 -ml-2 text-gray-300 hover:text-white focus:outline-none"
                    aria-label="Open main menu"
                >
                    <i className="fas fa-bars text-2xl"></i>
                </button>
                
                {/* Title (Visible mostly on mobile since sidebar has logo on desktop) */}
                <span className="text-lg font-bold font-orbitron tracking-wider lg:hidden">ADMIN PANEL</span>
            </div>

            <div className="flex items-center space-x-4">
                 {/* Messages Icon (Visible on all screens now) */}
                 <button
                    onClick={onMessageIconClick}
                    className="relative p-2 text-gray-300 hover:text-white transition-colors"
                    title="Pesan"
                 >
                     <i className="fas fa-paper-plane text-xl"></i>
                     {messageBadge > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">{messageBadge}</span>
                     )}
                 </button>

                 <div className="h-6 w-px bg-gray-600 mx-2 hidden lg:block"></div>
                 <ThemeToggle />
            </div>
        </div>
      </header>
    );
};

export default AdminHeader;
