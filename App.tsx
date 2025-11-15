import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { onAuthChange, logoutUser } from './services/firebase';

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((firebaseUser) => {
            setUser(firebaseUser as User | null);

            const adminStatus = sessionStorage.getItem('isAdmin') === 'true';
            
            if (!firebaseUser) {
                // If user logs out, clear admin status completely
                sessionStorage.removeItem('isAdmin');
                setIsAdmin(false);
            } else {
                // If there's a user, respect the session's admin status
                setIsAdmin(adminStatus);
            }

            setIsCheckingAuth(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleSetAdmin = () => {
        setIsAdmin(true);
        sessionStorage.setItem('isAdmin', 'true');
    };

    const handleLogout = () => {
        logoutUser().then(() => {
            // State will be updated by onAuthChange listener
        });
    };

    if (isCheckingAuth) {
        return <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900"><i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i></div>;
    }

    if (isAdmin) {
        return <AdminApp onLogout={handleLogout} />;
    }

    return <PublicApp user={user} onSetAdmin={handleSetAdmin} onLogout={handleLogout} />;
};

export default App;