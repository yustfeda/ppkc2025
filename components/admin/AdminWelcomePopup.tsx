import React, { useState } from 'react';

interface AdminWelcomePopupProps {
    onClose: () => void;
    notificationCount: number;
}

const AdminWelcomePopup: React.FC<AdminWelcomePopupProps> = ({ onClose, notificationCount }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[999] p-4" onClick={handleClose}>
            <div 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="relative inline-block">
                        <i className="fas fa-crown text-4xl text-brand-secondary"></i>
                        <span className="absolute -top-1 -right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white mt-4">Selamat Datang, Admin!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Status: <span className="font-semibold text-green-500">Aktif</span>.</p>
                </div>

                <div className="mt-6 border-t dark:border-gray-700 pt-4 text-center">
                    {notificationCount > 0 ? (
                         <p className="text-sm text-gray-700 dark:text-gray-200">
                           <i className="fas fa-bell text-yellow-500 mr-2"></i>
                           Anda memiliki <span className="font-bold">{notificationCount}</span> pendaftar baru yang menunggu untuk ditinjau.
                         </p>
                    ) : (
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                            <i className="fas fa-check-circle text-green-500 mr-2"></i>
                            Semua pendaftar sudah ditinjau.
                         </p>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button onClick={handleClose} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">
                        Masuk ke Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminWelcomePopup;