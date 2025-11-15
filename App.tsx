import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { onAuthChange, logoutUser } from './services/firebase';

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [fadeOutLoader, setFadeOutLoader] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthChange((firebaseUser) => {
            setUser(firebaseUser as User | null);

            const adminStatus = sessionStorage.getItem('isAdmin') === 'true';
            
            if (!firebaseUser) {
                sessionStorage.removeItem('isAdmin');
                setIsAdmin(false);
            } else {
                setIsAdmin(adminStatus);
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