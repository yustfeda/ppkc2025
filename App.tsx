import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { onAuthChange, logoutUser } from './services/firebase';

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

const ADMIN_UID = 'yMfKl5Wo7KRadLV4pDMQcHQKPsx2';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [fadeOutLoader, setFadeOutLoader] = useState(false);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        const unsubscribe = onAuthChange((firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser as User);
                if (firebaseUser.uid === ADMIN_UID) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }

            // Start fade out process
            setFadeOutLoader(true);
            // Unmount loader after animation
            setTimeout(() => setIsCheckingAuth(false), 300); 
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('seenAdminWelcome');
        setIsAdmin(false);
        logoutUser();
    };

    if (isCheckingAuth) {
        return (
            <div className={`flex items-center justify-center h-screen bg-white dark:bg-gray-900 ${fadeOutLoader ? 'animate-fade-out' : ''}`}>
                <i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i>
            </div>
        );
    }

    if (isAdmin) {
        return <AdminApp onLogout={handleLogout} />;
    }

    return <PublicApp user={user} onLogout={handleLogout} />;
};

export default App;