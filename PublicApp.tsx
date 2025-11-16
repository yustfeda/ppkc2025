import React, { useState, useEffect, useCallback } from 'react';
import type { PublicPage, User, Notification, ConfirmationState, ManagedButton, DynamicFormModalState, AdminConfig } from './types';
import { getAdminConfig, getUserRegistration, getSelectionStages, getManagedButtons } from './services/firebase';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import SelectionStages from './components/SelectionStages';
import Announcements from './components/Announcements';
import Contact from './components/Contact';
import AuthPage from './components/AuthPage';
import Registration from './components/Registration';
import Profile from './components/Profile';
import Status from './components/Status';
import Footer from './components/Footer';
import DynamicFormModal from './components/DynamicFormModal';

const NotificationPopup: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const theme = {
        success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-500', icon: 'fa-exclamation-triangle' }
    };

    return (
        <div className="fixed top-24 right-4 z-[1001] animate-slide-in">
            <div className={`flex items-center gap-4 p-4 rounded-lg shadow-lg text-white ${theme[notification.type].bg}`}>
                 <i className={`fas ${theme[notification.type].icon} text-xl`}></i>
                 <p className="text-sm font-medium">{notification.message}</p>
                 <button onClick={onClose} className="ml-4 text-white/80 hover:text-white">&times;</button>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{ confirmation: ConfirmationState; onCancel: () => void; }> = ({ confirmation, onCancel }) => {
    const [isClosing, setIsClosing] = useState(false);
    
    useEffect(() => {
        setIsClosing(false); // Reset on new confirmation
    }, [confirmation]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onCancel(), 300); // Wait for animation
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
                    <button onClick={confirmation.onConfirm} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent">Ya, Lanjutkan</button>
                </div>
            </div>
        </div>
    );
};


interface PublicAppProps {
    user: User | null;
    onLogout: () => void;
}

