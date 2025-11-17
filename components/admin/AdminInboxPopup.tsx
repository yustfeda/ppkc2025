import React, { useState, useMemo } from 'react';
import type { ChatThread, InboxMessage, Message } from '../../types';

interface AdminInboxPopupProps {
    isOpen: boolean;
    onClose: () => void;
    threads: Record<string, ChatThread>;
    onReply: (message: InboxMessage) => void;
    onDeleteMessage: (userId: string, messageId: string) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    onOpenConversation: (userId: string) => void;
}

const AdminInboxPopup: React.FC<AdminInboxPopupProps> = ({ isOpen, onClose, threads, onReply, onDeleteMessage, showConfirmation, onOpenConversation }) => {
    const [isClosing, setIsClosing] = useState(false);

    const allUserMessages = useMemo(() => {
        const messages: InboxMessage[] = [];
        for (const userId in threads) {
            const thread = threads[userId];
            if (thread.messages) {
                for (const messageId in thread.messages) {
                    const message = thread.messages[messageId];
                    if (message.sender === 'user') {
                        messages.push({
                            ...message,
                            userId: thread.userId,
                            userEmail: thread.userEmail
                        });
                    }
                }
            }
        }
        return messages.sort((a, b) => b.timestamp - a.timestamp);
    }, [threads]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleDelete = (msg: InboxMessage) => {
        showConfirmation(
            `Anda yakin ingin menghapus pesan dari ${msg.userEmail}?`,
            () => onDeleteMessage(msg.userId, msg.id)
        );
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-brand-dark rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Kotak Masuk</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto">
                    {allUserMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Kotak masuk kosong.</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-gray-700">
                            {allUserMessages.map(msg => (
                                <div key={msg.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm text-brand-dark dark:text-white">{msg.userEmail}</span>
                                                <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString('id-ID')}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{msg.text}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => onReply(msg)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold" title="Balas Cepat"><i className="fas fa-reply"></i></button>
                                            <button onClick={() => onOpenConversation(msg.userId)} className="text-gray-500 hover:text-gray-700 text-xs font-semibold" title="Lihat Percakapan"><i className="fas fa-external-link-alt"></i></button>
                                            <button onClick={() => handleDelete(msg)} className="text-red-500 hover:text-red-700 text-xs font-semibold" title="Hapus Pesan"><i className="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminInboxPopup;