import React, { useState, useEffect, useCallback } from 'react';
import type { AdminPage, AdminPageProps, Notification, User, RegistrationData, ConfirmationState, AdminConfig, ChatThread, ReplyState, InboxMessage } from './types';
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
import AdminMessageHub from './components/admin/AdminMessageHub';
import AdminInboxPopup from './components/admin/AdminInboxPopup';
import AdminReplyPopup from './components/admin/AdminReplyPopup';

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
    
    // Messaging States
    const [isMessageHubOpen, setIsMessageHubOpen] = useState(false);
    const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [replyState, setReplyState] = useState<ReplyState>({ isOpen: false, messageToReplyTo: null });
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

    const handleSelectThread = (userId: string) => {
        setSelectedThreadId(userId);
        markThreadAsRead(userId, 'admin');
    };

    const handleSendMessage = async (targetUserId: string, text: string, isGlobal: boolean) => {
        if (!currentUser) return;
        const targetUserEmail = chatThreads[targetUserId]?.userEmail || 'Global';
        await sendMessage(targetUserId, targetUserEmail, text, 'admin', isGlobal);
    };
    
    const handleReplySend = async (text: string) => {
        if (!replyState.messageToReplyTo || !currentUser) return;
        const { userId, userEmail } = replyState.messageToReplyTo;
        await sendMessage(userId, userEmail, text, 'admin', false);
        setReplyState({ isOpen: false, messageToReplyTo: null });
        showNotification(`Balasan terkirim ke ${userEmail}`, 'success');
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
    
    const openChat = (userId: string | null = null) => {
        setIsMessageHubOpen(false);
        setIsInboxOpen(false);
        if (userId) {
            handleSelectThread(userId);
        }
        setIsMessagePopupOpen(true);
    };

    const openInbox = () => {
        setIsMessageHubOpen(false);
        setIsMessagePopupOpen(false);
        setIsInboxOpen(true);
    };

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
            
            {/* Messaging Modals */}
            {isMessageHubOpen && (
                <AdminMessageHub
                    onClose={() => setIsMessageHubOpen(false)}
                    onOpenChat={() => openChat()}
                    onOpenInbox={openInbox}
                />
            )}
            {isInboxOpen && (
                <AdminInboxPopup
                    isOpen={isInboxOpen}
                    onClose={() => setIsInboxOpen(false)}
                    threads={chatThreads}
                    onReply={(message) => setReplyState({ isOpen: true, messageToReplyTo: message })}
                    onDeleteMessage={handleDeleteMessage}
                    showConfirmation={showConfirmation}
                    onOpenConversation={(userId) => openChat(userId)}
                />
            )}
            {replyState.isOpen && (
                <AdminReplyPopup
                    onClose={() => setReplyState({ isOpen: false, messageToReplyTo: null })}
                    onSend={handleReplySend}
                    messageToReplyTo={replyState.messageToReplyTo}
                />
            )}
            <MessagePopup
                user={currentUser}
                isAdmin={true}
                isOpen={isMessagePopupOpen}
                onClose={() => setIsMessagePopupOpen(false)}
                threads={chatThreads}
                currentThread={selectedThreadId ? chatThreads[selectedThreadId] : null}
                onSelectThread={handleSelectThread}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                onClearThread={handleClearThread}
                showConfirmation={showConfirmation}
            />

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
                onMessageIconClick={() => setIsMessageHubOpen(true)}
            >
                {renderPage()}
            </AdminLayout>
        </div>
    );
};

export default AdminApp;