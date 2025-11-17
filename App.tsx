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
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        const unsubscribe = onAuthChange((firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser as User);
                // Force refresh the token to get the latest custom claims
                // FIX: Cast `firebaseUser` to `any` to access `getIdTokenResult`, which exists on the underlying Firebase user object but not our simplified `User` type.
                (firebaseUser as any).getIdTokenResult(true)
                    .then((idTokenResult: any) => {
                        // Check for admin custom claim
                        if (idTokenResult.claims.admin) {
                            setIsAdmin(true);
                        } else {
                            setIsAdmin(false);
                        }
                    })
                    .catch((error: any) => {
                        console.error("Error getting user claims:", error);
                        setIsAdmin(false); // Default to non-admin on error
                    })
                    .finally(() => {
                        setFadeOutLoader(true);
                        setTimeout(() => setIsCheckingAuth(false), 300);
                    });
            } else {
                setUser(null);
                setIsAdmin(false);
                setFadeOutLoader(true);
                setTimeout(() => setIsCheckingAuth(false), 300);
            }
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