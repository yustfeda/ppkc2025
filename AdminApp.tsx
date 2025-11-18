import React, { useState, useEffect, useCallback } from 'react';
import type { AdminPage, AdminPageProps, Notification, User, RegistrationData, ConfirmationState, AdminConfig, ChatThread } from './types';
import { getAdminConfig, getRegistrations, onAuthChange, listenToAllChatThreads, sendMessage, deleteMessage, markThreadAsRead, clearChatThread } from './services/firebase';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProfile from './components/admin/AdminProfile';
import AdminManageUsers from './components/admin/AdminManageUsers';
import AdminRecap from './components/admin/AdminRecap';
import AdminManageStages from './components/admin/AdminManageStages';
import AdminSettings from './components/admin/AdminSettings';
import AdminWelcomePopup from './components/admin/AdminWelcomePopup';
import AdminManageAnnouncements from './components/admin/AdminManageAnnouncements';
import AdminManageHighlights from './components/admin/AdminManageHighlights';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminManageButtons from './components/admin/AdminManageButtons';
import MessagePopup from './components/shared/MessagePopup';

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
    const [currentPage, setCurrentPage] = useState<AdminPage>(() => (sessionStorage.getItem('adminCurrentPage') as AdminPage) || 'dashboard');
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [showAdminWelcome, setShowAdminWelcome] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });
    const [notificationBadge, setNotificationBadge] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allRegistrations, setAllRegistrations] = useState<RegistrationData[]>([]);
    
    // Messaging States
    const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
    const [chatThreads, setChatThreads] = useState<Record<string, ChatThread>>({});
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [messageBadge, setMessageBadge] = useState(0);

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
    
    useEffect(() => {
        sessionStorage.setItem('adminCurrentPage', currentPage);
    }, [currentPage]);


    const fetchAdminData = useCallback(() => {
        getAdminConfig().then(setAdminConfig);
        getRegistrations().then(regs => {
            const regsArray = Object.values(regs);
            setAllRegistrations(regsArray);
            const pendingCount = regsArray.filter(r => r.status === 'Terkirim').length;
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
        const unsubscribeAuth = onAuthChange(setCurrentUser);
        const unsubscribeChats = listenToAllChatThreads((threads) => {
            setChatThreads(threads);
            const unreadCount = Object.values(threads).filter(t => t.unreadByAdmin).length;
            setMessageBadge(unreadCount);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeChats();
        };
    }, [fetchAdminData]);

    const handleSelectThread = (userId: string | null) => {
        setSelectedThreadId(userId);
        if (userId) {
            markThreadAsRead(userId, 'admin');
        }
    };

    const handleSendMessage = async (targetUserId: string, text: string, isGlobal: boolean) => {
        if (!currentUser) return;
        const targetUser = allRegistrations.find(r => r.uid === targetUserId);
        const targetUserEmail = targetUser?.email || 'Global';
        await sendMessage(targetUserId, targetUserEmail, text, 'admin', isGlobal);
        if (isGlobal) {
            showNotification('Pesan global berhasil dikirim ke semua pengguna.', 'success');
        }
    };
    
    const handleDeleteMessage = async (targetUserId: string, messageId: string) => {
        await deleteMessage(targetUserId, messageId);
        showNotification("Pesan dihapus.", "success");
    };

    const handleClearThread = async (userId: string) => {
        await clearChatThread(userId);
        showNotification("Seluruh percakapan telah dihapus.", "success");
    };
    
    const handleLogout = () => {
        sessionStorage.setItem('adminLoggedOut', 'true');
        onLogout();
    }

    const selectedThread = selectedThreadId ? chatThreads[selectedThreadId] : null;
    let threadForPopup = selectedThread;

    // If a user is selected to start a new chat but no thread exists, create a placeholder.
    // This fixes the bug where the message input was disabled for new conversations.
    if (selectedThreadId && !selectedThread) {
        const registration = allRegistrations.find(r => r.uid === selectedThreadId);
        if (registration) {
            threadForPopup = {
                userId: registration.uid,
                userEmail: registration.email,
                messages: {},
                unreadByAdmin: false,
                unreadByUser: false,
            };
        }
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
            case 'highlights': return <AdminManageHighlights {...pageProps} />;
            case 'attendance': return <AdminAttendance {...pageProps} />;
            case 'buttons': return <AdminManageButtons {...pageProps} />;
            default: return <AdminDashboard />;
        }
    };
    
    return (
        <div className="font-sans bg-brand-light dark:bg-brand-dark min-h-screen text-sm">
            {notification && <NotificationPopup notification={notification} onClose={() => setNotification(null)} />}
            {showAdminWelcome && <AdminWelcomePopup onClose={() => setShowAdminWelcome(false)} notificationCount={notificationBadge} />}
            
            {/* Messaging Modal */}
            {isMessagePopupOpen && (
                 <MessagePopup
                    user={currentUser}
                    isAdmin={true}
                    isOpen={isMessagePopupOpen}
                    onClose={() => setIsMessagePopupOpen(false)}
                    threads={chatThreads}
                    allRegistrations={allRegistrations}
                    currentThread={threadForPopup}
                    onSelectThread={handleSelectThread}
                    onSendMessage={handleSendMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onClearThread={handleClearThread}
                    showConfirmation={showConfirmation}
                />
            )}
           
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
                messageBadge={messageBadge}
                onMessageIconClick={() => setIsMessagePopupOpen(true)}
            >
                {renderPage()}
            </AdminLayout>
        </div>
    );
};

export default AdminApp;