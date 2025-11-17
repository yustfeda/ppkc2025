import React, { useState } from 'react';
import type { InboxMessage } from '../../types';

interface AdminReplyPopupProps {
    onClose: () => void;
    onSend: (replyText: string) => void;
    messageToReplyTo: InboxMessage | null;
}

const AdminReplyPopup: React.FC<AdminReplyPopupProps> = ({ onClose, onSend, messageToReplyTo }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [replyText, setReplyText] = useState('');

    if (!messageToReplyTo) return null;
    
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            onSend(replyText);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1002] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b dark:border-gray-700">
                    <h3 className="font-semibold text-brand-dark dark:text-white">Balas Pesan</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kepada: {messageToReplyTo.userEmail}</p>
                </header>
                
                <div className="p-4">
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{messageToReplyTo.text}"</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Ketik balasan Anda..."
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                            rows={4}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={handleClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-300">Batal</button>
                            <button type="submit" className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent">Kirim</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminReplyPopup;