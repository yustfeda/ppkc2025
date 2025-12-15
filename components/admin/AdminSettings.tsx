
import React, { useState, useEffect } from 'react';
import { getAdminConfig, setData, resetAllRegistrations, getRegistrationFormFields } from '../../services/firebase';
import type { AdminConfig, AdminPageProps, FormField, ProofOfPassingConfig } from '../../types';

interface AdminSettingsProps extends AdminPageProps {
    onThemeChange: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onThemeChange, showNotification, showConfirmation }) => {
    const [config, setConfig] = useState<AdminConfig | null>(null);
    const [docFields, setDocFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleProofConfigChange = (field: keyof ProofOfPassingConfig, value: string) => {
        if (!config) return;
        setConfig(prevConfig => ({
            ...prevConfig!,
            proofOfPassing: {
                ...(prevConfig!.proofOfPassing || { participantNumberAppName: '', passingStatement: '' }),
                [field]: value,
            },
        }));
    };

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
    
    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                 showNotification('Ukuran gambar maksimal 2MB.', 'error');
                 return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if(config) setConfig({...config, heroImageUrl: base64});
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading || !config) {
        return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;
    }

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";
    const sectionClass = "space-y-4 p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 shadow-sm";
    const sectionTitleClass = "text-lg font-bold text-brand-primary dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4";
    
    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center border-b pb-4 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-brand-primary dark:text-white">Pengaturan Global</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Kontrol fitur utama, tampilan aplikasi, dan konfigurasi sistem.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Tampilan Beranda */}
                <div className={sectionClass}>
                    <h2 className={sectionTitleClass}>Tampilan Beranda (Guest)</h2>
                    <div className="space-y-4">
                        <div className="relative input-group">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gambar Hero (Utama)</label>
                            <div className="flex items-center gap-4">
                                {config.heroImageUrl ? (
                                    <img src={config.heroImageUrl} alt="Hero Preview" className="h-20 w-auto object-contain rounded border bg-gray-200" />
                                ) : (
                                    <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">Default</div>
                                )}
                                <label className="cursor-pointer bg-brand-secondary text-white px-3 py-2 rounded text-xs font-bold hover:bg-brand-accent transition-colors">
                                    Upload Gambar
                                    <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageChange} />
                                </label>
                                {config.heroImageUrl && (
                                    <button onClick={() => setConfig({...config, heroImageUrl: ''})} className="text-red-500 text-xs hover:underline">Hapus/Reset</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tombol Pendaftaran & Login */}
                <div className={sectionClass}>
                    <h2 className={sectionTitleClass}>Akses Pendaftaran</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="showRegBtn" className="font-medium text-sm text-gray-800 dark:text-white">Tampilkan Tombol Daftar</label>
                            <input id="showRegBtn" type="checkbox" checked={config.showRegistrationButton} onChange={e => setConfig({...config, showRegistrationButton: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
                        </div>
                        {config.showRegistrationButton && (
                            <div className="pl-4 space-y-4 border-l-2 border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="activateRegBtn" className={`font-medium text-sm ${config.showRegistrationButton ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>Buka Pendaftaran</label>
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
                                        <label htmlFor="comingSoonText" className={labelClass}>Label Tombol Tutup</label>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t dark:border-gray-600">
                            <label htmlFor="loginActive" className="font-medium text-sm text-gray-800 dark:text-white">Izinkan Login Peserta</label>
                            <input id="loginActive" type="checkbox" checked={config.loginActive} onChange={e => setConfig({...config, loginActive: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
                        </div>
                    </div>
                </div>

                {/* Pengaturan Pesan */}
                <div className={sectionClass}>
                    <h2 className={sectionTitleClass}>Fitur Pesan</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm text-gray-800 dark:text-white">Global Messaging</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Izinkan user mengirim pesan ke admin</p>
                        </div>
                        <button 
                            onClick={handleToggleMessaging}
                            className={`font-bold py-1 px-3 rounded-md text-xs text-white ${config.userMessagingActive ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            {config.userMessagingActive ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {/* Versi Aplikasi */}
                <div className={sectionClass}>
                     <h2 className={sectionTitleClass}>Sistem</h2>
                    <div className="relative input-group">
                        <input 
                            id="appVersion"
                            type="text"
                            value={config.appVersion}
                            onChange={e => setConfig({...config, appVersion: e.target.value})}
                            className={inputClass}
                            placeholder=" "
                        />
                         <label htmlFor="appVersion" className={labelClass}>Versi Aplikasi (Footer)</label>
                    </div>
                </div>
            </div>

             {/* Dokumen Pendukung */}
             <div className={sectionClass}>
                <h2 className={sectionTitleClass}>Field Dokumen Pendaftaran</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Atur dokumen apa saja yang wajib dilampirkan peserta (berupa Link URL).</p>
                <div className="space-y-3">
                    {docFields.map((field, index) => (
                        <div key={field.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 items-start sm:items-center">
                            <div className="flex-grow w-full">
                                <input value={field.label} onChange={e => handleFieldChange(index, 'label', e.target.value)} className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Nama Dokumen" />
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <label className="flex items-center gap-2 text-sm dark:text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={field.required} onChange={e => handleFieldChange(index, 'required', e.target.checked)} className="h-4 w-4 rounded text-brand-secondary focus:ring-brand-secondary"/>
                                    Wajib
                                </label>
                                <button onClick={() => handleDeleteField(field.id)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddField} className="mt-2 text-sm bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 w-full sm:w-auto">
                    <i className="fas fa-plus mr-1"></i>Tambah Field
                </button>
            </div>

            {/* Bukti Lolos */}
            <div className={sectionClass}>
                <h2 className={sectionTitleClass}>Konfigurasi Bukti Lolos (PDF)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative input-group">
                        <input 
                            id="logoUrl"
                            type="text"
                            value={config.proofOfPassing?.logoUrl || ''}
                            onChange={e => handleProofConfigChange('logoUrl', e.target.value)}
                            className={inputClass}
                            placeholder=" "
                        />
                        <label htmlFor="logoUrl" className={labelClass}>URL Logo Kop Surat</label>
                    </div>
                    
                    <div className="relative input-group">
                        <input 
                            id="participantNumberAppName"
                            type="text"
                            value={config.proofOfPassing?.participantNumberAppName || ''}
                            onChange={e => handleProofConfigChange('participantNumberAppName', e.target.value)}
                            className={inputClass}
                            placeholder=" "
                        />
                        <label htmlFor="participantNumberAppName" className={labelClass}>Kode No. Peserta (ex: PPKC)</label>
                    </div>

                    <div className="relative input-group md:col-span-2">
                        <textarea 
                            id="passingStatement"
                            value={config.proofOfPassing?.passingStatement || ''}
                            onChange={e => handleProofConfigChange('passingStatement', e.target.value)}
                            className={inputClass}
                            placeholder=" "
                            rows={3}
                        />
                        <label htmlFor="passingStatement" className={labelClass}>Kalimat Pernyataan Lolos (Gunakan {'{year}'} untuk tahun)</label>
                    </div>
                </div>
            </div>

            {/* Zona Bahaya */}
            <div className="p-5 border border-red-300 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-900/10">
                 <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Zona Berbahaya</h2>
                 <p className="text-sm text-red-600 dark:text-red-300 mb-4">Tindakan menghapus data bersifat permanen dan tidak dapat dikembalikan.</p>
                 <button onClick={handleReset} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700 disabled:bg-red-400 w-full sm:w-auto" disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-exclamation-triangle mr-2"></i>Reset Semua Data Pendaftar</>}
                 </button>
            </div>
            
            <div className="sticky bottom-4 z-10">
                <button onClick={handleSave} disabled={loading} className="bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-accent w-full shadow-lg transform hover:-translate-y-1 transition-all">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Simpan Semua Pengaturan'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;
