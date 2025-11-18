import React, { useState } from 'react';
import type { User, WelcomePopupConfig, PublicPage } from '../types';

interface WelcomePopupProps {
    user: User;
    config: WelcomePopupConfig;
    onClose: () => void;
    setCurrentPage: (page: PublicPage) => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ user, config, onClose, setCurrentPage }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };
    
    const handleButtonClick = (link: string) => {
        // Basic check if it's an internal page link
        const internalPages: PublicPage[] = ['home', 'stages', 'announcements', 'contact', 'profile', 'registration', 'status'];
        if (internalPages.includes(link as PublicPage)) {
            setCurrentPage(link as PublicPage);
        } else {
            // Assume it's an external link
            window.open(link, '_blank');
        }
        handleClose();
    }

    const processedTitle = config.title.replace('{userName}', user.displayName || user.email || 'Pengguna');
    const processedMessage = config.message.replace('{userName}', user.displayName || user.email || 'Pengguna');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1001] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-brand-primary rounded-lg p-6 max-w-sm w-full shadow-lg text-center ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{processedTitle}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{processedMessage}</p>
                <div className="flex flex-col gap-3">
                    {config.buttons.map(button => (
                        <button 
                            key={button.id}
                            onClick={() => handleButtonClick(button.link)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-brand-primary dark:text-gray-200 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            {button.label}
                        </button>
                    ))}
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
