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
            // Selalu mulai proses pengecekan
            setIsCheckingAuth(true);

            if (firebaseUser) {
                // Lakukan pengecekan admin *sebelum* mengatur state apa pun
                const isAdminUser = await checkAdminClaim(firebaseUser);
                
                // Sekarang perbarui state dengan nilai akhir yang benar secara bersamaan
                setUser(firebaseUser as User | null);
                setIsAdmin(isAdminUser);
            } else {
                // Tidak ada pengguna yang login, bersihkan semua state otentikasi
                setUser(null);
                setIsAdmin(false);
            }
            
            // Semua pemeriksaan selesai, sembunyikan loader awal
            setIsCheckingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        // onAuthChange akan menangani pembaruan state secara otomatis
        sessionStorage.removeItem('seenAdminWelcome');
        logoutUser();
    };

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
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