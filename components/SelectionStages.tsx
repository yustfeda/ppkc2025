import React, { useState, useEffect } from 'react';
import { getSelectionStages, getUserRegistration } from '../services/firebase';
import type { SelectionStage, User, RegistrationData, PublicPage } from '../types';

type StageStatus = 'lolos' | 'gagal' | 'pending' | 'locked' | 'default';

const StageDetailPopup: React.FC<{ stage: SelectionStage; status: StageStatus; onClose: () => void }> = ({ stage, status, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
    };

    const getPopupContent = (): {
        isInfo: boolean;
        icon: string;
        color: string;
        title: string;
        message: string;
        formTitle?: string;
        formDescription?: string;
        formViewUrl?: string;
        formDownloadUrl?: string;
    } | null => {
        const infoViewContent = { 
            isInfo: true,
            icon: 'fa-solid fa-circle-info', 
            color: 'text-blue-500', 
            title: stage.title, 
            message: stage.description,
            formTitle: stage.formTitle,
            formDescription: stage.formDescription,
            formViewUrl: stage.formViewUrl,
            formDownloadUrl: stage.formDownloadUrl
        };

        if (!status || status === 'default' || status === 'locked') {
            return infoViewContent;
        }

        switch(status) {
            case 'pending': 
                return { 
                    isInfo: false, 
                    icon: 'fa-solid fa-hourglass-half', 
                    color: 'text-yellow-500', 
                    title: stage.popupContent?.pending?.title || 'Sedang Ditinjau', 
                    message: stage.popupContent?.pending?.message || 'Pendaftaran Anda untuk tahap ini telah kami terima dan sedang dalam proses peninjauan oleh tim panitia. Mohon tunggu informasi selanjutnya.'
                };
            case 'lolos': 
                return { 
                    isInfo: false, 
                    icon: 'fa-solid fa-circle-check', 
                    color: 'text-green-500', 
                    title: stage.popupContent?.lolos?.title || 'Selamat!', 
                    message: stage.popupContent?.lolos?.message || `Anda dinyatakan lolos tahap "${stage.title}". Anda dapat melanjutkan ke tahapan seleksi berikutnya.`
                };
            case 'gagal': 
                return { 
                    isInfo: false, 
                    icon: 'fa-solid fa-circle-xmark', 
                    color: 'text-red-500', 
                    title: stage.popupContent?.gagal?.title || 'Mohon Maaf', 
                    message: stage.popupContent?.gagal?.message || `Anda dinyatakan gagal tahap "${stage.title}". Terima kasih atas partisipasi Anda. Tetap semangat!`
                };
            default: return infoViewContent;
        }
    };
    const content = getPopupContent();

    if (!content) return null;
    
    if (content.isInfo) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
                <div 
                    className={`bg-brand-light dark:bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-lg text-left ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                    onClick={e => e.stopPropagation()}
                >
                     <div className="flex items-start gap-4">
                        <i className={`${content.icon} ${content.color} text-3xl mt-1`}></i>
                        <div>
                            <h3 className={`text-xl font-bold text-brand-primary dark:text-white mb-2`}>{content.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{content.message}</p>
                        </div>
                     </div>

                     {(content.formTitle || content.formDescription) && (
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                             {content.formTitle && <h4 className="font-semibold text-brand-dark dark:text-white">{content.formTitle}</h4>}
                             {content.formDescription && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.formDescription}</p>}
                             {(content.formViewUrl || content.formDownloadUrl) && (
                                <div className="flex gap-4 mt-3">
                                    {content.formViewUrl && content.formViewUrl !== '#' && <a href={content.formViewUrl} target="_blank" rel="noopener noreferrer" className="button bg-brand-secondary text-white px-4 py-2 text-xs rounded-md">Lihat Form</a>}
                                    {content.formDownloadUrl && content.formDownloadUrl !== '#' && <a href={content.formDownloadUrl} download className="button bg-gray-600 text-white px-4 py-2 text-xs rounded-md">Unduh Form</a>}
                                </div>
                             )}
                        </div>
                     )}

                     <div className="text-right mt-6">
                        <button onClick={handleClose} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent">Tutup</button>
                     </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-sm text-center ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                 <i className={`${content.icon} ${content.color} text-4xl mb-4`}></i>
                 <h3 className={`text-xl font-bold text-brand-primary dark:text-white mb-2`}>{content.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{content.message}</p>
                 <button onClick={handleClose} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent">Tutup</button>
            </div>
        </div>
    );
};


const StageCard: React.FC<{ stage: SelectionStage, progressStatus: StageStatus, onClick: () => void }> = ({ stage, progressStatus, onClick }) => {
    
    const getStatusInfo = () => {
        switch(progressStatus) {
            case 'lolos': return { 
                icon: 'fa-solid fa-check-circle', 
                textColor: 'text-green-700 dark:text-green-300', 
                bgColor: 'bg-white dark:bg-brand-dark'
            };
            case 'gagal': return { 
                icon: 'fa-solid fa-times-circle', 
                textColor: 'text-red-700 dark:text-red-300',
                bgColor: 'bg-white dark:bg-brand-dark'
            };
            case 'pending': return { 
                icon: 'fa-solid fa-hourglass-half', 
                textColor: 'text-yellow-700 dark:text-yellow-300',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/50'
            };
            case 'locked': return { 
                icon: 'fa-solid fa-lock', 
                textColor: 'text-gray-400 dark:text-gray-500',
                bgColor: 'bg-gray-100 dark:bg-brand-dark/50'
            };
            default: return { // Default view for guests
                icon: 'fa-solid fa-calendar-day', 
                textColor: 'text-gray-700 dark:text-gray-300',
                bgColor: 'bg-white dark:bg-brand-dark'
            };
        }
    };
    const statusInfo = getStatusInfo();
    const isLocked = progressStatus === 'locked';
    const isCompleted = progressStatus === 'lolos' || progressStatus === 'gagal';

    return (
        <div 
            onClick={onClick} 
            className={`p-4 rounded-lg shadow-md border-l-4 flex gap-4 items-start interactive-card cursor-pointer 
                ${isCompleted ? (progressStatus === 'lolos' ? 'border-green-500' : 'border-red-500') : (progressStatus === 'pending' ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600')} 
                ${statusInfo.bgColor} ${isLocked ? 'opacity-60' : ''}`}
        >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-2xl ${statusInfo.textColor}`}>
                <i className={statusInfo.icon}></i>
            </div>
            <div>
                <p className={`font-bold text-xs ${statusInfo.textColor}`}>{stage.date}</p>
                <h3 className={`font-semibold text-base ${isLocked ? 'text-gray-500 dark:text-gray-400' : 'text-brand-primary dark:text-white'}`}>{stage.title}</h3>
                <p className={`text-xs mt-1 ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>{stage.description}</p>
            </div>
        </div>
    );
};

interface SelectionStagesProps {
    user: User | null;
    setCurrentPage: (page: PublicPage) => void;
}

const SelectionStages: React.FC<SelectionStagesProps> = ({ user, setCurrentPage }) => {
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [popupStage, setPopupStage] = useState<SelectionStage | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const stagesData = await getSelectionStages();
            setStages(stagesData);
            if (user) {
                const regData = await getUserRegistration(user.uid);
                setRegistration(regData);
            }
            setLoading(false);
        };
        fetchData();
    }, [user]);

    const getStageProgress = (stage: SelectionStage, index: number): StageStatus => {
        if (!user || !registration || registration.status === 'Belum Mendaftar') {
            return 'default';
        }

        // Handle the first stage (Administrasi) based on the main status
        if (index === 0) {
            switch(registration.status) {
                case 'Terkirim': return 'pending';
                case 'Lolos': return 'lolos';
                case 'Gagal': return 'gagal';
                default: return 'locked'; 
            }
        }
        
        // If administrative selection failed, all subsequent stages are locked.
        if (registration.status !== 'Lolos') {
            return 'locked';
        }

        // Determine if this stage is unlocked by checking the previous stage's status.
        const prevStage = stages[index - 1];
        const prevStageProgress = (index - 1 === 0) 
            ? (registration.status === 'Lolos' ? 'lolos' : 'gagal')
            : registration.stageProgress?.[prevStage.id]?.status;

        if (prevStageProgress !== 'lolos') {
            return 'locked';
        }

        // If the previous stage was passed, this stage is now active.
        // Its status is determined by its entry in stageProgress, or 'pending' if not yet submitted.
        return registration.stageProgress?.[stage.id]?.status || 'pending';
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                <i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i>
            </div>
        );
    }
    
    return (
        <div className="bg-brand-light dark:bg-brand-dark min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            {popupStage && <StageDetailPopup stage={popupStage} status={getStageProgress(popupStage, stages.findIndex(s => s.id === popupStage.id))} onClose={() => setPopupStage(null)} />}
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-brand-primary dark:text-gray-100">Tahapan Seleksi</h1>
                    <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
                        {user ? 'Lacak kemajuan Anda melalui setiap tahapan. Klik pada tahapan untuk melihat detail status.' : 'Ikuti setiap proses seleksi dengan semangat dan sportifitas. Klik untuk detail.'}
                    </p>
                </div>
                <div className="max-w-2xl mx-auto space-y-4">
                    {stages.map((stage, index) => (
                       <StageCard 
                         key={stage.id} 
                         stage={stage} 
                         progressStatus={getStageProgress(stage, index)}
                         onClick={() => setPopupStage(stage)}
                       />
                    ))}
                </div>
                 {!user && (
                    <div className="mt-8 text-center bg-blue-50 dark:bg-blue-900/50 p-4 rounded-md max-w-2xl mx-auto">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <i className="fas fa-info-circle mr-2"></i>
                            Silakan <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }} className="font-bold underline">masuk</a> untuk melihat status dan kemajuan pendaftaran Anda.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectionStages;