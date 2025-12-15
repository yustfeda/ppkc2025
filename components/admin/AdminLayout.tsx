
import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';
import AdminSidebar from './AdminSidebar';
import type { AdminPage, ConfirmationState } from '../../types';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPage: AdminPage;
    setCurrentPage: (page: AdminPage) => void;
    onLogout: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    notificationBadge?: number;
    confirmation: ConfirmationState;
    hideConfirmation: () => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    appVersion?: string;
    messageBadge: number;
    onMessageIconClick: () => void;
}

const ConfirmationModal: React.FC<{ confirmation: ConfirmationState; onCancel: () => void; }> = ({ confirmation, onCancel }) => {
    const [isClosing, setIsClosing] = useState(false);
    
    // Reset closing state when modal opens
    React.useEffect(() => {
        if (confirmation.isOpen) setIsClosing(false);
    }, [confirmation.isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onCancel(), 300);
    };

    if (!confirmation.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1002] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4">Konfirmasi Tindakan</h3>
                <p className="text-gray-800 dark:text-white mb-6">{confirmation.message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={handleClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-300">Tidak</button>
                    <button onClick={confirmation.onConfirm} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700">Ya, Lanjutkan</button>
                </div>
            </div>
        </div>
    );
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage, setCurrentPage, onLogout, isSidebarOpen, toggleSidebar, notificationBadge, confirmation, hideConfirmation, showConfirmation, appVersion, messageBadge, onMessageIconClick }) => {
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    return (
        <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
            <ConfirmationModal confirmation={confirmation} onCancel={hideConfirmation} />
            
            {/* Sidebar Component handling both Mobile and Desktop logic */}
            <AdminSidebar 
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                notificationBadge={notificationBadge}
                messageBadge={messageBadge}
                onLogout={onLogout}
                isDesktopCollapsed={isDesktopCollapsed}
                toggleDesktopCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <AdminHeader 
                    currentPage={currentPage} 
                    setCurrentPage={setCurrentPage} 
                    onLogout={onLogout}
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notificationBadge={notificationBadge}
                    showConfirmation={showConfirmation}
                    messageBadge={messageBadge}
                    onMessageIconClick={onMessageIconClick}
                />
                
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div key={currentPage} className="animate-fade-in-up max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
                
                <AdminFooter appVersion={appVersion} />
            </div>
        </div>
    );
};

export default AdminLayout;