const PublicApp: React.FC<PublicAppProps> = ({ user, onLogout }) => {
    const [currentPage, setCurrentPage] = useState<PublicPage>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });
    const [dynamicFormState, setDynamicFormState] = useState<DynamicFormModalState>({ isOpen: false, button: null });
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [prevUser, setPrevUser] = useState<User | null>(user);
    const [isSelectionFinished, setIsSelectionFinished] = useState(false);
    const [managedButtons, setManagedButtons] = useState<ManagedButton[]>([]);


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
    
    useEffect(() => {
        if (!user) {
            setIsSelectionFinished(false);
            return;
        }
        const checkStatus = async () => {
            const [regData, stagesData] = await Promise.all([
                getUserRegistration(user.uid),
                getSelectionStages()
            ]);
            if (!regData || regData.status === 'Belum Mendaftar' || regData.status === 'Terkirim') {
                setIsSelectionFinished(false);
                return;
            }
            if (regData.status === 'Gagal') {
                setIsSelectionFinished(true);
                return;
            }
            const hasFailedStage = Object.values(regData.stageProgress || {}).some((p: any) => p.status === 'gagal');
            if (hasFailedStage) {
                setIsSelectionFinished(true);
                return;
            }
            if (stagesData && stagesData.length > 0) {
                const lastStage = stagesData[stagesData.length - 1];
                if (regData.stageProgress?.[lastStage.id]?.status === 'lolos') {
                    setIsSelectionFinished(true);
                    return;
                }
            }
            setIsSelectionFinished(false);
        };
        checkStatus();
    }, [user]);

    useEffect(() => {
        if (sessionStorage.getItem('adminLoggedOut') === 'true') {
            showNotification('Anda telah logout dari halaman admin.', 'success');
            sessionStorage.removeItem('adminLoggedOut');
        } 
        else if (prevUser && !user) { // Standard user logout
             showNotification('Anda berhasil logout.', 'success');
        }
        setPrevUser(user);
    }, [user, prevUser, showNotification]);


    useEffect(() => {
        getAdminConfig().then(setAdminConfig);
        getManagedButtons().then(setManagedButtons);
    }, []);

    useEffect(() => {
        if (window.location.pathname === '/adminppkcsatu') {
            setCurrentPage('login');
            window.history.pushState({}, '', '/');
        }
    }, []);

    
    const navigate = useCallback(async (page: PublicPage) => {
        if (page === 'login' && !adminConfig?.loginActive) {
            showNotification('Fitur login saat ini dinonaktifkan oleh admin.', 'error');
            return;
        }
        if (page === 'registration' && !adminConfig?.registrationActive) {
            showNotification('Pendaftaran saat ini ditutup oleh admin.', 'error');
            return;
        }
    
        const userPages: PublicPage[] = ['registration', 'profile', 'status'];
        if (!user && userPages.includes(page)) {
            if (adminConfig?.loginActive) {
                setCurrentPage('login');
            } else {
                showNotification('Anda harus masuk untuk mengakses halaman ini.', 'error');
            }
            return;
        }
    
        if (user && page === 'login') {
            setCurrentPage('home');
            return;
        }
    
        if (user && page === 'registration') {
            const regData = await getUserRegistration(user.uid);
            if (!regData) {
                setCurrentPage('registration');
                return;
            }
        }
    
        setCurrentPage(page);
    }, [user, adminConfig, showNotification]);

     useEffect(() => {
        const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
        if(user && justLoggedIn){
            // Welcome message is only for regular users, as admins are immediately
            // switched to the AdminApp component which has its own welcome logic.
            const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
            if (!isAdmin) {
                showNotification(`Selamat datang, ${user.displayName || user.email}!`, 'success');
                navigate('home');
            }
            sessionStorage.removeItem('justLoggedIn');
        }
     }, [user, showNotification, navigate]);
    
    const handleLogout = () => {
        onLogout();
        navigate('home');
    }

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleManagedButtonClick = (button: ManagedButton) => {
        if (button.formFields && button.formFields.length > 0) {
            setDynamicFormState({ isOpen: true, button });
        } else if (button.link) {
            window.open(button.link, '_blank');
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <Home setCurrentPage={navigate} user={user} onManagedButtonClick={handleManagedButtonClick} />;
            case 'stages': return <SelectionStages user={user} setCurrentPage={navigate} />;
            case 'announcements': return <Announcements />;
            case 'contact': return <Contact />;
            case 'login': return <AuthPage setCurrentPage={navigate} showNotification={showNotification} loginActive={adminConfig?.loginActive} registrationActive={adminConfig?.registrationActive} />;
            case 'registration': return user ? <Registration user={user} setCurrentPage={navigate} showNotification={showNotification} showConfirmation={showConfirmation} registrationActive={adminConfig?.registrationActive} /> : <AuthPage setCurrentPage={navigate} showNotification={showNotification} loginActive={adminConfig?.loginActive} registrationActive={adminConfig?.registrationActive} />;
            case 'profile': return user ? <Profile user={user} showNotification={showNotification} showConfirmation={showConfirmation} /> : <AuthPage setCurrentPage={navigate} showNotification={showNotification} loginActive={adminConfig?.loginActive} registrationActive={adminConfig?.registrationActive}/>;
            case 'status': return user ? <Status user={user} /> : <AuthPage setCurrentPage={navigate} showNotification={showNotification} loginActive={adminConfig?.loginActive} registrationActive={adminConfig?.registrationActive} />;
            default: return <Home setCurrentPage={navigate} user={user} onManagedButtonClick={handleManagedButtonClick} />;
        }
    };

    const visibleButtons = managedButtons.filter(button => {
        if (user) {
            return button.showOnUser;
        } else {
            return button.showOnGuest;
        }
    });

    return (
        <div className="font-sans bg-brand-light dark:bg-brand-dark min-h-screen text-sm flex flex-col">
            <ConfirmationModal confirmation={confirmation} onCancel={hideConfirmation} />
            {notification && <NotificationPopup notification={notification} onClose={() => setNotification(null)} />}
            {dynamicFormState.isOpen && dynamicFormState.button && (
                <DynamicFormModal 
                    button={dynamicFormState.button} 
                    user={user}
                    onClose={() => setDynamicFormState({ isOpen: false, button: null })} 
                    showNotification={showNotification}
                />
            )}
            <Header 
                currentPage={currentPage}
                setCurrentPage={navigate}
                toggleSidebar={toggleSidebar}
                user={user}
                onLogout={handleLogout}
                isSidebarOpen={isSidebarOpen}
                isSelectionFinished={isSelectionFinished}
                managedButtons={visibleButtons}
                onManagedButtonClick={handleManagedButtonClick}
                loginActive={adminConfig?.loginActive ?? true}
            />
            <Sidebar
                isOpen={isSidebarOpen}
                currentPage={currentPage}
                setCurrentPage={navigate}
                toggleSidebar={toggleSidebar}
                user={user}
                onLogout={handleLogout}
                isSelectionFinished={isSelectionFinished}
                managedButtons={visibleButtons}
                onManagedButtonClick={handleManagedButtonClick}
                loginActive={adminConfig?.loginActive ?? true}
            />
            <main className="flex-grow">
                <div key={currentPage} className="animate-fade-in-up">
                    {renderPage()}
                </div>
            </main>
            <Footer setCurrentPage={navigate} appVersion={adminConfig?.appVersion} />
        </div>
    );
};

export default PublicApp;