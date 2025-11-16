import React, { useState } from 'react';
import type { AdminPage } from '../../types';

type AdminNavItem = { page: AdminPage; label: string; icon: string; };

const adminNavItems: AdminNavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { page: 'highlights', label: 'Kelola Highlight', icon: 'fas fa-star' },
  { page: 'users', label: 'Kelola User', icon: 'fas fa-users-cog' },
  { page: 'stages', label: 'Kelola Tahapan', icon: 'fas fa-tasks' },
  { page: 'buttons', label: 'Kelola Tombol', icon: 'fas fa-plus-square' },
  { page: 'announcements', label: 'Pengumuman', icon: 'fas fa-bullhorn' },
  { page: 'rekap', label: 'Rekap Peserta', icon: 'fas fa-file-alt' },
  { page: 'attendance', label: 'Daftar Hadir', icon: 'fas fa-clipboard-check' },
  { page: 'settings', label: 'Pengaturan', icon: 'fas fa-cog' },
  { page: 'profile', label: 'Profil', icon: 'fas fa-user-shield' },
];

const ThemeToggle: React.FC<{isMobile?: boolean}> = ({ isMobile = false }) => {
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

    if (isMobile) {
        return (
             <button
              onClick={toggleTheme}
              className="w-full text-left flex items-center p-3 rounded-md my-1 transition-colors text-sm font-medium hover:bg-brand-secondary/30"
            >
              <i className={`text-lg w-8 text-center ${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}`}></i>
              <span className="ml-3 font-semibold">{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className="group relative flex flex-col items-center justify-center w-16 h-14 rounded-md transition-colors hover:bg-brand-secondary/30"
            aria-label="Toggle Theme"
        >
            <i className={`text-xl ${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}`}></i>
            <span className="absolute top-full mt-2 text-xs font-semibold bg-gray-900 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            </span>
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
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ currentPage, setCurrentPage, onLogout, isSidebarOpen, toggleSidebar, notificationBadge, showConfirmation }) => {
    const handleNavigation = (page: AdminPage) => {
        setCurrentPage(page);
        if (isSidebarOpen) {
            toggleSidebar();
        }
    };
    
    const confirmLogout = () => {
        showConfirmation('Anda yakin ingin keluar dari Admin Panel?', onLogout);
    }
    
    return (
    <>
      <header className="bg-brand-primary text-white shadow-lg sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo - Now acts as a logout button */}
            <div onClick={() => setCurrentPage('dashboard')} className="flex items-center cursor-pointer" title="Go to Dashboard">
              <h1 className="text-lg font-bold flex items-center gap-4">
                  <span className="text-white">Admin Panel</span>
                  <span className="text-gray-400 text-sm">|</span>
                  <span className="text-xl">
                    <span className="text-orange-500">PPKC</span>
                    <span className="text-brand-logo-blue">2025</span>
                  </span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <nav className="flex items-center space-x-1">
                {adminNavItems.map(item => (
                  <button
                    key={item.page}
                    onClick={() => handleNavigation(item.page)}
                    className={`group relative flex flex-col items-center justify-center w-16 h-14 rounded-md transition-colors ${
                        currentPage === item.page ? 'bg-brand-secondary/50 text-white' : 'hover:bg-brand-secondary/30'
                    }`}
                  >
                    <i className={`${item.icon} text-xl`}></i>
                    {item.page === 'users' && notificationBadge && notificationBadge > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center">{notificationBadge}</span>
                        </span>
                    )}
                    <span className="absolute top-full mt-2 text-xs font-semibold bg-gray-900 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>
              <div className="h-8 w-px bg-gray-600 mx-3"></div>
              <ThemeToggle />
              <button
                onClick={confirmLogout}
                className="group relative flex flex-col items-center justify-center w-16 h-14 rounded-md transition-colors hover:bg-red-500/50"
                aria-label="Logout"
                >
                <i className="fas fa-sign-out-alt text-xl"></i>
                <span className="absolute top-full mt-2 text-xs font-semibold bg-gray-900 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Logout
                </span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleSidebar}
                className={`hamburger ${isSidebarOpen ? 'is-active' : ''}`}
                aria-label="Open main menu"
              >
                <span className="hamburger-line bg-white"></span>
                <span className="hamburger-line bg-white"></span>
                <span className="hamburger-line bg-white"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      ></div>

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-brand-primary text-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <span className="text-lg font-bold">Admin Menu</span>
          <button onClick={toggleSidebar} className="p-2 text-gray-300 hover:text-white">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        <nav className="p-2 flex flex-col h-[calc(100%-4.5rem)]">
          <ul className="flex-grow">
            {adminNavItems.map(item => (
              <li key={item.page}>
                <button
                  onClick={() => handleNavigation(item.page)}
                  className={`w-full text-left flex items-center p-3 rounded-md my-1 transition-colors text-sm font-medium relative ${
                      currentPage === item.page ? 'bg-brand-secondary text-white' : 'hover:bg-brand-secondary/30'
                  }`}
                >
                  <i className={`${item.icon} text-lg w-8 text-center`}></i>
                  <span className="ml-3 font-semibold">{item.label}</span>
                   {item.page === 'users' && notificationBadge && notificationBadge > 0 && (
                      <span className="absolute right-3 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{notificationBadge}</span>
                   )}
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t border-gray-700">
            <ThemeToggle isMobile={true} />
            <button
                onClick={confirmLogout}
                className="w-full text-left flex items-center p-3 rounded-md my-1 transition-colors text-sm font-medium hover:bg-red-500/50"
            >
                <i className="fas fa-sign-out-alt text-lg w-8 text-center"></i>
                <span className="ml-3 font-semibold">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </>
    );
};

export default AdminHeader;