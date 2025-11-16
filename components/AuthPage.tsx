import React, { useState, useEffect } from 'react';
import type { PublicPage } from '../types';
import { registerUser, loginUser, logoutUser } from '../services/firebase';

interface AuthPageProps {
    setCurrentPage: (page: PublicPage | 'close') => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    loginActive?: boolean;
    registrationActive?: boolean;
    isAdminLoginAttempt?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ 
    setCurrentPage, 
    showNotification, 
    loginActive, 
    registrationActive, 
    isAdminLoginAttempt = false 
}) => {
    // Force login form for admin attempts
    const [isLogin, setIsLogin] = useState(isAdminLoginAttempt || loginActive || !registrationActive);
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
                // For modals, the parent component handles closing.
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

    const renderToggleButton = () => {
        if (isAdminLoginAttempt) {
            return <div className="w-24 h-5"></div>; // Placeholder to hide toggle for admin
        }

        const commonClasses = "inline-block align-baseline font-bold text-sm text-brand-secondary hover:text-brand-accent";
        if (isLogin) {
            if (registrationActive) {
                return (
                    <button type="button" onClick={() => setIsLogin(false)} className={commonClasses}>
                        Buat Akun
                    </button>
                );
            }
        } else { // isRegister
            if (loginActive) {
                return (
                    <button type="button" onClick={() => setIsLogin(true)} className={commonClasses}>
                        Sudah Punya Akun?
                    </button>
                );
            }
        }
        return <div className="w-24 h-5"></div>; // Placeholder to prevent layout shift
    };


    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-brand-light dark:bg-brand-dark p-4 sm:bg-transparent sm:dark:bg-transparent">
            <div className="relative w-full max-w-md bg-white dark:bg-brand-primary p-8 rounded-xl shadow-lg interactive-card">
                 <button
                    onClick={() => setCurrentPage('home')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Tutup"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
                <h2 className="text-2xl font-bold text-center text-brand-primary dark:text-white mb-2">
                    {isAdminLoginAttempt ? 'Login Admin' : (isLogin ? 'Masuk Akun' : 'Daftar Akun Baru')}
                </h2>
                {isAdminLoginAttempt && (
                     <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Silakan masuk untuk mengakses Panel Admin.
                    </p>
                )}
                <form onSubmit={handleSubmit} className={`space-y-6 ${!isAdminLoginAttempt && 'mt-6'}`}>
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
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-secondary hover:bg-brand-accent text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isLogin ? 'Masuk' : 'Daftar')}
                        </button>
                        {renderToggleButton()}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;