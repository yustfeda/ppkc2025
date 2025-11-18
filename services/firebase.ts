import type { SelectionStage, AnnouncementDocument, AdminConfig, RegistrationData, User, HomePageUpdate, ManagedButton, Supporter, SupportersSection, FormSubmission, FormField, ChatThread, Message } from '../types';

declare const firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyD1AfOZUjEAHO290x83M0nYNCqyJ_LbM5E",
  authDomain: "projectappadmindiluar.firebaseapp.com",
  databaseURL: "https://projectappadmindiluar-default-rtdb.firebaseio.com",
  projectId: "projectappadmindiluar",
  storageBucket: "projectappadmindiluar.firebasestorage.app",
  messagingSenderId: "252637053604",
  appId: "1:252637053604:web:e7edfc7370bc6f7d071c31"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const auth = firebase.auth();

const MOCK_STAGES: SelectionStage[] = [
    { id: "1", title: "Seleksi Administrasi", description: "Sesuai ketentuan daerah masing-masing", date: "10 - 15 Juni 2024" },
    { id: "2", title: "Seleksi Pancasila dan Wawasan Kebangsaan", description: "Sesuai ketentuan daerah masing-masing", date: "16 Juni 2024", formTitle: "Formulir Tes Wawasan Kebangsaan", formDescription: "Silakan unduh dan isi formulir di bawah ini, lalu unggah ke Google Drive dan kumpulkan linknya.", formViewUrl: "#", formDownloadUrl: "#" },
    { id: "3", title: "Seleksi Intelegensia Umum", description: "Sesuai ketentuan daerah masing-masing", date: "17 Juni 2024", formTitle: "", formDescription: "", formViewUrl: "", formDownloadUrl: "" },
    { id: "4", title: "Seleksi Kesehatan", description: "Sesuai ketentuan daerah masing-masing", date: "18 - 19 Juni 2024", formTitle: "", formDescription: "", formViewUrl: "", formDownloadUrl: "" },
    { id: "5", title: "Seleksi Parade", description: "Sesuai ketentuan daerah masing-masing", date: "20 Juni 2024", formTitle: "", formDescription: "", formViewUrl: "", formDownloadUrl: "" },
    { id: "6", title: "Seleksi Peraturan Baris Berbaris dan Kesamaptaan", description: "Sesuai ketentuan daerah masing-masing", date: "21 Juni 2024", formTitle: "", formDescription: "", formViewUrl: "", formDownloadUrl: "" },
    { id: "7", title: "Seleksi Kepribadian", description: "Sesuai ketentuan daerah masing-masing", date: "22 Juni 2024", formTitle: "", formDescription: "", formViewUrl: "", formDownloadUrl: "" },
    { id: "8", title: "Hasil Akhir", description: "Sesuai ketentuan daerah masing-masing", date: "30 Juni 2024", formTitle: "", formDescription: "", formViewUrl: "", formDownloadUrl: "" }
];
  
const MOCK_ANNOUNCEMENTS: AnnouncementDocument[] = [
    { id: "1", title: "Buku Teks Utama Pancasila Kelas X", fileUrl: "#", thumbnailUrl: "https://i.imgur.com/r6M4UfN.png", description: "Materi untuk seleksi wawasan kebangsaan." },
    { id: "2", title: "Format Surat Pernyataan Kesediaan Mematuhi Peraturan Program Paskibra", fileUrl: "#", thumbnailUrl: "https://i.imgur.com/8z2n1qH.png", description: "Harap diisi dan dibawa saat seleksi parade." },
    { id: "3", title: "Format Surat Persetujuan Orang Tua / Wali", fileUrl: "#", thumbnailUrl: "https://i.imgur.com/J3hL9wK.png", description: "Wajib dilengkapi sebagai syarat administrasi." }
];

