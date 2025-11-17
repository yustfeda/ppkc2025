import React, { useState } from 'react';
import type { PublicPage } from '../types';
import { registerUser, loginUser, logoutUser } from '../services/firebase';

interface AuthPageProps {
    setCurrentPage: (page: PublicPage) => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    loginActive?: boolean;
    registrationActive?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ setCurrentPage, showNotification, loginActive, registrationActive }) => {
    const [mode, setMode] = useState<'choice' | 'login' | 'register'>('choice');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                await loginUser(email, password);
                sessionStorage.setItem('justLoggedIn', 'true');
                // Navigation will be handled by onAuthChange in App.tsx
            } else { // mode === 'register'
                await registerUser(email, password);
                await logoutUser(); // Ensure user is logged out after registration
                showNotification('Registrasi berhasil! Silakan login untuk masuk.', 'success');
                setMode('login'); // Switch to login form
                setEmail('');
                setPassword('');
            }
        } catch (err: any) {
             if (mode === 'login') {
                if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                     showNotification('Akun tidak tersedia atau password salah.', 'error');
                } else {
                     showNotification('Gagal login, silakan coba lagi.', 'error');
                }
            } else { // is register
                if (err.code === 'auth/email-already-in-use') {
                    showNotification('Akun dengan email ini sudah ada, silakan login.', 'error');
                } else {
                    showNotification('Gagal mendaftar, silakan coba lagi.', 'error');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'choice') {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-brand-light dark:bg-brand-dark p-4">
                <div className="relative w-full max-w-md bg-white dark:bg-brand-primary p-8 rounded-xl shadow-lg interactive-card animate-fade-in">
                     <button
                        onClick={() => setCurrentPage('home')}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Tutup"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                    <h2 className="text-2xl font-bold text-center text-brand-primary dark:text-white mb-6">
                        Selamat Datang
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-8">Silakan pilih opsi untuk melanjutkan.</p>
                    <div className="space-y-4">
                        {registrationActive && (
                            <button
                                onClick={() => setMode('register')}
                                className="w-full bg-brand-secondary hover:bg-brand-accent text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Daftar Akun Baru
                            </button>
                        )}
                        {loginActive && (
                            <button
                                onClick={() => setMode('login')}
                                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-brand-primary dark:text-gray-200 font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Masuk dengan Akun
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-brand-light dark:bg-brand-dark p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-brand-primary p-8 rounded-xl shadow-lg interactive-card animate-fade-in-up">
                 <button
                    onClick={() => setMode('choice')}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Kembali"
                >
                    <i className="fas fa-arrow-left text-xl"></i>
                </button>
                 <button
                    onClick={() => setCurrentPage('home')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Tutup"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
                <h2 className="text-2xl font-bold text-center text-brand-primary dark:text-white mb-6">
                    {mode === 'login' ? 'Masuk Akun' : 'Daftar Akun Baru'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative input-group form-input-bg-light dark:form-input-bg-dark">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="peer form-input shadow-inner appearance-none border rounded w-full py-3 px-3 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-dark dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent text-sm"
                            required
                            placeholder=" "
                        />
                         <label htmlFor="email" className="form-label text-sm">
                            Alamat Email
                        </label>
                    </div>
                    <div className="relative input-group form-input-bg-light dark:form-input-bg-dark">
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="peer form-input shadow-inner appearance-none border rounded w-full py-3 px-3 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-dark dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent text-sm"
                            required
                             placeholder=" "
                        />
                         <label htmlFor="password" className="form-label text-sm">
                            Password
                        </label>
                    </div>
                    <div className="flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-secondary hover:bg-brand-accent text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : (mode === 'login' ? 'Masuk' : 'Daftar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;
