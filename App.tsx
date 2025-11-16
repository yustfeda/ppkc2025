import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { onAuthChange, logoutUser, checkAdminClaim } from './services/firebase';

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

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

        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser as User | null);

            if (firebaseUser) {
                const isAdminUser = await checkAdminClaim(firebaseUser);
                setIsAdmin(isAdminUser);
                if (isAdminUser) {
                    sessionStorage.setItem('isAdmin', 'true');
                } else {
                    sessionStorage.removeItem('isAdmin');
                }
            } else {
                // No user logged in, clear admin status
                setIsAdmin(false);
                sessionStorage.removeItem('isAdmin');
            }

            // Start fade out process
            setFadeOutLoader(true);
            // Unmount loader after animation
            setTimeout(() => setIsCheckingAuth(false), 300); 
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('seenAdminWelcome');
        sessionStorage.removeItem('isAdminLoginAttempt'); // Cleanup old flag
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