const MOCK_CONFIG: AdminConfig = {
    registrationActive: true,
    loginActive: true,
    theme: 'light',
    showRegistrationButton: true,
    registrationComingSoonText: 'SEGERA HADIR',
    appVersion: 'v1.1.11',
    welcomePopup: {
        title: "Selamat datang, {userName}!",
        message: "Silahkan klik ok untuk melanjutkan.",
        buttons: []
    }
};

const MOCK_UPDATES: HomePageUpdate[] = [
    { id: "1", title: "Jadwal Seleksi Diperbarui!", content: "Perhatikan perubahan jadwal untuk Seleksi Kesehatan yang dimundurkan satu hari. Detail lengkap ada di halaman Tahapan Seleksi.", date: "25 Juli 2024", imageUrl: "https://images.unsplash.com/photo-1599059813005-7282b884c1f5?q=80&w=2070&auto=format&fit=crop" },
    { id: "2", title: "Latihan Gabungan", content: "Latihan gabungan akan dilaksanakan pada akhir pekan ini. Semua peserta diharapkan hadir.", date: "24 Juli 2024", imageUrl: "https://images.unsplash.com/photo-1612872895029-ed8a02b4a345?q=80&w=2070&auto=format&fit=crop" },
]

const MOCK_BUTTONS: ManagedButton[] = [
    { id: '1', label: 'Download Panduan', icon: 'fas fa-book', link: '#', formFields: [], showOnGuest: true, showOnUser: true }
]

const MOCK_SUPPORTERS_SECTION: SupportersSection = {
    title: 'Didukung Oleh',
    items: [
        { id: 'sup1', name: 'Logo 1', imageUrl: 'https://via.placeholder.com/150x60/CCCCCC/FFFFFF?text=Logo+1', link: '#' },
        { id: 'sup2', name: 'Logo 2', imageUrl: 'https://via.placeholder.com/150x60/CCCCCC/FFFFFF?text=Logo+2', link: '#' },
    ]
};

const MOCK_REG_FORM_FIELDS: FormField[] = [
    { id: 'kkUrl', label: 'Link Kartu Keluarga', type: 'url', required: true },
    { id: 'photoUrl', label: 'Link Foto 4x6 BG Merah', type: 'url', required: true },
    { id: 'parentPermitUrl', label: 'Link Surat Izin Orang Tua (Opsional)', type: 'url', required: false },
]

// Data Fetching
export const getData = async <T>(path: string, mockData?: T): Promise<T> => {
    try {
        const snapshot = await database.ref(path).once('value');
        const data = snapshot.val();
        if (data !== null) {
            // This logic handles Firebase returning an object of items when we expect an array
            if (mockData && Array.isArray(mockData) && typeof data === 'object') {
                return Object.values(data).filter(item => item !== null) as T;
            }
            return data;
        }
        // If the path doesn't exist in Firebase, initialize it with mock data
        if (mockData !== undefined) {
            await database.ref(path).set(mockData);
        }
        return mockData as T;
    } catch (error) {
        console.error(`[Firebase] Realtime fetch failed for ${path}. Falling back to initial mock data.`, error);
        return mockData as T;
    }
};

// Getters now use realtime getData by default
export const getSelectionStages = () => getData<SelectionStage[]>('selectionStages', MOCK_STAGES);
export const getAnnouncements = () => getData<AnnouncementDocument[]>('announcements', MOCK_ANNOUNCEMENTS);
export const getAdminConfig = () => getData<AdminConfig>('config', MOCK_CONFIG);
export const getHomeUpdates = () => getData<HomePageUpdate[]>('homeUpdates', MOCK_UPDATES);
export const getRegistrations = () => getData<{[uid: string]: RegistrationData}>('registrations', {});
export const getUserRegistration = (uid: string) => getData<RegistrationData | null>(`registrations/${uid}`);
export const getManagedButtons = () => getData<ManagedButton[]>('managedButtons', MOCK_BUTTONS);
export const getSupporters = () => getData<SupportersSection>('supporters', MOCK_SUPPORTERS_SECTION);
export const getDailyAttendanceData = (date: string) => getData<{[uid: string]: { present: boolean; timestamp: number }}>(`attendance/${date}`, {});
export const getAllFormSubmissions = () => getData<{[buttonId: string]: {[submissionId: string]: FormSubmission}}>('formSubmissions', {});
export const getRegistrationFormFields = () => getData<FormField[]>('registrationFormFields', MOCK_REG_FORM_FIELDS);

