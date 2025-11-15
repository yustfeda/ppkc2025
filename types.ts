export type PublicPage = 
  'home' | 'stages' | 'announcements' | 'contact' | 
  'login' | 'registration' | 'profile' | 'status';

export type AdminPage =
  'dashboard' | 'profile' | 'users' | 'announcements' | 
  'rekap' | 'stages' | 'settings' | 'highlights' | 'attendance' | 'buttons';

export interface SelectionStage {
  id: string;
  title: string;
  description: string;
  date: string;
  // New fields for stage-specific forms managed by admin
  formTitle?: string;
  formDescription?: string;
  formViewUrl?: string;
  formDownloadUrl?: string;
}

export interface AnnouncementDocument {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl: string;
}

export interface AdminConfig {
    registrationActive: boolean;
    loginActive: boolean;
    theme: 'light' | 'dark';
}

export interface HomePageUpdate {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    date: string;
}

// This mirrors the user object from Firebase Auth
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export interface RegistrationData {
    uid: string;
    fullName: string;
    birthPlace: string;
    birthDate: string;
    gender: 'Laki-laki' | 'Perempuan';
    originUnit: string;
    email: string;
    medicalHistory: string;
    emergencyContact: string;
    // New optional fields for document links
    kkUrl?: string;
    photoUrl?: string;
    parentPermitUrl?: string;
    // Main administrative status
    status: 'Belum Mendaftar' | 'Terkirim' | 'Lolos' | 'Gagal';
    submittedAt?: number;
    // Granular progress for subsequent stages
    stageProgress: { 
      [stageId: string]: { 
        status: 'lolos' | 'gagal' | 'pending';
        submissionUrl?: string;
        submittedAt?: number;
      }
    };
}

export interface ConfirmationState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
}


export interface AdminPageProps {
  showNotification: (message: string, type: 'success' | 'error') => void;
  showConfirmation: (message: string, onConfirm: () => void) => void;
  user?: User | null; // Make user optional, but available
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  required: boolean;
}

export interface ManagedButton {
  id: string;
  label:string;
  icon: string; // e.g., 'fas fa-download'
  link: string; // URL
  formTitle?: string;
  formFields?: FormField[];
  showOnGuest?: boolean;
  showOnUser?: boolean;
}

export interface DynamicFormModalState {
    isOpen: boolean;
    button: ManagedButton | null;
}