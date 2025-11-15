import React from 'react';
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
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, setCurrentPage, toggleSidebar, user, onLogout, isSelectionFinished, managedButtons, onManagedButtonClick, loginActive }) => {
  const handleNavigation = (page: PublicPage) => {
    setCurrentPage(page);
    toggleSidebar();
  };

  const handleManagedButtonClick = (button: ManagedButton) => {
    onManagedButtonClick(button);
    toggleSidebar();
  };

  const handleLogout = () => {
    onLogout();
    toggleSidebar();
  }
  
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
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      ></div>

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
          <span className="text-lg font-bold text-brand-dark dark:text-white">Menu</span>
          <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:text-brand-secondary dark:text-gray-300">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>
        <nav className="p-2 flex flex-col h-[calc(100%-4.5rem)]">
          <ul className="flex-grow">
            {visibleNavItems.map(item => (
              <li key={item.page}>
                <button
                  onClick={() => handleNavigation(item.page)}
                  className={`w-full text-left flex items-center p-3 rounded-lg my-1 transition-colors text-sm ${currentPage === item.page ? 'bg-blue-100 dark:bg-blue-900/50 text-brand-secondary dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <i className={`${item.icon} text-lg w-8`}></i>
                  <span className="ml-3 font-semibold">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          {managedButtons.length > 0 && (
            <div className="p-2 border-t dark:border-gray-700">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tautan Cepat</h3>
              <ul>
                {managedButtons.map(button => (
                  <li key={button.id}>
                    <button
                      onClick={() => handleManagedButtonClick(button)}
                      className="w-full text-left flex items-center p-3 rounded-lg my-1 transition-colors text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <i className={`${button.icon} text-lg w-8`}></i>
                      <span className="ml-3 font-semibold">{button.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="p-2 border-t dark:border-gray-700 mt-auto">
            { user ? (
                <button onClick={handleLogout} className="w-full text-left flex items-center p-3 rounded-lg my-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                    <i className="fas fa-sign-out-alt text-lg w-8"></i>
                    <span className="ml-3 font-semibold">Logout</span>
                </button>
            ) : (
                <>
                {loginActive && (
                  <button onClick={() => handleNavigation('login')} className="w-full text-left flex items-center p-3 rounded-lg my-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                      <i className="fas fa-sign-in-alt text-lg w-8"></i>
                      <span className="ml-3 font-semibold">Daftar / Masuk</span>
                  </button>
                )}
                </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;