// Data Writing
export const setData = async (path: string, data: any): Promise<void> => {
    return database.ref(path).set(data);
};

export const setFormSubmission = async (buttonId: string, userId: string, userEmail: string, data: Record<string, string>): Promise<void> => {
    const submissionId = `${userId}_${Date.now()}`;
    const submissionData: FormSubmission = {
        id: submissionId,
        buttonId,
        userId,
        userEmail,
        submittedAt: Date.now(),
        data,
    };
    return database.ref(`formSubmissions/${buttonId}/${submissionId}`).set(submissionData);
}

export const updateRegistrationStatus = (uid: string, status: 'Lolos' | 'Gagal'): Promise<void> => {
    return database.ref(`registrations/${uid}/status`).set(status);
};

export const updateUserStageProgress = (uid: string, stageId: string, progress: RegistrationData['stageProgress'][string]): Promise<void> => {
    return database.ref(`registrations/${uid}/stageProgress/${stageId}`).set(progress);
};

export const deleteUserRegistration = (uid: string): Promise<void> => {
    // This removes the entire registration node for the user.
    return database.ref(`registrations/${uid}`).remove();
};

export const setDailyAttendanceStatus = async (date: string, uid: string, present: boolean): Promise<void> => {
    if (present) {
        return database.ref(`attendance/${date}/${uid}`).set({ present, timestamp: Date.now() });
    } else {
        return database.ref(`attendance/${date}/${uid}`).remove();
    }
};

export const resetAllRegistrations = (): Promise<void> => {
    return database.ref('registrations').remove();
};

export const updateUserMessagingPermission = (uid: string, enabled: boolean): Promise<void> => {
    return database.ref(`registrations/${uid}/messagingEnabled`).set(enabled);
};

// Auth Functions
export const setAuthPersistence = (): Promise<void> => {
    return auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
}

export const onAuthChange = (callback: (user: User | null) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const registerUser = (email: string, password: string): Promise<any> => {
    return auth.createUserWithEmailAndPassword(email, password);
};

export const loginUser = (email: string, password: string): Promise<any> => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const logoutUser = (): Promise<void> => {
    return auth.signOut();
};

export const updateAdminPassword = (newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
        return user.updatePassword(newPassword);
    }
    return Promise.reject(new Error("No user is currently signed in."));
};

// --- Messaging System ---
const getToday = () => new Date().toISOString().split('T')[0];

