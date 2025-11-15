import React, { useState } from 'react';
import type { PublicPage } from '../types';
import { registerUser, loginUser, logoutUser } from '../services/firebase';

interface AuthPageProps {
    setCurrentPage: (page: PublicPage) => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setCurrentPage, showNotification }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await loginUser(email, password);
                sessionStorage.setItem('justLoggedIn', 'true');
                // Navigation will be handled by onAuthChange in App.tsx
            } else {
                await registerUser(email, password);
                await logoutUser(); // Ensure user is logged out after registration
                showNotification('Registrasi berhasil! Silakan login untuk masuk.', 'success');
                setIsLogin(true); // Switch to login form
                setEmail('');
                setPassword('');
            }
        } catch (err: any) {
             if (isLogin) {
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

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-brand-light dark:bg-brand-dark p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-brand-primary p-8 rounded-xl shadow-lg interactive-card">
                <h2 className="text-2xl font-bold text-center text-brand-primary dark:text-white mb-6">
                    {isLogin ? 'Masuk Akun' : 'Daftar Akun Baru'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                            Alamat Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-inner appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-dark dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent text-sm"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-inner appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-dark dark:border-gray-600 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent text-sm"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-secondary hover:bg-brand-accent text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isLogin ? 'Masuk' : 'Daftar')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="inline-block align-baseline font-bold text-sm text-brand-secondary hover:text-brand-accent"
                        >
                            {isLogin ? 'Buat Akun' : 'Sudah Punya Akun?'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;