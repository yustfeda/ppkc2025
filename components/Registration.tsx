import React, { useState, useEffect } from 'react';
import type { User, RegistrationData, PublicPage, SelectionStage, FormField } from '../types';
import { setData, getUserRegistration, getSelectionStages, updateUserStageProgress, getRegistrationFormFields } from '../services/firebase';

interface RegistrationProps {
    user: User;
    setCurrentPage: (page: PublicPage) => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    registrationActive?: boolean;
}

const Registration: React.FC<RegistrationProps> = ({ user, setCurrentPage, showNotification, showConfirmation, registrationActive }) => {
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [allStages, setAllStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const fetchData = React.useCallback(async () => {
        setCheckingStatus(true);
        try {
            const [regData, stagesData] = await Promise.all([
                getUserRegistration(user.uid),
                getSelectionStages(),
            ]);
            setRegistration(regData);
            setAllStages(stagesData);
        } catch (err) {
            console.error(err);
            showNotification('Gagal memuat data pendaftaran.', 'error');
        } finally {
            setCheckingStatus(false);
        }
    }, [user.uid, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStageSubmit = async (e: React.FormEvent, stageId: string) => {
        e.preventDefault();
        setLoading(true);
        try {
            const progressUpdate = {
                status: 'pending' as const,
                submittedAt: Date.now(),
            };
            await updateUserStageProgress(user.uid, stageId, progressUpdate);
            showNotification('Konfirmasi berhasil! Status Anda sedang ditinjau.', 'success');
            fetchData(); // Refresh data
        } catch (err) {
            showNotification('Gagal melanjutkan tahap.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const StatusCard: React.FC<{
        status: 'Terkirim' | 'Lolos' | 'Gagal' | 'Info',
        title: string,
        message: React.ReactNode,
        children?: React.ReactNode
    }> = ({ status, title, message, children }) => {
        const theme = {
            Terkirim: { bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', icon: 'fa-solid fa-hourglass-half' },
            Lolos: { bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-500', text: 'text-green-700 dark:text-green-300', icon: 'fa-solid fa-circle-check' },
            Gagal: { bg: 'bg-red-100 dark:bg-red-900/50', border: 'border-red-500', text: 'text-red-700 dark:text-red-300', icon: 'fa-solid fa-circle-xmark' },
            Info: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-300', icon: 'fa-solid fa-info-circle' },
        };
        const currentTheme = theme[status];
        
        return (
            <div className={`p-6 rounded-lg shadow-md border-l-4 ${currentTheme.border} ${currentTheme.bg} animate-fade-in`}>
                <div className="flex items-start gap-4">
                    <i className={`${currentTheme.icon} text-3xl ${currentTheme.text} mt-1`}></i>
                    <div>
                        <h2 className={`font-bold text-lg ${currentTheme.text}`}>{title}</h2>
                        <div className={`text-sm ${currentTheme.text} mt-1`}>{message}</div>
                    </div>
                </div>
                {children && <div className="mt-4 pt-4 border-t border-gray-300/50 dark:border-gray-700/50">{children}</div>}
            </div>
        )
    };
    
    const isSelectionFinished = () => {
        if (!registration) return false;
        if (registration.status === 'Gagal') return true;
        // FIX: Added a check for `p` to prevent runtime errors if a stage progress entry is null.
        const hasFailedStage = registration.stageProgress && Object.values(registration.stageProgress).some((p: any) => p && p.status === 'gagal');
        if (hasFailedStage) return true;
        if (allStages.length > 0) {
            const lastStage = allStages[allStages.length - 1];
            if (registration.stageProgress?.[lastStage.id]?.status === 'lolos') return true;
        }
        return false;
    };

    const renderContent = () => {
        if (registrationActive === false) {
            return (
                <StatusCard 
                    status="Info" 
                    title="Pendaftaran Ditutup" 
                    message="Pendaftaran untuk saat ini sedang ditutup oleh admin. Silakan kembali lagi nanti."
                />
            );
        }
        
        if (!registration) {
            return (
                <StatusCard 
                    status="Info" 
                    title="Lengkapi Profil Anda Terlebih Dahulu" 
                    message="Untuk memulai proses seleksi, Anda harus melengkapi data diri di halaman Profil & Pendaftaran terlebih dahulu."
                >
                    <div className="text-center mt-4">
                        <button 
                            onClick={() => setCurrentPage('profile')} 
                            className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent"
                        >
                            Ke Halaman Profil & Pendaftaran
                        </button>
                    </div>
                </StatusCard>
            );
        }

        if (isSelectionFinished()) {
            return (
                <StatusCard 
                    status="Info" 
                    title="Proses Seleksi Telah Selesai" 
                    message="Rangkaian seleksi telah berakhir. Silakan lihat hasil akhir Anda di halaman Status."
                >
                    <div className="text-center mt-4">
                        <button 
                            onClick={() => setCurrentPage('status')} 
                            className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent"
                        >
                            Ke Halaman Status
                        </button>
                    </div>
                </StatusCard>
            );
        }

        if (registration.status === 'Terkirim') {
            return <StatusCard status="Terkirim" title="Pendaftaran Terkirim" message="Data Anda berhasil dikirim dan sedang dalam peninjauan administrasi oleh admin. Mohon tunggu informasi selanjutnya." />;
        }
        
        if (registration.status === 'Lolos') {
            const stagesForUser = allStages.slice(0); 

            // Find the index of the last 'lolos' stage
            let lastPassedStageIndex = -1;
            if (registration.status === 'Lolos') {
                lastPassedStageIndex = 0; // Administration passed
                for(let i = 1; i < stagesForUser.length; i++) {
                    if (registration.stageProgress?.[stagesForUser[i].id]?.status === 'lolos') {
                        lastPassedStageIndex = i;
                    } else {
                        break;
                    }
                }
            }

            const currentStage = stagesForUser[lastPassedStageIndex + 1];
            
            const currentStageProgress = currentStage ? registration.stageProgress?.[currentStage.id] : null;
            
            if (currentStageProgress?.status === 'pending') {
                return <StatusCard status="Terkirim" title={`Menunggu Hasil Tahap "${currentStage.title}"`} message="Anda telah setuju mengikuti tahap ini. Status sedang ditinjau oleh admin. Mohon tunggu." />;
            }
            
            if (currentStage) {
                return (
                    <div className="space-y-6">
                         <StatusCard status="Info" title="Lanjut ke Tahap Berikutnya!" message={`Selamat! Anda lolos tahap sebelumnya. Tahap selanjutnya adalah "${currentStage.title}". Klik tombol di bawah untuk melanjutkan.`}>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{currentStage.description}</p>
                            <div className="text-center mt-4">
                                <button 
                                    onClick={(e) => handleStageSubmit(e, currentStage.id)} 
                                    disabled={loading}
                                    className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent disabled:bg-gray-400"
                                >
                                    {loading ? 'Memproses...' : 'Setuju & Lanjutkan'}
                                </button>
                            </div>
                        </StatusCard>
                    </div>
                );
            }
        }

        return null;
    }
    
    if (checkingStatus) {
        return (
             <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                <i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i>
            </div>
        )
    }

    return (
        <div className="bg-brand-light dark:bg-brand-dark min-h-screen">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Proses Seleksi</h1>
                {renderContent()}
            </div>
        </div>
    );
};

export default Registration;