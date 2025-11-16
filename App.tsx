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
                 if (isAdminUser) {
                    setIsAdmin(true);
                    sessionStorage.setItem('isAdmin', 'true');
                } else {
                    setIsAdmin(false);
                    sessionStorage.removeItem('isAdmin');
                    // If this was an admin login attempt, log them out
                    if (sessionStorage.getItem('isAdminLoginAttempt') === 'true') {
                        sessionStorage.removeItem('isAdminLoginAttempt');
                        await logoutUser();
                        // This will trigger onAuthChange again with user=null
                        return; // Exit early
                    }
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

    const handleSetAdmin = () => {
        setIsAdmin(true);
        sessionStorage.setItem('isAdmin', 'true');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('seenAdminWelcome');
        sessionStorage.removeItem('isAdminLoginAttempt');
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

    return <PublicApp user={user} onSetAdmin={handleSetAdmin} onLogout={handleLogout} />;
};

export default App;