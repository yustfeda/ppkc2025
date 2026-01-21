import React from 'react';
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
  { page: 'messages', label: 'Pesan Chat', icon: 'fas fa-paper-plane', roles: ['user'] },
  { page: 'profile', label: 'Profil & Pendaftaran', icon: 'fas fa-user-circle', roles: ['user'] },
  { page: 'registration', label: 'Proses Seleksi', icon: 'fas fa-tasks', roles: ['user'] },
  { page: 'status', label: 'Status Kelulusan', icon: 'fas fa-award', roles: ['user'] },
  { page: 'contact', label: 'Hubungi Kami', icon: 'fas fa-address-book', roles: ['guest', 'user'] },
];

interface SidebarProps {
  isOpen: boolean;
  currentPage: PublicPage;
  setCurrentPage: (page: PublicPage) => void;
  toggleSidebar: () => void;
  user: User | null;
  onLogout: () => void;
  isSelectionFinished: boolean;
  managedButtons: ManagedButton[];
  onManagedButtonClick: (button: ManagedButton) => void;
  loginActive: boolean;
  unreadMessages: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, setCurrentPage, toggleSidebar, user, onLogout, isSelectionFinished, managedButtons, onManagedButtonClick, loginActive, unreadMessages }) => {
  const handleNavigation = (page: PublicPage) => {
    setCurrentPage(page);
    if (window.innerWidth < 1024) toggleSidebar();
  };

  const handleManagedButtonClick = (button: ManagedButton) => {
    onManagedButtonClick(button);
    if (window.innerWidth < 1024) toggleSidebar();
  };

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
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar Container - FIXED on desktop, DRAWER on mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-brand-primary border-r border-gray-100 dark:border-gray-800 shadow-2xl lg:shadow-none z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 sm:p-6 flex flex-col h-full">
            {/* Logo Area */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
                <div onClick={() => handleNavigation('home')} className="cursor-pointer">
                    <AnimatedLogo />
                </div>
                <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-red-500 p-2">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow overflow-y-auto -mx-2 px-2 custom-scrollbar">
                <ul className="space-y-1">
                    <li className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Menu Utama</li>
                    {visibleNavItems.map(item => (
                    <li key={item.page}>
                        <button
                        onClick={() => handleNavigation(item.page)}
                        className={`group relative w-full flex items-center p-3 rounded-xl transition-all duration-200 text-sm font-semibold
                            ${currentPage === item.page 
                                ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/30 scale-[1.02]' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-brand-secondary dark:hover:text-white'}`}
                        >
                        <i className={`${item.icon} text-lg w-8 transition-transform group-hover:scale-110`}></i>
                        <span className="ml-2 truncate">{item.label}</span>
                        
                        {item.page === 'messages' && unreadMessages > 0 && (
                                <span className="absolute right-3 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-bounce">
                                    {unreadMessages}
                                </span>
                        )}
                        </button>
                    </li>
                    ))}
                </ul>

                {managedButtons.length > 0 && (
                    <div className="mt-8">
                    <h3 className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tautan Cepat</h3>
                    <ul className="space-y-1">
                        {managedButtons.map(button => (
                        <li key={button.id}>
                            <button
                            onClick={() => handleManagedButtonClick(button)}
                            className="w-full flex items-center p-3 rounded-xl transition-all duration-200 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-brand-secondary dark:hover:text-white"
                            >
                            <i className={`${button.icon} text-lg w-8`}></i>
                            <span className="ml-2 truncate">{button.label}</span>
                            </button>
                        </li>
                        ))}
                    </ul>
                    </div>
                )}
            </nav>

            {/* User Profile Summary / Desktop Login Button */}
            <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                {user ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center text-white font-bold text-sm">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-brand-primary dark:text-white truncate">{user.displayName || user.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Siswa Terdaftar</p>
                        </div>
                        <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Logout">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                ) : (
                    loginActive && (
                        <button 
                            onClick={() => handleNavigation('login')} 
                            className="w-full bg-brand-primary dark:bg-brand-secondary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-sm"
                        >
                            <i className="fas fa-sign-in-alt"></i>
                            <span>Masuk / Daftar</span>
                        </button>
                    )
                )}
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;