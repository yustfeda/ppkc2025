import React, { useState, useEffect } from 'react';
import type { PublicPage } from '../types';
import { registerUser, loginUser, logoutUser } from '../services/firebase';

interface AuthPageProps {
    setCurrentPage: (page: PublicPage) => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    loginActive?: boolean;
    registrationActive?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ setCurrentPage, showNotification, loginActive = true, registrationActive = true }) => {
    // Tentukan mode awal berdasarkan apa yang aktif dan preferensi navigasi
    const [mode, setMode] = useState<'login' | 'register'>(() => {
        const preferredMode = sessionStorage.getItem('authMode');
        if (preferredMode === 'register' && registrationActive) {
            sessionStorage.removeItem('authMode'); // Bersihkan setelah dibaca
            return 'register';
        }
        if (loginActive) return 'login';
        if (registrationActive) return 'register';
        return 'login';
    });
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);

    // Redirect jika akses ke mode tertentu dilarang
    useEffect(() => {
        if (mode === 'login' && !loginActive && registrationActive) {
            setMode('register');
        } else if (mode === 'register' && !registrationActive && loginActive) {
            setMode('login');
        }
    }, [loginActive, registrationActive, mode]);

    const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setIsVerifyingCaptcha(true);
            setTimeout(() => {
                setCaptchaVerified(true);
                setIsVerifyingCaptcha(false);
            }, 2000);
        } else {
            setCaptchaVerified(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (mode === 'register' && !captchaVerified) {
            showNotification('Harap verifikasi bahwa Anda bukan robot.', 'error');
            setLoading(false);
            return;
        }

        try {
            if (mode === 'login') {
                await loginUser(email, password);
                sessionStorage.setItem('justLoggedIn', 'true');
            } else {
                await registerUser(email, password);
                await logoutUser();
                showNotification('Registrasi berhasil! Silakan login untuk masuk.', 'success');
                setMode('login');
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
            } else {
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
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-brand-light dark:bg-brand-dark p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-brand-primary p-6 sm:p-8 rounded-2xl shadow-xl animate-fade-in-up">
                {/* Tombol Close */}
                 <button
                    onClick={() => setCurrentPage('home')}
                    className="btn-close-x absolute top-4 right-4 text-gray-400"
                    aria-label="Tutup"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-brand-primary dark:text-white">
                        {mode === 'login' ? 'Masuk Akun' : 'Daftar Akun'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {mode === 'login' ? 'Silakan masuk untuk melanjutkan proses seleksi' : 'Lengkapi data akun untuk mulai mendaftar'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative input-group form-input-bg-light dark:form-input-bg-dark">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="peer form-input shadow-inner appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-dark dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
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
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="peer form-input shadow-inner appearance-none border rounded-xl w-full py-3 pl-4 pr-12 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-brand-dark dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                            required
                             placeholder=" "
                        />
                         <label htmlFor="password" className="form-label text-sm">
                            Password
                        </label>
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none bg-transparent border-none shadow-none btn-no-lift cursor-pointer"
                            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                        </button>
                    </div>

                    {mode === 'register' && (
                         <div className="p-3 bg-gray-50 dark:bg-brand-dark/50 border dark:border-gray-700 rounded-xl">
                             <label className="flex items-center gap-3 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    onChange={handleCaptchaChange} 
                                    disabled={isVerifyingCaptcha || captchaVerified} 
                                    className="h-5 w-5 rounded border-gray-300 text-brand-secondary focus:ring-brand-secondary" 
                                />
                                 <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Saya bukan robot</span>
                                 <div className="ml-auto">
                                    {isVerifyingCaptcha && <i className="fas fa-spinner fa-spin text-brand-secondary"></i>}
                                    {captchaVerified && <i className="fas fa-check-circle text-green-500"></i>}
                                 </div>
                             </label>
                         </div>
                     )}

                    <button
                        type="submit"
                        disabled={loading || (mode === 'register' && !captchaVerified)}
                        className="w-full bg-brand-secondary hover:bg-brand-accent text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-gray-400 text-sm"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : (mode === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang')}
                    </button>
                </form>

                {/* Toggle Masuk / Daftar */}
                <div className="mt-8 text-center border-t dark:border-gray-700 pt-6">
                    {mode === 'login' ? (
                        registrationActive ? (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Belum memiliki akun?{' '}
                                <button 
                                    onClick={() => setMode('register')} 
                                    className="btn-text-only text-brand-secondary font-bold hover:underline"
                                >
                                    Daftar di sini
                                </button>
                            </p>
                        ) : (
                            <p className="text-[10px] text-red-500 font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                                <i className="fas fa-info-circle mr-1"></i> Pendaftaran akun baru sedang ditutup
                            </p>
                        )
                    ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Sudah memiliki akun?{' '}
                            <button 
                                onClick={() => setMode('login')} 
                                className="btn-text-only text-brand-secondary font-bold hover:underline"
                            >
                                Masuk di sini
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;