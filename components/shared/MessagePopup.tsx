import React, { useState, useEffect, useRef } from 'react';
import type { User, ChatThread, Message } from '../../types';

interface MessagePopupProps {
    user: User | null;
    isAdmin: boolean;
    isOpen: boolean;
    onClose: () => void;
    threads?: Record<string, ChatThread>;
    currentThread?: ChatThread | null;
    onSendMessage: (targetUserId: string, text: string, isGlobal: boolean) => Promise<void>;
    onDeleteMessage: (targetUserId: string, messageId: string) => void;
    onClearThread: (targetUserId: string) => void;
    onSelectThread?: (userId: string) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ user, isAdmin, isOpen, onClose, threads, currentThread, onSendMessage, onDeleteMessage, onClearThread, onSelectThread, showConfirmation }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'global'>('users');
    const [userTab, setUserTab] = useState<'conversation' | 'inbox'>('conversation');

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isOpen, currentThread?.messages, userTab]);
    
    useEffect(() => {
      // When opening as user, default to conversation tab
      if (isOpen && !isAdmin) {
        setUserTab('conversation');
      }
    }, [isOpen, isAdmin]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        
        let targetUserId: string | null = null;
        if (isAdmin) {
             if (activeTab === 'global') {
                targetUserId = user.uid; // Use admin UID as a placeholder for global send
             } else {
                targetUserId = currentThread?.userId || null;
             }
        } else {
            targetUserId = user.uid;
        }

        if (!targetUserId) {
            console.error("No target user to send message to.");
            return;
        }

        try {
            await onSendMessage(targetUserId, newMessage, isAdmin && activeTab === 'global');
            setNewMessage('');
        } catch (error: any) {
            alert(error.message); // Show limit error
        }
    };
    
    const handleDelete = (msg: Message) => {
        const targetUserId = currentThread?.userId || user?.uid;
        if (!targetUserId) return;
        showConfirmation(
            'Anda yakin ingin menghapus pesan ini?',
            () => onDeleteMessage(targetUserId, msg.id)
        );
    };

    const handleClearConversation = () => {
        const targetUserId = currentThread?.userId || user?.uid;
        if (!targetUserId) return;
        showConfirmation(
            'Anda yakin ingin menghapus semua pesan dalam percakapan ini? Tindakan ini tidak dapat diurungkan.',
            () => onClearThread(targetUserId)
        );
    };
    
    const sortedMessages = currentThread ? Object.values(currentThread.messages).sort((a: Message, b: Message) => a.timestamp - b.timestamp) : [];
    const sortedThreads = threads ? Object.values(threads).sort((a: ChatThread, b: ChatThread) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)) : [];
    // FIX: Explicitly type `msg` to resolve TypeScript error where `msg` was inferred as `unknown`.
    const inboxMessages = sortedMessages.filter((msg: Message) => msg.sender === 'admin');

    const canReply = !isAdmin && !sortedMessages.some((m: Message) => m.isGlobal);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-brand-dark rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                            {isAdmin ? `Pesan Admin: ${currentThread?.userEmail || 'Pilih Percakapan'}` : 'Pesan ke Admin'}
                        </h3>
                        {((!isAdmin && currentThread) || (isAdmin && currentThread)) && (
                            <button onClick={handleClearConversation} className="text-xs text-red-500 hover:underline">
                                <i className="fas fa-eraser mr-1"></i>Hapus Percakapan
                            </button>
                        )}
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </header>

                <div className="flex-grow flex overflow-hidden">
                    {isAdmin && (
                        <aside className="w-1/3 border-r dark:border-gray-700 flex flex-col">
                            <div className="p-2 border-b dark:border-gray-700">
                                <div className="flex bg-gray-200 dark:bg-gray-900 rounded-md p-1">
                                    <button onClick={() => setActiveTab('users')} className={`flex-1 text-sm p-1 rounded-md ${activeTab === 'users' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>Users</button>
                                    <button onClick={() => setActiveTab('global')} className={`flex-1 text-sm p-1 rounded-md ${activeTab === 'global' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>Global</button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                {activeTab === 'users' && sortedThreads.map((thread: ChatThread) => (
                                    <div key={thread.userId} onClick={() => onSelectThread?.(thread.userId)} className={`p-3 border-b dark:border-gray-700 cursor-pointer ${currentThread?.userId === thread.userId ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-sm truncate dark:text-gray-200">{thread.userEmail}</p>
                                            {thread.unreadByAdmin && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate dark:text-gray-400">{thread.lastMessageText}</p>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    )}
                    
                    <main className="flex-1 flex flex-col">
                        {!isAdmin && (
                            <div className="flex-shrink-0 p-2 border-b dark:border-gray-700">
                                <div className="flex bg-gray-200 dark:bg-gray-900 rounded-md p-1">
                                    <button onClick={() => setUserTab('conversation')} className={`flex-1 text-sm p-1 rounded-md ${userTab === 'conversation' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>Percakapan</button>
                                    <button onClick={() => setUserTab('inbox')} className={`flex-1 text-sm p-1 rounded-md ${userTab === 'inbox' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>Kotak Masuk</button>
                                </div>
                            </div>
                        )}
                         <div className="chat-messages flex-grow p-4 space-y-4 overflow-y-auto">
                           {(userTab === 'inbox' && !isAdmin ? inboxMessages : sortedMessages).map((msg: Message) => (
                                <div key={msg.id} className={`flex items-end gap-2 group ${msg.sender === (isAdmin ? 'admin' : 'user') ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === (isAdmin ? 'admin' : 'user') && <button onClick={() => handleDelete(msg)} className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>}
                                    <div className={`relative chat-bubble ${msg.sender === (isAdmin ? 'admin' : 'user') ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                                        {msg.isGlobal && <span className="font-bold text-xs block text-yellow-300">[PENGUMUMAN GLOBAL]</span>}
                                        <p>{msg.text}</p>
                                    </div>
                                    {msg.sender !== (isAdmin ? 'admin' : 'user') && <button onClick={() => handleDelete(msg)} className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                         {((isAdmin && (!currentThread || activeTab === 'global')) || (!isAdmin && userTab === 'conversation' && canReply)) && (
                            <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-900">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isAdmin && activeTab === 'global' ? "Kirim pesan global..." : "Ketik pesan..."}
                                    className="flex-grow p-2 border rounded-full text-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    disabled={isAdmin && activeTab === 'users' && !currentThread}
                                />
                                <button type="submit" className="bg-brand-secondary text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:bg-gray-400" disabled={isAdmin && activeTab === 'users' && !currentThread}>
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                         )}
                         {!isAdmin && userTab === 'conversation' && !canReply && (
                              <div className="flex-shrink-0 p-2 text-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-900">Anda tidak bisa membalas pengumuman global.</div>
                         )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default MessagePopup;