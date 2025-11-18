export type PublicPage = 
  'home' | 'stages' | 'announcements' | 'contact' | 
  'login' | 'registration' | 'profile' | 'status' | 'messages';

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
  // New fields for custom popup content
  popupContent?: {
    pending: { title: string; message: string; };
    lolos: { title: string; message: string; };
    gagal: { title: string; message: string; };
  };
}

export interface AnnouncementDocument {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl: string;
}

export interface ProofOfPassingConfig {
    participantNumberPrefix1: string;
    participantNumberPrefix2: string;
    title: string;
    headerImageUrl: string;
    congratsText: string;
    proofText: string;
}

export interface AdminConfig {
    registrationActive: boolean;
    loginActive: boolean;
    theme: 'light' | 'dark';
    showRegistrationButton: boolean;
    registrationComingSoonText: string;
    appVersion: string;
    userMessagingActive: boolean; // Global messaging toggle
    proofOfPassing?: ProofOfPassingConfig;
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
    participantNumber?: string; // New field for unique participant number
    // New dynamic fields for document links and profile picture
    documentLinks?: Record<string, string>;
    profilePictureUrl?: string;
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
  type: 'text' | 'textarea' | 'select' | 'date' | 'email' | 'url' | 'password';
  required: boolean;
  options?: string[]; // for select type
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
  includeInRecap?: boolean; // New field
}

export interface DynamicFormModalState {
    isOpen: boolean;
    button: ManagedButton | null;
}

export interface Supporter {
  id: string;
  name: string;
  imageUrl?: string;
  icon?: string;
  link?: string;
}

export interface SupportersSection {
  title: string;
  items: Supporter[];
}

export interface FormSubmission {
    id: string; // submission id (e.g., user uid + timestamp)
    buttonId: string;
    userId: string;
    userEmail: string;
    submittedAt: number;
    data: Record<string, string>;
}

// Messaging System Types
export interface Message {
  id: string;
  text: string;
  timestamp: number;
  sender: 'admin' | 'user';
  isGlobal?: boolean;
}

export interface ChatThread {
  userId: string;
  userEmail: string;
  lastMessageText?: string;
  lastMessageTimestamp?: number;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  messages: Record<string, Message>;
}

// For flattened admin inbox view
export interface InboxMessage extends Message {
  userId: string;
  userEmail: string;
}

export interface ReplyState {
  isOpen: boolean;
  messageToReplyTo: InboxMessage | null;
}