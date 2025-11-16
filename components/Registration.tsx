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
    const [formData, setFormData] = useState<Partial<RegistrationData>>({
        uid: user.uid,
        fullName: '',
        birthPlace: '',
        birthDate: '',
        gender: 'Laki-laki',
        originUnit: '',
        email: user.email || '',
        medicalHistory: '',
        emergencyContact: '',
        documentLinks: {}
    });
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [allStages, setAllStages] = useState<SelectionStage[]>([]);
    const [docFields, setDocFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [error, setError] = useState('');

    const fetchData = React.useCallback(async () => {
        setCheckingStatus(true);
        try {
            const [regData, stagesData, fieldsData] = await Promise.all([
                getUserRegistration(user.uid),
                getSelectionStages(),
                getRegistrationFormFields()
            ]);
            setRegistration(regData);
            setAllStages(stagesData);
            setDocFields(fieldsData);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleDocLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            documentLinks: {
                ...formData.documentLinks,
                [e.target.name]: e.target.value,
            },
        });
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showConfirmation(
            "Silahkan periksa inputan terlebih dahulu, pastikan data yang dimasukan benar. Yakin ingin submit?",
            async () => {
                setLoading(true);
                setError('');
                const submissionData: RegistrationData = {
                    ...formData,
                    status: 'Terkirim',
                    submittedAt: Date.now(),
                    stageProgress: {},
                } as RegistrationData;
                try {
                    await setData(`registrations/${user.uid}`, submissionData);
                    showNotification('Pendaftaran berhasil dikirim!', 'success');
                    setRegistration(submissionData);
                } catch (err) {
                    setError('Gagal mengirim pendaftaran. Silakan coba lagi.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

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
    
    const inputClass = "peer form-input block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-dark rounded-md shadow-sm p-3 text-sm dark:text-white focus:ring-brand-accent focus:border-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";
    
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

        if (!registration) {
             return (
                <form onSubmit={handleInitialSubmit} className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative input-group">
                            <input id="fullName" name="fullName" onChange={handleChange} className={inputClass} required placeholder=" " />
                            <label htmlFor="fullName" className={labelClass}>Nama Lengkap</label>
                        </div>
                        <div className="relative input-group">
                            <input id="originUnit" name="originUnit" onChange={handleChange} className={inputClass} required placeholder=" " />
                             <label htmlFor="originUnit" className={labelClass}>Asal Satuan</label>
                        </div>
                         <div className="relative input-group">
                            <input id="birthPlace" name="birthPlace" onChange={handleChange} className={inputClass} required placeholder=" " />
                             <label htmlFor="birthPlace" className={labelClass}>Tempat Lahir</label>
                        </div>
                         <div className="relative input-group">
                            <input id="birthDate" type="date" name="birthDate" onChange={handleChange} className={inputClass} required placeholder=" " />
                             <label htmlFor="birthDate" className={labelClass}>Tanggal Lahir</label>
                        </div>
                        <div className="relative input-group">
                            <select id="gender" name="gender" onChange={handleChange} className={inputClass}>
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                            </select>
                             <label htmlFor="gender" className={labelClass}>Jenis Kelamin</label>
                        </div>
                        <div className="relative input-group">
                             <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClass} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`} required readOnly placeholder=" " />
                             <label htmlFor="email" className={labelClass}>Email</label>
                        </div>
                    </div>
                     <div className="relative input-group">
                        <textarea id="medicalHistory" name="medicalHistory" onChange={handleChange} className={inputClass} rows={2} placeholder=" "></textarea>
                         <label htmlFor="medicalHistory" className={labelClass}>Riwayat Penyakit (jika ada)</label>
                    </div>
                     <div className="relative input-group">
                        <input id="emergencyContact" name="emergencyContact" onChange={handleChange} className={inputClass} required placeholder=" " />
                         <label htmlFor="emergencyContact" className={labelClass}>Kontak Darurat (Nama & No. HP)</label>
                    </div>

                    <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <p className="text-xs text-gray-500 dark:text-gray-400 md:col-span-2 -mb-2">Upload dokumen ke G-Drive, lalu salin link yang bisa diakses publik.</p>
                        {docFields.map(field => (
                             <div key={field.id} className="relative input-group md:col-span-2">
                                <input 
                                    id={field.id} 
                                    type="url" 
                                    name={field.id} 
                                    onChange={handleDocLinkChange} 
                                    className={inputClass} 
                                    placeholder=" " 
                                    required={field.required} 
                                />
                                 <label htmlFor={field.id} className={labelClass}>{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                            </div>
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="text-right pt-2">
                        <button type="submit" disabled={loading} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent disabled:bg-gray-400">
                            {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
                        </button>
                    </div>
                </form>
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
                <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Pendaftaran & Status Seleksi</h1>
                {renderContent()}
            </div>
        </div>
    );
};

export default Registration;