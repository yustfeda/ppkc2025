import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';
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
    
    useEffect(() => {
        setIsClosing(false);
    }, [confirmation]);

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
    return (
        <div className="min-h-screen flex flex-col">
            <ConfirmationModal confirmation={confirmation} onCancel={hideConfirmation} />
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
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div key={currentPage} className="animate-fade-in-up">
                    {children}
                </div>
            </main>
            {/* Floating Message Button */}
             <button 
                onClick={onMessageIconClick}
                className="hidden lg:flex fixed left-6 bottom-6 bg-brand-secondary text-white w-14 h-14 rounded-full shadow-lg items-center justify-center z-50 hover:bg-brand-accent transform hover:scale-110 transition-all"
                aria-label="Open Messages"
                title="Buka Pesan"
             >
                <i className="fas fa-paper-plane text-xl"></i>
                {messageBadge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs">{messageBadge}</span>
                )}
            </button>
            <AdminFooter appVersion={appVersion} />
        </div>
    );
};

export default AdminLayout;