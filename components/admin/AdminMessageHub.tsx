import React, { useState } from 'react';

interface AdminMessageHubProps {
    onClose: () => void;
    onOpenChat: () => void;
    onOpenInbox: () => void;
}

const AdminMessageHub: React.FC<AdminMessageHubProps> = ({ onClose, onOpenChat, onOpenInbox }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-start z-[1001] p-4 lg:p-6" onClick={handleClose}>
            <div 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-xs ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-sm font-bold text-brand-dark dark:text-white mb-3 text-center">Pusat Pesan</h3>
                <div className="space-y-3">
                    <button 
                        onClick={onOpenChat}
                        className="w-full flex items-center gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 transition-colors"
                    >
                        <i className="fas fa-comments text-lg"></i>
                        <span className="font-semibold text-sm">Buka Obrolan</span>
                    </button>
                    <button
                        onClick={onOpenInbox}
                        className="w-full flex items-center gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/50 hover:bg-green-100 dark:hover:bg-green-900 text-green-800 dark:text-green-200 transition-colors"
                    >
                        <i className="fas fa-inbox text-lg"></i>
                        <span className="font-semibold text-sm">Buka Kotak Masuk</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMessageHub;