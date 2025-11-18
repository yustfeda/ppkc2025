import React, { useState, useEffect } from 'react';
import { getAdminConfig, setData, resetAllRegistrations, getRegistrationFormFields } from '../../services/firebase';
import type { AdminConfig, AdminPageProps, FormField, ProofOfPassingConfig } from '../../types';

interface AdminSettingsProps extends AdminPageProps {
    onThemeChange: () => void;
}

const ProofOfPassingModal: React.FC<{
    config: ProofOfPassingConfig;
    onClose: () => void;
    onSave: (newConfig: ProofOfPassingConfig) => void;
}> = ({ config, onClose, onSave }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [editingConfig, setEditingConfig] = useState(config);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleSave = () => {
        onSave(editingConfig);
        handleClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditingConfig({ ...editingConfig, [e.target.name]: e.target.value });
    };

    const inputClass = "peer form-input p-2 border rounded text-sm w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-xs";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1001] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-gray-700 w-full h-full md:w-auto md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col md:rounded-lg shadow-lg ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white p-4 border-b dark:border-gray-600 flex-shrink-0">Atur Bukti Kelulusan</h3>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-4 overflow-y-auto">
                    {/* Editor Form */}
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md space-y-3">
                            <h4 className="font-bold text-sm dark:text-white">Format No. Peserta</h4>
                            <div className="flex gap-2 items-center">
                                <div className="relative input-group flex-1">
                                    <input name="participantNumberPrefix1" value={editingConfig.participantNumberPrefix1} onChange={handleChange} className={inputClass} placeholder=" " />
                                    <label className={labelClass}>Prefix 1 (cth: PPKC25)</label>
                                </div>
                                <div className="relative input-group flex-1">
                                    <input name="participantNumberPrefix2" value={editingConfig.participantNumberPrefix2} onChange={handleChange} className={inputClass} placeholder=" " />
                                    <label className={labelClass}>Prefix 2 (cth: 26)</label>
                                </div>
                                <span className="text-gray-500 dark:text-gray-400">-001</span>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md space-y-3">
                            <h4 className="font-bold text-sm dark:text-white">Konten Sertifikat</h4>
                            <div className="relative input-group">
                                <input name="title" value={editingConfig.title} onChange={handleChange} className={inputClass} placeholder=" " />
                                <label className={labelClass}>Judul (cth: BUKTI KELULUSAN)</label>
                            </div>
                            <div className="relative input-group">
                                <input name="headerImageUrl" value={editingConfig.headerImageUrl} onChange={handleChange} className={inputClass} placeholder=" " />
                                <label className={labelClass}>URL Gambar Header (cth: Logo/Kop Surat)</label>
                            </div>
                            <div className="relative input-group">
                                <textarea name="congratsText" value={editingConfig.congratsText} onChange={handleChange} className={inputClass} rows={3} placeholder=" " />
                                <label className={labelClass}>Teks Ucapan Selamat</label>
                            </div>
                            <div className="relative input-group">
                                <textarea name="proofText" value={editingConfig.proofText} onChange={handleChange} className={inputClass} rows={4} placeholder=" " />
                                <label className={labelClass}>Teks Kalimat Kelulusan</label>
                            </div>
                        </div>
                    </div>
                    {/* Preview */}
                    <div className="bg-white p-4 rounded-md shadow-inner h-[500px] md:h-full overflow-hidden flex items-center justify-center">
                        <div className="border border-gray-300 h-full w-full flex flex-col items-center text-center p-2 text-black transform scale-90 origin-top">
                            {editingConfig.headerImageUrl && <img src={editingConfig.headerImageUrl} alt="Header Preview" className="max-w-full h-20 object-contain mb-2" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                            <h1 className="font-bold text-xl mt-2">{editingConfig.title}</h1>
                            <div className="w-4/5 h-px bg-gray-400 my-2"></div>
                            <p className="text-[10px] leading-tight px-4 my-2">{editingConfig.congratsText}</p>
                             <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-400 text-3xl my-2">
                                <i className="fas fa-user"></i>
                            </div>
                            <div className="text-left text-[8px] border p-1 my-2 w-4/5">
                                <p><strong>Nama Lengkap:</strong> John Doe</p>
                                <p><strong>No. Peserta:</strong> {editingConfig.participantNumberPrefix1}-{editingConfig.participantNumberPrefix2}-001</p>
                                <p><strong>TTL:</strong> Cileles, 01 Januari 2000</p>
                                <p><strong>Jenis Kelamin:</strong> Laki-laki</p>
                                <p><strong>Asal Satuan:</strong> SMAN 1 Cileles</p>
                            </div>
                            <p className="text-[10px] font-bold leading-tight px-4 my-2">{editingConfig.proofText}</p>
                            <div className="mt-auto text-gray-400">
                                <i className="fas fa-qrcode text-5xl"></i>
                                <p className="text-[7px]">QR Code Verifikasi</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 flex justify-end gap-3 p-4 border-t dark:border-gray-600">
                    <button onClick={handleClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-300">Batal</button>
                    <button onClick={handleSave} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent">Simpan</button>
                </div>
            </div>
        </div>
    );
};

