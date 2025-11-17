import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, ChatThread, Message, RegistrationData } from '../../types';

interface MessagePopupProps {
    user: User | null;
    isAdmin: boolean;
    isOpen: boolean;
    onClose: () => void;
    threads?: Record<string, ChatThread>;
    allRegistrations?: RegistrationData[];
    currentThread?: ChatThread | null;
    onSendMessage: (targetUserId: string, text: string, isGlobal: boolean) => Promise<void>;
    onDeleteMessage: (targetUserId: string, messageId: string) => void;
    onClearThread: (targetUserId: string) => void;
    onSelectThread?: (userId: string) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ user, isAdmin, isOpen, onClose, threads, allRegistrations = [], currentThread, onSendMessage, onDeleteMessage, onClearThread, onSelectThread, showConfirmation }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [adminTab, setAdminTab] = useState<'inbox' | 'broadcast'>('inbox');
    const [userTab, setUserTab] = useState<'conversation' | 'inbox'>('conversation');

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false); // Reset closing state when opening
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isOpen, currentThread?.messages, userTab, adminTab]);
    
    useEffect(() => {
      if (isOpen && !isAdmin) {
        setUserTab('conversation');
      }
      if (isOpen && isAdmin) {
        setAdminTab('inbox');
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
        const isGlobal = isAdmin && adminTab === 'broadcast';

        if (isAdmin) {
             if (isGlobal) {
                targetUserId = user.uid; // Use admin UID as a placeholder for global send
             } else {
                targetUserId = currentThread?.userId || null;
             }
        } else {
            targetUserId = user.uid;
        }

        if (!targetUserId && !isGlobal) {
            console.error("No target user to send message to.");
            return;
        }

        try {
            await onSendMessage(targetUserId!, newMessage, isGlobal);
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

    const handleNewMessageUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUserId = e.target.value;
        if (selectedUserId && onSelectThread) {
            onSelectThread(selectedUserId);
        }
    }
    
    const allSortedMessages = currentThread ? Object.values(currentThread.messages).sort((a: Message, b: Message) => a.timestamp - b.timestamp) : [];
    
    const threadsWithNames = useMemo(() => {
        return threads ? Object.values(threads).map((thread: ChatThread) => {
            const regData = allRegistrations.find(r => r.uid === thread.userId);
            return {
                ...thread,
                userName: regData?.fullName || thread.userEmail
            };
        }).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)) : [];
    }, [threads, allRegistrations]);

    // User-side message filtering
    const inboxMessages = allSortedMessages.filter((msg: Message) => msg.sender === 'admin');
    const conversationMessages = allSortedMessages.filter((msg: Message) => !msg.isGlobal);

    const messagesToDisplay = isAdmin 
        ? allSortedMessages 
        : (userTab === 'inbox' ? inboxMessages : conversationMessages);

    const currentThreadName = allRegistrations.find(r => r.uid === currentThread?.userId)?.fullName || currentThread?.userEmail;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-brand-dark rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">
                            {isAdmin ? `Pesan Admin: ${currentThreadName || 'Pilih Percakapan'}` : 'Pesan ke Admin'}
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
                                    <button onClick={() => setAdminTab('inbox')} className={`flex-1 text-sm p-1 rounded-md ${adminTab === 'inbox' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>Kotak Masuk</button>
                                    <button onClick={() => setAdminTab('broadcast')} className={`flex-1 text-sm p-1 rounded-md ${adminTab === 'broadcast' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>Broadcast</button>
                                </div>
                            </div>
                            {adminTab === 'inbox' && (
                                <>
                                 <div className="p-2">
                                     <select onChange={handleNewMessageUserChange} className="w-full p-2 text-sm border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" value="">
                                         <option value="" disabled>Pesan Baru ke:</option>
                                         {allRegistrations.map(reg => (
                                             <option key={reg.uid} value={reg.uid}>{reg.fullName} ({reg.email})</option>
                                         ))}
                                     </select>
                                 </div>
                                <div className="flex-grow overflow-y-auto">
                                    {threadsWithNames.map((thread) => (
                                        <div key={thread.userId} onClick={() => onSelectThread?.(thread.userId)} className={`p-3 border-b dark:border-gray-700 cursor-pointer ${currentThread?.userId === thread.userId ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-sm truncate dark:text-gray-200">{thread.userName}</p>
                                                {thread.unreadByAdmin && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate dark:text-gray-400">{thread.lastMessageText}</p>
                                        </div>
                                    ))}
                                </div>
                                </>
                            )}
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
                           {(adminTab === 'broadcast' && isAdmin) ? (
                             <div className="text-center p-4 text-gray-500">
                                <i className="fas fa-bullhorn text-3xl mb-2"></i>
                                <p className="font-semibold">Mode Pesan Global</p>
                                <p className="text-xs">Pesan yang Anda kirim di sini akan diterima oleh semua pengguna terdaftar.</p>
                            </div>
                           ) : (
                                <>
                                {messagesToDisplay.map((msg: Message) => (
                                    <div key={msg.id} className={`flex items-end gap-2 group ${msg.sender === (isAdmin ? 'admin' : 'user') ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === (isAdmin ? 'admin' : 'user') && <button onClick={() => handleDelete(msg)} className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>}
                                        <div className={`relative chat-bubble ${msg.sender === (isAdmin ? 'admin' : 'user') ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                                            {msg.isGlobal && <span className="font-bold text-xs block text-yellow-300">[PENGUMUMAN GLOBAL]</span>}
                                            <p>{msg.text}</p>
                                        </div>
                                        {msg.sender !== (isAdmin ? 'admin' : 'user') && <button onClick={() => handleDelete(msg)} className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>}
                                    </div>
                                ))}
                                </>
                           )}
                            <div ref={messagesEndRef} />
                        </div>

                         {((isAdmin) || (!isAdmin && userTab === 'conversation')) && (
                            <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-900">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isAdmin && adminTab === 'broadcast' ? "Kirim pesan global..." : "Ketik pesan..."}
                                    className="flex-grow p-2 border rounded-full text-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    disabled={isAdmin && adminTab === 'inbox' && !currentThread}
                                />
                                <button type="submit" className="bg-brand-secondary text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:bg-gray-400" disabled={isAdmin && adminTab === 'inbox' && !currentThread}>
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                         )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MessagePopup;