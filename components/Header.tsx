import React, { useState, useRef, useEffect } from 'react';
import type { PublicPage, User, ManagedButton } from '../types';
import AnimatedLogo from './AnimatedLogo';

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
  { page: 'profile', label: 'Profil & Pendaftaran', icon: 'fas fa-user-circle', roles: ['user'] },
  { page: 'registration', label: 'Proses Seleksi', icon: 'fas fa-tasks', roles: ['user'] },
  { page: 'status', label: 'Status Kelulusan', icon: 'fas fa-award', roles: ['user'] },
  { page: 'contact', label: 'Kontak', icon: 'fas fa-address-book', roles: ['guest', 'user'] },
];

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
  navigateToAuth: (isLogin: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, toggleSidebar, user, onLogout, isSidebarOpen, isSelectionFinished, managedButtons, onManagedButtonClick, loginActive, navigateToAuth }) => {
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setIsAuthMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
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
                  <div className="relative" ref={authMenuRef}>
                    <button 
                      onClick={() => setIsAuthMenuOpen(prev => !prev)}
                      className="bg-brand-secondary text-white dark:bg-brand-light dark:text-brand-primary font-bold py-1 px-4 rounded-md text-xs hover:bg-brand-accent dark:hover:bg-gray-200 transition-colors"
                    >
                      Masuk
                    </button>
                    {isAuthMenuOpen && (
                      <div className={`auth-dropdown w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ${isAuthMenuOpen ? 'animate-fade-in-scale' : 'animate-fade-out-scale'}`}>
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                           <a href="#" onClick={(e) => { e.preventDefault(); navigateToAuth(false); setIsAuthMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                             <i className="fas fa-user-plus w-6"></i> Buat Akun Baru
                          </a>
                          <a href="#" onClick={(e) => { e.preventDefault(); navigateToAuth(true); setIsAuthMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                            <i className="fas fa-sign-in-alt w-6"></i> Masuk Akun
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
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