const AdminSettings: React.FC<AdminSettingsProps> = ({ onThemeChange, showNotification, showConfirmation }) => {
    const [config, setConfig] = useState<AdminConfig | null>(null);
    const [docFields, setDocFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getAdminConfig(),
            getRegistrationFormFields()
        ]).then(([configData, fieldsData]) => {
            setConfig(configData);
            setDocFields(fieldsData);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (config) {
            setLoading(true);
            const fieldsToSave = docFields.filter(f => f.label.trim() !== '');
            await Promise.all([
                setData('config', config),
                setData('registrationFormFields', fieldsToSave)
            ]);
            onThemeChange(); // Inform App.tsx about theme change
            setDocFields(fieldsToSave);
            setLoading(false);
            showNotification('Pengaturan berhasil disimpan!', 'success');
        }
    };

    const handleToggleMessaging = () => {
        if (!config) return;
        const newStatus = !config.userMessagingActive;
        const action = newStatus ? "mengaktifkan" : "menonaktifkan";
        
        showConfirmation(
            `Anda yakin ingin ${action} pengiriman pesan untuk semua pengguna?`,
            async () => {
                const updatedConfig = { ...config, userMessagingActive: newStatus };
                await setData('config', updatedConfig);
                setConfig(updatedConfig);
                showNotification(`Status pengiriman pesan untuk semua pengguna berhasil diubah.`, 'success');
            }
        );
    };

    const handleReset = () => {
        showConfirmation(
            "Anda yakin ingin menghapus semua data pendaftar? Tindakan ini tidak dapat diurungkan.",
            async () => {
                setLoading(true);
                try {
                    await resetAllRegistrations();
                    showNotification('Semua data pendaftar berhasil dihapus!', 'success');
                } catch (error) {
                     showNotification('Gagal mereset data.', 'error');
                } finally {
                    setLoading(false);
                }
            }
        );
    }

    const handleAddField = () => {
        const newField: FormField = { id: `doc_${Date.now()}`, label: '', type: 'url', required: false };
        setDocFields([...docFields, newField]);
    };

    const handleFieldChange = (index: number, field: keyof FormField, value: any) => {
        const newFields = [...docFields];
        (newFields[index] as any)[field] = value;
        setDocFields(newFields);
    };

    const handleDeleteField = (id: string) => {
        setDocFields(docFields.filter(f => f.id !== id));
    };
    
    const handleSaveProofConfig = (newProofConfig: ProofOfPassingConfig) => {
        if (config) {
            setConfig({ ...config, proofOfPassing: newProofConfig });
        }
    };

    if (loading || !config) {
        return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;
    }

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";
    
    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-8">
            {isProofModalOpen && config.proofOfPassing && (
                <ProofOfPassingModal 
                    config={config.proofOfPassing}
                    onClose={() => setIsProofModalOpen(false)}
                    onSave={handleSaveProofConfig}
                />
            )}
            <div>
                <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Pengaturan Global</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kontrol fitur utama dan tampilan aplikasi.</p>
            </div>
            
            <div className="space-y-6 p-4 border rounded-md dark:border-gray-700">
                <h2 className="text-lg font-semibold text-brand-dark dark:text-white">Tombol Pendaftaran & Login</h2>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-md">
                    <label htmlFor="showRegBtn" className="font-medium text-sm text-gray-800 dark:text-white">Tampilkan Tombol Daftar</label>
                    <input id="showRegBtn" type="checkbox" checked={config.showRegistrationButton} onChange={e => setConfig({...config, showRegistrationButton: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
                </div>
                 {config.showRegistrationButton && (
                    <div className="pl-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-md">
                            <label htmlFor="activateRegBtn" className={`font-medium text-sm ${config.showRegistrationButton ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>Aktifkan Tombol Daftar</label>
                            <input id="activateRegBtn" type="checkbox" checked={config.registrationActive} onChange={e => setConfig({...config, registrationActive: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary" disabled={!config.showRegistrationButton}/>
                        </div>
                         {!config.registrationActive && (
                             <div className="relative input-group">
                                <input 
                                    id="comingSoonText"
                                    type="text"
                                    value={config.registrationComingSoonText}
                                    onChange={e => setConfig({...config, registrationComingSoonText: e.target.value})}
                                    className={inputClass}
                                    placeholder=" "
                                />
                                 <label htmlFor="comingSoonText" className={labelClass}>Teks "Segera Hadir" (di atas tombol)</label>
                             </div>
                         )}
                    </div>
                 )}
                 <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-md">
                    <label htmlFor="loginActive" className="font-medium text-sm text-gray-800 dark:text-white">Tampilkan Tombol Login</label>
                    <input id="loginActive" type="checkbox" checked={config.loginActive} onChange={e => setConfig({...config, loginActive: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-md dark:border-gray-700">
                <h2 className="text-lg font-semibold text-brand-dark dark:text-white">Pengaturan Pesan Pengguna</h2>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-brand-dark rounded-md">
                    <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-white">Status Pesan Pengguna</p>
                        <p className={`text-xs ${config.userMessagingActive ? 'text-green-600' : 'text-red-600'}`}>
                            {config.userMessagingActive ? 'Aktif (Semua pengguna dapat mengirim pesan)' : 'Nonaktif (Semua pengguna tidak dapat mengirim pesan)'}
                        </p>
                    </div>
                    <button 
                        onClick={handleToggleMessaging}
                        className={`font-bold py-1 px-3 rounded-md text-sm text-white ${config.userMessagingActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {config.userMessagingActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-md dark:border-gray-700">
                <h2 className="text-lg font-semibold text-brand-dark dark:text-white">Bukti Kelulusan</h2>
                 <button 
                    onClick={() => setIsProofModalOpen(true)}
                    className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-indigo-700"
                >
                    <i className="fas fa-certificate mr-2"></i>Atur Bukti Lolos
                </button>
            </div>

             <div className="space-y-6 p-4 border rounded-md dark:border-gray-700">
                <h2 className="text-lg font-semibold text-brand-dark dark:text-white">Kelola Field Dokumen Pendukung</h2>
                <div className="space-y-2">
                    {docFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-brand-dark rounded-md">
                            <div className="relative input-group sm:col-span-2">
                                <input value={field.label} onChange={e => handleFieldChange(index, 'label', e.target.value)} className={inputClass} placeholder=" " />
                                <label className={labelClass}>Label Field</label>
                            </div>
                            <div className="flex items-center justify-end gap-4">
                                <label className="flex items-center gap-2 text-sm dark:text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={field.required} onChange={e => handleFieldChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded text-brand-secondary focus:ring-brand-secondary"/>
                                    Wajib
                                </label>
                                <button onClick={() => handleDeleteField(field.id)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddField} className="text-sm bg-green-600 text-white font-bold py-1 px-3 rounded-md hover:bg-green-700">
                    <i className="fas fa-plus mr-1"></i>Tambah Field Dokumen
                </button>
            </div>

            <div className="space-y-6 p-4 border rounded-md dark:border-gray-700">
                 <h2 className="text-lg font-semibold text-brand-dark dark:text-white">Versi Aplikasi</h2>
                <div className="relative input-group">
                    <input 
                        id="appVersion"
                        type="text"
                        value={config.appVersion}
                        onChange={e => setConfig({...config, appVersion: e.target.value})}
                        className={inputClass}
                        placeholder=" "
                    />
                     <label htmlFor="appVersion" className={labelClass}>Versi Aplikasi (ditampilkan di footer)</label>
                </div>
            </div>

            <div className="p-4 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20">
                 <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Zona Berbahaya</h2>
                 <p className="text-sm text-red-600 dark:text-red-300 mt-1 mb-4">Tindakan ini bersifat permanen dan tidak dapat diurungkan.</p>
                 <button onClick={handleReset} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700 disabled:bg-red-400" disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-exclamation-triangle mr-2"></i>Reset Semua Data Pendaftar</>}
                 </button>
            </div>
            
            <div className="mt-2">
                <button onClick={handleSave} disabled={loading} className="bg-brand-secondary text-white font-bold py-3 px-4 rounded-md text-base hover:bg-brand-accent w-full">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Simpan Semua Pengaturan'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;