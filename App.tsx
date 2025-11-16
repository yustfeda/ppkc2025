import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { onAuthChange, logoutUser, checkAdminClaim } from './services/firebase';

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        const unsubscribe = onAuthChange(async (firebaseUser) => {
            // Start the loading state immediately to prevent rendering the wrong UI.
            setIsCheckingAuth(true);

            if (firebaseUser) {
                // If a user is logged in, check for admin claims.
                const isAdminUser = await checkAdminClaim(firebaseUser);
                // Set both user and admin state in one go after the check.
                setUser(firebaseUser as User);
                setIsAdmin(isAdminUser);
            } else {
                // If no user is logged in, reset to default guest state.
                setUser(null);
                setIsAdmin(false);
            }
            
            // Pengecekan selesai, sembunyikan loader dan render komponen yang tepat.
            setIsCheckingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('seenAdminWelcome');
        logoutUser();
        // onAuthChange will handle state updates automatically after successful logout.
    };

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