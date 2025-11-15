import React, { useState, useEffect } from 'react';
import type { User, RegistrationData, PublicPage, SelectionStage, ConfirmationState } from '../types';
import { setData, getUserRegistration, getSelectionStages, updateUserStageProgress } from '../services/firebase';

interface RegistrationProps {
    user: User;
    setCurrentPage: (page: PublicPage) => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const Registration: React.FC<RegistrationProps> = ({ user, setCurrentPage, showNotification, showConfirmation }) => {
    const [formData, setFormData] = useState<Omit<RegistrationData, 'status' | 'stageProgress' | 'submittedAt'>>({
        uid: user.uid,
        fullName: '',
        birthPlace: '',
        birthDate: '',
        gender: 'Laki-laki',
        originUnit: '',
        email: user.email || '',
        medicalHistory: '',
        emergencyContact: '',
        kkUrl: '',
        photoUrl: '',
        parentPermitUrl: ''
    });
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [allStages, setAllStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [error, setError] = useState('');

    const fetchData = React.useCallback(async () => {
        setCheckingStatus(true);
        try {
            const [regData, stagesData] = await Promise.all([
                getUserRegistration(user.uid),
                getSelectionStages()
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                };
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
    
    const inputClass = "mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-dark rounded-md shadow-sm p-2 text-sm dark:text-white dark:placeholder-gray-400";
    
    const isSelectionFinished = () => {
        if (!registration) return false;
        if (registration.status === 'Gagal') return true;
        const hasFailedStage = Object.values(registration.stageProgress || {}).some(p => p.status === 'gagal');
        if (hasFailedStage) return true;
        if (allStages.length > 0) {
            const lastStage = allStages[allStages.length - 1];
            if (registration.stageProgress?.[lastStage.id]?.status === 'lolos') return true;
        }
        return false;
    };

    const renderContent = () => {
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
                <form onSubmit={handleInitialSubmit} className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Nama Lengkap</label>
                            <input name="fullName" onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Asal Satuan</label>
                            <input name="originUnit" onChange={handleChange} className={inputClass} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Tempat Lahir</label>
                            <input name="birthPlace" onChange={handleChange} className={inputClass} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Tanggal Lahir</label>
                            <input type="date" name="birthDate" onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Jenis Kelamin</label>
                            <select name="gender" onChange={handleChange} className={inputClass}>
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium dark:text-gray-300">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClass} bg-gray-100 dark:bg-gray-700`} required readOnly />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Riwayat Penyakit (jika ada)</label>
                        <textarea name="medicalHistory" onChange={handleChange} className={inputClass} rows={2}></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Kontak Darurat (Nama & No. HP)</label>
                        <input name="emergencyContact" onChange={handleChange} className={inputClass} required />
                    </div>

                    <div className="pt-2 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Upload Kartu Keluarga <span className="text-red-500">*</span></label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Upload ke Google Drive, lalu salin link-nya.</p>
                            <input type="url" name="kkUrl" onChange={handleChange} className={inputClass} placeholder="https://drive.google.com/..." required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Upload Foto 4x6 BG Merah <span className="text-red-500">*</span></label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Upload foto formal Anda ke Google Drive.</p>
                            <input type="url" name="photoUrl" onChange={handleChange} className={inputClass} placeholder="https://drive.google.com/..." required />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium dark:text-gray-300">Upload Surat Izin Orang Tua (Opsional)</label>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Format surat dapat diunduh di halaman pengumuman.</p>
                            <input type="url" name="parentPermitUrl" onChange={handleChange} className={inputClass} placeholder="https://drive.google.com/..." />
                        </div>
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