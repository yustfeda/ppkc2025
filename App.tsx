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
            // Setiap kali auth berubah, reset state dan mulai proses pengecekan.
            // Ini mencegah render dengan state lama/salah.
            setIsAdmin(false);
            setUser(null);
            setIsCheckingAuth(true);

            if (firebaseUser) {
                // Ada pengguna, verifikasi apakah dia admin.
                const isAdminUser = await checkAdminClaim(firebaseUser);
                
                // Setelah verifikasi selesai, atur state final yang benar.
                setUser(firebaseUser as User);
                setIsAdmin(isAdminUser);
            }
            
            // Pengecekan selesai, sembunyikan loader.
            // React akan merender komponen yang tepat (AdminApp atau PublicApp) berdasarkan state final.
            setIsCheckingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('seenAdminWelcome');
        logoutUser();
        // onAuthChange akan menangani pembaruan state secara otomatis setelah logout berhasil.
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

    // Render PublicApp untuk pengguna non-admin yang sudah login atau untuk tamu (user === null)
    return <PublicApp user={user} onLogout={handleLogout} />;
};

export default App;