import React, { useState, useEffect } from 'react';
import { getAdminConfig, setData } from '../../services/firebase';
import type { AdminConfig, AdminPageProps } from '../../types';

// Fix: Add showNotification to props to handle notifications consistently.
interface AdminSettingsProps extends AdminPageProps {
    onThemeChange: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onThemeChange, showNotification }) => {
    const [config, setConfig] = useState<AdminConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAdminConfig().then(data => {
            setConfig(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (config) {
            setLoading(true);
            await setData('config', config);
            onThemeChange(); // Inform App.tsx about theme change
            setLoading(false);
            // Fix: Use showNotification instead of alert.
            showNotification('Pengaturan berhasil disimpan!', 'success');
        }
    };

    if (loading || !config) {
        return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;
    }

    return (
        <div className="bg-brand-light dark:bg-gray-900 p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-white mb-6">Pengaturan Global</h1>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                 <label className="font-semibold text-sm text-gray-800 dark:text-white">Pendaftaran Dibuka:</label>
                 <input type="checkbox" checked={config.registrationActive} onChange={e => setConfig({...config, registrationActive: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
               </div>
               <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                 <label className="font-semibold text-sm text-gray-800 dark:text-white">Login Pengguna Dibuka:</label>
                 <input type="checkbox" checked={config.loginActive} onChange={e => setConfig({...config, loginActive: e.target.checked})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
               </div>
               <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                 <label className="font-semibold text-sm text-gray-800 dark:text-white">Tema Gelap (Dark Mode):</label>
                 <input type="checkbox" checked={config.theme === 'dark'} onChange={e => setConfig({...config, theme: e.target.checked ? 'dark' : 'light'})} className="h-5 w-5 rounded text-brand-secondary focus:ring-brand-secondary"/>
               </div>
            </div>
            <div className="mt-6">
                <button onClick={handleSave} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700 w-full">
                    Simpan Pengaturan
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;