import React, { useState, useEffect } from 'react';
import { getAdminConfig, setData, resetAllRegistrations, getRegistrationFormFields } from '../../services/firebase';
import type { AdminConfig, AdminPageProps, FormField } from '../../types';

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
    
    if (loading || !config) {
        return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;
    }

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";
    
    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-8">
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