
import React, { useState, useEffect } from 'react';
import type { AdminPage } from '../../types';

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
    isDesktopCollapsed: boolean;
    toggleDesktopCollapse: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
    currentPage, 
    setCurrentPage, 
    isOpen, 
    toggleSidebar, 
    notificationBadge, 
    messageBadge,
    onLogout,
    isDesktopCollapsed,
    toggleDesktopCollapse
}) => {
    
    // Mobile Sidebar (Drawer)
    const MobileSidebar = () => (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            />
            <div className={`fixed top-0 left-0 h-full w-64 bg-brand-primary text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex justify-between items-center border-b border-blue-800">
                    <span className="font-bold text-xl font-orbitron">Admin Menu</span>
                    <button onClick={toggleSidebar} className="text-gray-300 hover:text-white">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <nav className="p-4 overflow-y-auto h-[calc(100%-80px)]">
                    <ul className="space-y-2">
                        {adminNavItems.map(item => (
                            <li key={item.page}>
                                <button
                                    onClick={() => { setCurrentPage(item.page); toggleSidebar(); }}
                                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentPage === item.page ? 'bg-brand-secondary text-white shadow-md' : 'text-gray-300 hover:bg-brand-secondary/30 hover:text-white'}`}
                                >
                                    <i className={`${item.icon} w-6 text-center`}></i>
                                    <span className="ml-3 font-medium">{item.label}</span>
                                    {item.page === 'users' && notificationBadge ? (
                                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notificationBadge}</span>
                                    ) : null}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-blue-800 bg-brand-primary">
                    <button onClick={onLogout} className="w-full flex items-center p-2 text-red-400 hover:text-red-300 transition-colors">
                        <i className="fas fa-sign-out-alt w-6"></i>
                        <span className="ml-3 font-bold">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );

    // Desktop Sidebar (Collapsible)
    const DesktopSidebar = () => (
        <div className={`hidden lg:flex flex-col h-screen bg-brand-primary text-white shadow-xl transition-all duration-300 ease-in-out sticky top-0 ${isDesktopCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center h-16 border-b border-blue-800 ${isDesktopCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
                {!isDesktopCollapsed && <span className="font-bold text-lg font-orbitron tracking-wider">ADMIN PANEL</span>}
                <button 
                    onClick={toggleDesktopCollapse} 
                    className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                    title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <i className={`fas ${isDesktopCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar">
                <ul className="space-y-1 px-2">
                    {adminNavItems.map(item => (
                        <li key={item.page}>
                            <button
                                onClick={() => setCurrentPage(item.page)}
                                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative
                                    ${currentPage === item.page ? 'bg-brand-secondary text-white shadow-lg' : 'text-gray-400 hover:bg-brand-secondary/20 hover:text-white'}
                                    ${isDesktopCollapsed ? 'justify-center' : ''}
                                `}
                                title={isDesktopCollapsed ? item.label : ''}
                            >
                                <i className={`${item.icon} text-lg ${isDesktopCollapsed ? '' : 'w-8 text-center'}`}></i>
                                {!isDesktopCollapsed && (
                                    <span className="ml-2 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">{item.label}</span>
                                )}
                                {isDesktopCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                                
                                {/* Badges */}
                                {item.page === 'users' && notificationBadge && notificationBadge > 0 && (
                                    <span className={`bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center
                                        ${isDesktopCollapsed ? 'absolute top-1 right-1 w-4 h-4' : 'ml-auto px-2 py-0.5'}
                                    `}>
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
                    className={`w-full flex items-center rounded-lg transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300
                        ${isDesktopCollapsed ? 'justify-center p-3' : 'p-3'}
                    `}
                    title="Logout"
                >
                    <i className="fas fa-sign-out-alt text-lg"></i>
                    {!isDesktopCollapsed && <span className="ml-3 font-bold">Logout</span>}
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
