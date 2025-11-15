import React, { useState } from 'react';

interface AdminLoginModalProps {
    onClose: () => void;
    onLogin: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'Masuk22') {
            onLogin();
        } else {
            setError('Password salah.');
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300); // Wait for animation to finish
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-brand-dark dark:text-white">Admin Login</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="relative input-group">
                        <input
                            type="password"
                            id="admin-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="peer form-input w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary text-sm"
                            placeholder=" "
                        />
                         <label htmlFor="admin-password" className="form-label text-sm">Password</label>
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-accent transition-colors"
                        >
                            Masuk
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginModal;