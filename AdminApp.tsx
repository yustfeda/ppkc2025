import React, { useState, useEffect, useCallback } from 'react';
import type { AdminPage, AdminPageProps, Notification, User, RegistrationData, ConfirmationState, AdminConfig } from './types';
import { getAdminConfig, getRegistrations, onAuthChange } from './services/firebase';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProfile from './components/admin/AdminProfile';
import AdminManageUsers from './components/admin/AdminManageUsers';
import AdminRecap from './components/admin/AdminRecap';
import AdminManageStages from './components/admin/AdminManageStages';
import AdminSettings from './components/admin/AdminSettings';
import AdminWelcomePopup from './components/admin/AdminWelcomePopup';
import AdminManageAnnouncements from './components/admin/AdminManageAnnouncements';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminManageButtons from './components/admin/AdminManageButtons';

interface AdminAppProps {
    onLogout: () => void;
}

const NotificationPopup: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

     const theme = {
        success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-500', icon: 'fa-exclamation-triangle' }
    };

    if (!notification) return null;

    return (
        <div className="fixed top-20 right-4 z-[1001] animate-slide-in">
            <div className={`flex items-center gap-4 p-4 rounded-lg shadow-lg text-white ${theme[notification.type].bg}`}>
                 <i className={`fas ${theme[notification.type].icon} text-xl`}></i>
                 <p className="text-sm font-medium">{notification.message}</p>
                 <button onClick={onClose} className="ml-4 text-white/80 hover:text-white">&times;</button>
            </div>
        </div>
    );
};

const AdminApp: React.FC<AdminAppProps> = ({ onLogout }) => {
    const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [showAdminWelcome, setShowAdminWelcome] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });
    const [notificationBadge, setNotificationBadge] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error') => {
        setNotification({ id: Date.now(), message, type });
    }, []);
    
    const showConfirmation = useCallback((message: string, onConfirm: () => void) => {
        setConfirmation({ isOpen: true, message, onConfirm: () => {
            onConfirm();
            hideConfirmation();
        }});
    }, []);

    const hideConfirmation = () => setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const fetchAdminData = useCallback(() => {
        getAdminConfig().then(setAdminConfig);
        getRegistrations().then(regs => {
            const pendingCount = Object.values(regs).filter(r => r.status === 'Terkirim').length;
            setNotificationBadge(pendingCount);
        });
    }, []);

    useEffect(() => {
        fetchAdminData();
        const hasSeenWelcome = sessionStorage.getItem('seenAdminWelcome');
        if (!hasSeenWelcome) {
            setShowAdminWelcome(true);
            sessionStorage.setItem('seenAdminWelcome', 'true');
        }
        const unsubscribe = onAuthChange(setCurrentUser);
        return () => unsubscribe();
    }, [fetchAdminData]);

    
    const handleLogout = () => {
        sessionStorage.setItem('adminLoggedOut', 'true');
        onLogout();
    }

    const renderPage = () => {
        const pageProps: AdminPageProps = { showNotification, showConfirmation, user: currentUser };
        switch (currentPage) {
            case 'dashboard': return <AdminDashboard />;
            case 'profile': return <AdminProfile {...pageProps} />;
            case 'users': return <AdminManageUsers {...pageProps} onUpdate={fetchAdminData} />;
            case 'rekap': return <AdminRecap {...pageProps} />;
            case 'stages': return <AdminManageStages {...pageProps} />;
            case 'announcements': return <AdminManageAnnouncements {...pageProps} />;
            case 'settings': return <AdminSettings onThemeChange={fetchAdminData} {...pageProps} />;
            case 'attendance': return <AdminAttendance {...pageProps} />;
            case 'buttons': return <AdminManageButtons {...pageProps} />;
            default: return <AdminDashboard />;
        }
    };
    
    return (
        <div className="font-sans bg-brand-light dark:bg-brand-dark min-h-screen text-sm">
            {notification && <NotificationPopup notification={notification} onClose={() => setNotification(null)} />}
            {showAdminWelcome && <AdminWelcomePopup onClose={() => setShowAdminWelcome(false)} notificationCount={notificationBadge} />}
            <AdminLayout 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage} 
                onLogout={handleLogout}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                notificationBadge={notificationBadge}
                confirmation={confirmation}
                hideConfirmation={hideConfirmation}
                showConfirmation={showConfirmation}
                appVersion={adminConfig?.appVersion}
            >
                {renderPage()}
            </AdminLayout>
        </div>
    );
};

export default AdminApp;