export const sendMessage = async (
    userId: string,
    userEmail: string,
    text: string,
    sender: 'user' | 'admin',
    isGlobal: boolean = false
): Promise<void> => {
    // User daily limit check (only applies to 'user' sender)
    if (sender === 'user') {
        const today = getToday();
        const limitRef = database.ref(`messageLimits/${userId}/${today}`);
        const { committed } = await limitRef.transaction(currentCount => {
            if (currentCount === null) return 1;
            if (currentCount >= 5) return; // Abort if limit reached
            return currentCount + 1;
        });
        if (!committed) {
            throw new Error("Batas pengiriman pesan harian (5) telah tercapai.");
        }
    }

    const message: Omit<Message, 'id'> = {
        text,
        timestamp: Date.now(),
        sender,
        isGlobal,
    };

    const fanOut: { [key: string]: any } = {};

    // Logic for a global broadcast message from an admin
    if (isGlobal && sender === 'admin') {
        const registrations = await getRegistrations();
        if (!registrations) return;

        Object.values(registrations).forEach(reg => {
            if (reg.uid) { // Ensure user has a valid UID
                const newMessageRef = database.ref(`chats/${reg.uid}/messages`).push();
                const messageId = newMessageRef.key!;
                
                // Add the new global message to each user's chat
                fanOut[`/chats/${reg.uid}/messages/${messageId}`] = { ...message, id: messageId };
                
                // Atomically update metadata fields for each user's thread
                fanOut[`/chats/${reg.uid}/metadata/userId`] = reg.uid;
                fanOut[`/chats/${reg.uid}/metadata/userEmail`] = reg.email;
                fanOut[`/chats/${reg.uid}/metadata/lastMessageText`] = `[Pesan Global] ${text}`;
                fanOut[`/chats/${reg.uid}/metadata/lastMessageTimestamp`] = message.timestamp;
                fanOut[`/chats/${reg.uid}/metadata/unreadByAdmin`] = false; // Not unread for the admin who sent it
                fanOut[`/chats/${reg.uid}/metadata/unreadByUser`] = true;  // Mark as unread for the user
            }
        });
    } else { 
        // Logic for a personal message (user-to-admin or admin-to-user)
        const newMessageRef = database.ref(`chats/${userId}/messages`).push();
        const messageId = newMessageRef.key!;
        const finalMessage: Message = { ...message, id: messageId };

        // Add the new personal message
        fanOut[`/chats/${userId}/messages/${messageId}`] = finalMessage;

        // Atomically update metadata fields for the specific thread
        fanOut[`/chats/${userId}/metadata/userId`] = userId;
        fanOut[`/chats/${userId}/metadata/userEmail`] = userEmail;
        fanOut[`/chats/${userId}/metadata/lastMessageText`] = text;
        fanOut[`/chats/${userId}/metadata/lastMessageTimestamp`] = message.timestamp;
        fanOut[`/chats/${userId}/metadata/unreadByAdmin`] = sender === 'user';
        fanOut[`/chats/${userId}/metadata/unreadByUser`] = sender === 'admin';
    }

    // Execute the single, atomic multi-path update
    if (Object.keys(fanOut).length > 0) {
        return database.ref().update(fanOut);
    }
};


export const deleteMessage = (userId: string, messageId: string): Promise<void> => {
    return database.ref(`chats/${userId}/messages/${messageId}`).remove();
};

export const clearChatThread = (userId: string): Promise<void> => {
    // Also clear metadata to reset the conversation state
    return database.ref(`chats/${userId}`).remove();
};

export const markThreadAsRead = (userId: string, reader: 'user' | 'admin'): Promise<void> => {
    const keyToUpdate = reader === 'user' ? 'unreadByUser' : 'unreadByAdmin';
    return database.ref(`chats/${userId}/metadata`).update({ [keyToUpdate]: false });
};


export const listenToUserChatThread = (userId: string, callback: (thread: ChatThread | null) => void): () => void => {
    const threadRef = database.ref(`chats/${userId}`);
    const listener = (snapshot: any) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const thread: ChatThread = {
                ...data.metadata,
                messages: data.messages || {}
            };
            callback(thread);
        } else {
            callback(null);
        }
    };
    threadRef.on('value', listener);
    return () => threadRef.off('value', listener);
};

export const listenToAllChatThreads = (callback: (threads: Record<string, ChatThread>) => void): () => void => {
    const chatsRef = database.ref('chats');
    const listener = (snapshot: any) => {
        if (snapshot.exists()) {
            const rawThreads = snapshot.val();
            const transformedThreads: Record<string, ChatThread> = {};
            for (const userId in rawThreads) {
                const rawThread = rawThreads[userId];
                if (rawThread.metadata) {
                    transformedThreads[userId] = {
                        ...rawThread.metadata,
                        messages: rawThread.messages || {}
                    };
                }
            }
            callback(transformedThreads);
        } else {
            callback({});
        }
    };
    chatsRef.on('value', listener);
    return () => chatsRef.off('value', listener);
};