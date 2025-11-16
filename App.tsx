import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { onAuthChange, logoutUser, checkAdminClaim } from './services/firebase';

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

    useEffect(() => {
        // Anti-DevTools: Displays a blank page if developer tools are open.
        const devtools = /./;
        devtools.toString = function() {
            setIsDevToolsOpen(true);
            return '';
        };

        const checkInterval = setInterval(() => {
            console.log('%c', devtools);
        }, 1000);

        return () => clearInterval(checkInterval);
    }, []);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        const unsubscribe = onAuthChange((firebaseUser) => {
            setIsCheckingAuth(true); // Always show loader on any auth state change

            if (firebaseUser) {
                // If a user exists, check for admin claims before rendering anything.
                checkAdminClaim(firebaseUser).then(isAdminUser => {
                    // Once the check is complete, set the user and admin state together.
                    // This prevents rendering PublicApp for an admin user temporarily.
                    setUser(firebaseUser as User);
                    setIsAdmin(isAdminUser);
                    setIsCheckingAuth(false); // Finished checking, ready to render correct app.
                });
            } else {
                // No user is logged in, clear all state and stop loading.
                setUser(null);
                setIsAdmin(false);
                setIsCheckingAuth(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('seenAdminWelcome');
        logoutUser();
        // onAuthChange will handle state updates automatically after successful logout.
    };

    if (isDevToolsOpen) {
        // Return a blank page if DevTools is detected.
        return null;
    }

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
                <i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i>
            </div>
        );
    }

    if (user && isAdmin) {
        return <AdminApp onLogout={handleLogout} />;
    }

    // Render PublicApp for non-admin logged-in users or for guests (user === null)
    return <PublicApp user={user} onLogout={handleLogout} />;
};

export default App;