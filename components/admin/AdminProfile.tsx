import React, { useState } from 'react';
import { updateAdminPassword } from '../../services/firebase';
import type { AdminPageProps, User } from '../../types';

const AdminProfile: React.FC<AdminPageProps> = ({ showNotification, user }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showNotification('Password baru dan konfirmasi tidak cocok.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('Password baru harus terdiri dari minimal 6 karakter.', 'error');
            return;
        }
        setLoading(true);
        try {
            await updateAdminPassword(newPassword);
            showNotification('Password berhasil diperbarui!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error("Password update error:", error);
            showNotification(`Gagal memperbarui password: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-brand-secondary focus:border-brand-secondary";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Profil Admin</h1>
            <div className="space-y-6">
                <div className="relative input-group">
                    <input type="text" id="username" value={user?.displayName || 'Admin'} readOnly className={`${inputClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder=" " />
                    <label htmlFor="username" className={labelClass}>Username</label>
                </div>
                <div className="relative input-group">
                    <input type="email" id="email" value={user?.email || 'Tidak tersedia'} readOnly className={`${inputClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder=" " />
                    <label htmlFor="email" className={labelClass}>Email</label>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-6 border-t dark:border-gray-700 pt-6">
                    <div className="relative input-group">
                        <input 
                            type="password"
                            id="newPassword"
                            placeholder=" " 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={inputClass} 
                        />
                         <label htmlFor="newPassword" className={labelClass}>Password Baru</label>
                    </div>
                     <div className="relative input-group">
                        <input 
                            type="password"
                            id="confirmPassword"
                            placeholder=" " 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputClass} 
                        />
                         <label htmlFor="confirmPassword" className={labelClass}>Konfirmasi Password Baru</label>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700 w-full disabled:bg-gray-400">
                             {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Simpan Perubahan Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;