import React, { useState } from 'react';
import type { User } from '../types';

interface WelcomePopupProps {
    user: User;
    onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ user, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };
    
    const userName = user.displayName || user.email || 'Pengguna';
    const title = `Selamat Datang`;
    const message = `Selamat datang ${userName}, silahkan lanjutkan untuk menjelajahi alur dari aplikasi dan selamat berproses Cendekiawan muda Indonesia.`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1001] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-brand-primary rounded-lg p-6 max-w-sm w-full shadow-lg text-center ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-end -mt-2 -mr-2">
                    <button onClick={handleClose} className="btn-close-x text-gray-400">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleClose} 
                        className="w-full bg-orange-600 text-white dark:bg-blue-600 font-bold py-2 px-4 rounded-md text-sm hover:bg-orange-700 dark:hover:bg-blue-700"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomePopup;