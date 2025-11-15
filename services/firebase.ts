import type { SelectionStage, AnnouncementDocument, AdminConfig, RegistrationData, User, HomePageUpdate, ManagedButton } from '../types';

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
    { id: "2", title: "Format Surat Pernyataan Kesediaan Mematuhi Peraturan Program Paskibraka", fileUrl: "#", thumbnailUrl: "https://i.imgur.com/8z2n1qH.png", description: "Harap diisi dan dibawa saat seleksi parade." },
    { id: "3", title: "Format Surat Persetujuan Orang Tua / Wali", fileUrl: "#", thumbnailUrl: "https://i.imgur.com/J3hL9wK.png", description: "Wajib dilengkapi sebagai syarat administrasi." }
];

const MOCK_CONFIG: AdminConfig = {
    registrationActive: true,
    loginActive: true,
    theme: 'light',
};

const MOCK_UPDATES: HomePageUpdate[] = [
    { id: "1", title: "Jadwal Seleksi Diperbarui!", content: "Perhatikan perubahan jadwal untuk Seleksi Kesehatan yang dimundurkan satu hari. Detail lengkap ada di halaman Tahapan Seleksi.", date: "25 Juli 2024", imageUrl: "https://images.unsplash.com/photo-1599059813005-7282b884c1f5?q=80&w=2070&auto=format&fit=crop" },
    { id: "2", title: "Latihan Gabungan", content: "Latihan gabungan akan dilaksanakan pada akhir pekan ini. Semua peserta diharapkan hadir.", date: "24 Juli 2024", imageUrl: "https://images.unsplash.com/photo-1612872895029-ed8a02b4a345?q=80&w=2070&auto=format&fit=crop" },
]

const MOCK_BUTTONS: ManagedButton[] = [
    { id: '1', label: 'Download Panduan', icon: 'fas fa-book', link: '#', formFields: [], showOnGuest: true, showOnUser: true }
]

// Data Fetching
export const getData = async <T>(path: string, mockData?: T): Promise<T> => {
    try {
        const snapshot = await database.ref(path).once('value');
        const data = snapshot.val();
        if (data !== null) {
            // Firebase returns arrays as objects with indices as keys. Convert back to array.
            if (mockData && Array.isArray(mockData) && typeof data === 'object') {
                return Object.values(data).filter(item => item !== null) as T;
            }
            return data;
        }
        if (mockData !== undefined) {
          await database.ref(path).set(mockData);
        }
        return mockData as T;
    } catch (error) {
        console.error(`Error fetching ${path}, returning mock data:`, error);
        return mockData as T;
    }
};

export const getSelectionStages = () => getData<SelectionStage[]>('selectionStages', MOCK_STAGES);
export const getAnnouncements = () => getData<AnnouncementDocument[]>('announcements', MOCK_ANNOUNCEMENTS);
export const getAdminConfig = () => getData<AdminConfig>('config', MOCK_CONFIG);
export const getHomeUpdates = () => getData<HomePageUpdate[]>('homeUpdates', MOCK_UPDATES);
export const getRegistrations = () => getData<{[uid: string]: RegistrationData}>('registrations', {});
export const getUserRegistration = (uid: string) => getData<RegistrationData | null>(`registrations/${uid}`);
export const getManagedButtons = () => getData<ManagedButton[]>('managedButtons', MOCK_BUTTONS);
export const getAttendanceData = () => getData<{[uid: string]: { present: boolean }}>('attendance', {});

// Data Writing
export const setData = async (path: string, data: any): Promise<void> => {
    return database.ref(path).set(data);
};

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

export const setAttendanceStatus = async (uid: string, present: boolean): Promise<void> => {
    return database.ref(`attendance/${uid}`).set({ present });
};


// Auth Functions
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
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('seenAdminWelcome');
    return auth.signOut();
};

export const updateAdminPassword = (newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
        return user.updatePassword(newPassword);
    }
    return Promise.reject(new Error("No user is currently signed in."));
};