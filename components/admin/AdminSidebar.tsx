import React, { useState, useEffect } from 'react';
import type { AdminPage } from '../../types';
import { getData } from '../../services/firebase';

interface AdminNavItem {
    page: AdminPage;
    label: string;
    icon: string;
}

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

interface AdminSidebarProps {
    currentPage: AdminPage;
    setCurrentPage: (page: AdminPage) => void;
    isOpen: boolean;
    toggleSidebar: () => void;
    notificationBadge?: number;
    messageBadge?: number;
    onLogout: () => void;
    isDesktopCollapsed?: boolean; 
    toggleDesktopCollapse?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
    currentPage, 
    setCurrentPage, 
    isOpen, 
    toggleSidebar, 
    notificationBadge, 
    onLogout
}) => {
    const [profilePic, setProfilePic] = useState<string | null>(null);

    useEffect(() => {
        const cachedPic = localStorage.getItem('admin_profile_pic');
        if (cachedPic) {
            setProfilePic(cachedPic);
        } else {
            getData<string | null>('adminMetadata/profilePic').then(dbPic => {
                if (dbPic) {
                    setProfilePic(dbPic);
                    localStorage.setItem('admin_profile_pic', dbPic);
                }
            });
        }
    }, [currentPage]); // Refresh on navigation to ensure sync

    const ProfileAvatar = () => (
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-secondary bg-gray-700 flex-shrink-0 flex items-center justify-center">
            {profilePic ? (
                <img src={profilePic} alt="Admin" className="w-full h-full object-cover" />
            ) : (
                <i className="fas fa-user-shield text-xs text-gray-400"></i>
            )}
        </div>
    );
    
    // Mobile Sidebar (Drawer)
    const MobileSidebar = () => (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            />
            <div className={`fixed top-0 left-0 h-full w-64 bg-brand-primary text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex justify-between items-center border-b border-blue-800">
                    <div className="flex items-center gap-2">
                        <ProfileAvatar />
                        <span className="font-bold text-xl font-quicksand">Admin Menu</span>
                    </div>
                    <button onClick={toggleSidebar} className="text-gray-300 hover:text-white p-2">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <nav className="p-4 overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
                    <ul className="space-y-2">
                        {adminNavItems.map(item => (
                            <li key={item.page}>
                                <button
                                    onClick={() => { setCurrentPage(item.page); toggleSidebar(); }}
                                    className={`w-full flex items-center p-3 rounded-lg transition-colors text-sm ${currentPage === item.page ? 'bg-brand-secondary text-white shadow-md' : 'text-gray-300 hover:bg-brand-secondary/30 hover:text-white'}`}
                                >
                                    <i className={`${item.icon} w-6 text-center`}></i>
                                    <span className="ml-3 font-medium">{item.label}</span>
                                    {item.page === 'users' && notificationBadge ? (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{notificationBadge}</span>
                                    ) : null}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-blue-800 bg-brand-primary">
                    <button onClick={onLogout} className="w-full flex items-center p-2 text-red-400 hover:text-red-300 transition-colors text-sm">
                        <i className="fas fa-sign-out-alt w-6"></i>
                        <span className="ml-3 font-bold">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );

    // Desktop Sidebar (Always Full Width)
    const DesktopSidebar = () => (
        <div className={`hidden lg:flex flex-col h-screen bg-brand-primary text-white shadow-xl transition-all duration-300 ease-in-out sticky top-0 w-64`}>
            <div className={`flex items-center h-16 lg:h-20 border-b border-blue-800 px-6 justify-center gap-3`}>
                <ProfileAvatar />
                <span className="font-bold text-lg font-quicksand tracking-wider uppercase">ADMIN PANEL</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar">
                <ul className="space-y-1 px-3">
                    {adminNavItems.map(item => (
                        <li key={item.page}>
                            <button
                                onClick={() => setCurrentPage(item.page)}
                                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative text-sm
                                    ${currentPage === item.page ? 'bg-brand-secondary text-white shadow-lg' : 'text-gray-400 hover:bg-brand-secondary/20 hover:text-white'}
                                `}
                            >
                                <i className={`${item.icon} text-lg w-8 text-center`}></i>
                                <span className="ml-2 font-medium truncate">{item.label}</span>
                                
                                {item.page === 'users' && notificationBadge && notificationBadge > 0 && (
                                    <span className={`bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-auto px-2 py-0.5`}>
                                        {notificationBadge}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-blue-800">
                <button 
                    onClick={onLogout} 
                    className={`w-full flex items-center rounded-lg transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300 p-3 text-sm`}
                >
                    <i className="fas fa-sign-out-alt text-lg"></i>
                    <span className="ml-3 font-bold">Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <MobileSidebar />
            <DesktopSidebar />
        </>
    );
};

export default AdminSidebar;