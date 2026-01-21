import React, { useState } from 'react';
import type { PublicPage, User, ManagedButton } from '../types';
import AnimatedLogo from './AnimatedLogo';

interface HeaderProps {
  currentPage: PublicPage;
  setCurrentPage: (page: PublicPage) => void;
  toggleSidebar: () => void;
  user: User | null;
  onLogout: () => void;
  isSidebarOpen: boolean;
  isSelectionFinished: boolean;
  managedButtons: ManagedButton[];
  onManagedButtonClick: (button: ManagedButton) => void;
  loginActive: boolean;
  unreadMessages: number;
}

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
            className="btn-no-lift p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" 
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
        >
            <i className={`text-xl ${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}`}></i>
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ toggleSidebar, user, onLogout, isSidebarOpen, loginActive, unreadMessages, setCurrentPage }) => {
  return (
    <header className="bg-white dark:bg-brand-primary shadow-sm sticky top-0 z-30 h-16 lg:h-20 transition-all">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="btn-no-lift lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"
            >
              <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
            <div onClick={() => setCurrentPage('home')} className="lg:hidden cursor-pointer">
               <AnimatedLogo />
            </div>
            <div className="hidden lg:block">
                <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-xs">Portal Seleksi Paskibraka</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            {user ? (
                 <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCurrentPage('messages')}
                        className="btn-no-lift relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                         <i className="fas fa-paper-plane text-xl"></i>
                         {unreadMessages > 0 && (
                            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] border-2 border-white dark:border-brand-primary">{unreadMessages}</span>
                         )}
                    </button>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>
                    <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm">
                        <i className="fas fa-sign-out-alt"></i>
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                 </div>
            ) : (
                <div className="lg:hidden"> {/* Tombol login HANYA tampil di mobile di Header, di Desktop hanya di sidebar */}
                {loginActive && (
                  <button onClick={() => setCurrentPage('login')} className="bg-brand-secondary text-white font-bold py-1.5 px-4 rounded-lg text-xs hover:bg-brand-accent transition-all shadow-md">
                      Masuk
                  </button>
                )}
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;