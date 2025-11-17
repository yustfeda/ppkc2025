// Revised MessagePopup component (Broadcast Model A) // Broadcast disimpan di path messages/global dan muncul otomatis di semua user.

import React, { useState, useEffect, useRef, useMemo } from 'react'; import type { User, ChatThread, Message, RegistrationData } from '../../types';

interface MessagePopupProps { user: User | null; isAdmin: boolean; isOpen: boolean; onClose: () => void; threads?: Record<string, ChatThread>; allRegistrations?: RegistrationData[]; currentThread?: ChatThread | null; onSendMessage: (targetUserId: string | 'GLOBAL', text: string, isGlobal: boolean) => Promise<void>; onDeleteMessage: (targetUserId: string | 'GLOBAL', messageId: string) => void; onClearThread: (targetUserId: string | 'GLOBAL') => void; onSelectThread?: (userId: string | 'GLOBAL') => void; showConfirmation: (message: string, onConfirm: () => void) => void; }

const MessagePopup: React.FC<MessagePopupProps> = ({ user, isAdmin, isOpen, onClose, threads, allRegistrations = [], currentThread, onSendMessage, onDeleteMessage, onClearThread, onSelectThread, showConfirmation }) => { const [isClosing, setIsClosing] = useState(false); const [newMessage, setNewMessage] = useState(''); const [broadcastMessage, setBroadcastMessage] = useState(''); const messagesEndRef = useRef<HTMLDivElement>(null); const [adminTab, setAdminTab] = useState<'inbox' | 'broadcast'>('inbox'); const [userTab, setUserTab] = useState<'conversation' | 'inbox'>('conversation');

useEffect(() => { if (isOpen) { setIsClosing(false); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } }, [isOpen, currentThread?.messages, userTab, adminTab]);

useEffect(() => { if (!isOpen) return; if (!isAdmin) setUserTab('conversation'); if (isAdmin) setAdminTab((prev) => prev); // JANGAN RESET TAB }, [isOpen, isAdmin]);

if (!isOpen) return null;

const handleClose = () => { setIsClosing(true); setTimeout(onClose, 300); };

const handleSendMessage = async (e: React.FormEvent) => { e.preventDefault(); if (!user) return;

const isGlobal = isAdmin && adminTab === 'broadcast';
const textToSend = isGlobal ? broadcastMessage : newMessage;
if (!textToSend.trim()) return;

// PERBAIKAN TERBESAR — Target broadcast adalah "GLOBAL"
let targetUserId: string | 'GLOBAL' = 'GLOBAL';

if (!isGlobal) {
  if (isAdmin) targetUserId = currentThread?.userId || 'GLOBAL';
  else targetUserId = user.uid;
}

try {
  await onSendMessage(targetUserId, textToSend, isGlobal);
  if (isGlobal) setBroadcastMessage('');
  else setNewMessage('');
} catch (error: any) {
  alert(error.message);
}

};

const handleDelete = (msg: Message) => { const targetUserId = msg.isGlobal ? 'GLOBAL' : (currentThread?.userId || user?.uid || 'GLOBAL'); showConfirmation('Hapus pesan ini?', () => onDeleteMessage(targetUserId, msg.id)); };

const handleClearConversation = () => { const targetUserId = currentThread?.userId || 'GLOBAL'; showConfirmation('Hapus semua pesan?', () => onClearThread(targetUserId)); };

const handleNewMessageUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const selectedUserId = e.target.value; if (onSelectThread) onSelectThread(selectedUserId); };

const allSortedMessages = currentThread ? Object.values(currentThread.messages).sort((a, b) => a.timestamp - b.timestamp) : [];

const threadsWithNames = useMemo(() => { if (!threads) return []; return Object.values(threads) .map((thread) => { const regData = allRegistrations.find((r) => r.uid === thread.userId); return { ...thread, userName: regData?.fullName || thread.userEmail, }; }) .sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)); }, [threads, allRegistrations]);

// FILTER BENAR UNTUK MODEL A const inboxMessages = allSortedMessages.filter((msg) => msg.sender === 'admin'); const conversationMessages = allSortedMessages.filter((msg) => !msg.isGlobal);

const messagesToDisplay = isAdmin ? allSortedMessages : userTab === 'inbox' ? inboxMessages : conversationMessages;

const currentThreadName = allRegistrations.find((r) => r.uid === currentThread?.userId)?.fullName || currentThread?.userEmail;

return ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4" onClick={handleClose}> <div className={bg-brand-light dark:bg-brand-dark rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}} onClick={(e) => e.stopPropagation()} > <header className="flex-shrink-0 p-4 border-b dark:border-gray-700 flex justify-between items-center"> <div> <h3 className="text-lg font-semibold text-brand-dark dark:text-white"> {isAdmin ? Pesan Admin: ${currentThreadName || 'Pilih Percakapan'} : 'Pesan ke Admin'} </h3> {(currentThread || isAdmin) && ( <button onClick={handleClearConversation} className="text-xs text-red-500 hover:underline"> <i className="fas fa-eraser mr-1"></i>Hapus Percakapan </button> )} </div> <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"> <i className="fas fa-times text-xl"></i> </button> </header>

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
                  {allRegistrations.map((reg) => (
                    <option key={reg.uid} value={reg.uid}>{reg.fullName} ({reg.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex-grow overflow-y-auto">
                {threadsWithNames.map((thread) => (
                  <div key={thread.userId} onClick={() => onSelectThread?.(thread.userId)} className={`p-3 border-b dark:border-gray-700 cursor-pointer ${currentThread?.userId === thread.userId ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm truncate dark:text-gray-200">{thread.userName}</p>
                      {thread.unreadByAdmin && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-2" />}
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
          {isAdmin && adminTab === 'broadcast' ? (
            <div className="text-center p-4 text-gray-500">
              <i className="fas fa-bullhorn text-3xl mb-2" />
              <p className="font-semibold">Mode Pesan Global</p>
              <p className="text-xs">Semua pengguna akan menerima pesan ini.</p>
            </div>
          ) : (
            messagesToDisplay.map((msg: Message) => (
              <div key={msg.id} className={`flex items-end gap-2 group ${msg.sender === (isAdmin ? 'admin' : 'user') ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === (isAdmin ? 'admin' : 'user') && (
                  <button onClick={() => handleDelete(msg)} className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100">
                    <i className="fas fa-trash" />
                  </button>
                )}
                <div className={`relative chat-bubble ${msg.sender === (isAdmin ? 'admin' : 'user') ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                  {msg.isGlobal && <span className="font-bold text-xs block text-yellow-300">[PENGUMUMAN GLOBAL]</span>}
                  <p>{msg.text}</p>
                </div>
                {msg.sender !== (isAdmin ? 'admin' : 'user') && (
                  <button onClick={() => handleDelete(msg)} className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100">
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {(isAdmin || (!isAdmin && userTab === 'conversation')) && (
          <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-900">
            <input
              type="text"
              value={isAdmin && adminTab === 'broadcast' ? broadcastMessage : newMessage}
              onChange={(e) => {
                if (isAdmin && adminTab === 'broadcast') setBroadcastMessage(e.target.value);
                else setNewMessage(e.target.value);
              }}
              placeholder={isAdmin && adminTab === 'broadcast' ? 'Ketik pesan global...' : 'Ketik pesan...'}
              className="flex-grow p-2 border rounded-full text-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              disabled={isAdmin && adminTab === 'inbox' && !currentThread}
            />

            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0"
              disabled={isAdmin && adminTab === 'inbox' && !currentThread}
            >
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        )}
      </main>
    </div>
  </div>
</div>

); };

export default MessagePopup;