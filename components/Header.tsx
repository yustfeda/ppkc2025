import React, { useState, useEffect } from 'react';
import type { PublicPage, User, ManagedButton } from '../types';

interface NavItem {
  page: PublicPage;
  label: string;
  icon: string;
  roles: ('guest' | 'user')[];
}

const navItems: NavItem[] = [
  { page: 'home', label: 'Beranda', icon: 'fas fa-home', roles: ['guest', 'user'] },
  { page: 'stages', label: 'Tahapan Seleksi', icon: 'fas fa-list-ol', roles: ['guest', 'user'] },
  { page: 'announcements', label: 'Pengumuman', icon: 'fas fa-bullhorn', roles: ['guest', 'user'] },
  { page: 'registration', label: 'Pendaftaran', icon: 'fas fa-edit', roles: ['user'] },
  { page: 'status', label: 'Status', icon: 'fas fa-award', roles: ['user'] },
  { page: 'profile', label: 'Profil', icon: 'fas fa-user-circle', roles: ['user'] },
  { page: 'contact', label: 'Kontak', icon: 'fas fa-address-book', roles: ['guest', 'user'] },
];

const AnimatedLogo: React.FC = () => {
    const [animate, setAnimate] = useState(true);
    useEffect(() => {
      const interval = setInterval(() => {
        setAnimate(false);
        setTimeout(() => setAnimate(true), 50);
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-shrink-0 flex items-center cursor-pointer">
            <span className="text-xl font-bold">
                <span className="text-orange-500 font-quicksand tracking-wide">PPKC</span>
                <span className="text-brand-logo-blue font-orbitron">
                  202
                  {animate ? (
                     <span className="inline-block animate-logo-5">5</span>
                  ) : (
                     <span className="inline-block">5</span>
                  )}
                </span>
            </span>
        </div>
    );
};

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
        <button onClick={toggleTheme} className="group relative flex flex-col items-center justify-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-secondary transition-colors text-xs"
        >
            <i className={`text-xl ${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}`}></i>
             <span className="absolute top-full mt-2 text-xs font-semibold bg-brand-dark text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
             </span>
        </button>
    );
};


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
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, toggleSidebar, user, onLogout, isSidebarOpen, isSelectionFinished, managedButtons, onManagedButtonClick, loginActive }) => {
  
  const getRole = (): 'user' | 'guest' => {
    return user ? 'user' : 'guest';
  };
  const userRole = getRole();
  
  const visibleNavItems = navItems.filter(item => {
    if (!item.roles.includes(userRole)) return false;
    if (userRole === 'user') {
      if (item.page === 'registration' && isSelectionFinished) return false;
      if (item.page === 'status' && !isSelectionFinished) return false;
    }
    return true;
  });

  return (
    <header className="bg-white dark:bg-brand-primary shadow-md sticky top-0 z-40 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div onClick={() => setCurrentPage('home')}>
             <AnimatedLogo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex items-center space-x-2">
              {visibleNavItems.map(item => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`group relative flex flex-col items-center justify-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-secondary transition-colors text-xs ${currentPage === item.page ? 'text-brand-secondary' : ''}`}
                >
                  <i className={`${item.icon} text-xl`}></i>
                  <span className="absolute top-full mt-2 text-xs font-semibold bg-brand-dark text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              ))}
              {managedButtons.map(button => (
                <button
                  key={button.id}
                  onClick={() => onManagedButtonClick(button)}
                  className="group relative flex flex-col items-center justify-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-secondary transition-colors text-xs"
                >
                  <i className={`${button.icon} text-xl`}></i>
                  <span className="absolute top-full mt-2 text-xs font-semibold bg-brand-dark text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {button.label}
                  </span>
                </button>
              ))}
            </nav>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <ThemeToggle />
            { user ? (
                 <button onClick={onLogout} className="group relative flex flex-col items-center justify-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-secondary transition-colors text-xs">
                    <i className="fas fa-sign-out-alt text-xl"></i>
                    <span className="absolute top-full mt-2 text-xs font-semibold bg-brand-dark text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Logout</span>
                 </button>
            ) : (
                <>
                {loginActive && (
                  <button onClick={() => setCurrentPage('login')} className="bg-brand-secondary text-white font-bold py-1 px-4 rounded-md text-xs hover:bg-brand-accent transition-colors">
                      Daftar/Masuk
                  </button>
                )}
                </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleSidebar}
              className={`hamburger ${isSidebarOpen ? 'is-active' : ''}`}
              aria-label="Open main menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;