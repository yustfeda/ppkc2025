import React, { useState, useEffect } from 'react';
import { updateAdminPassword, setData, getData } from '../../services/firebase';
import type { AdminPageProps, User } from '../../types';

const AdminProfile: React.FC<AdminPageProps> = ({ showNotification, user }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [profilePic, setProfilePic] = useState<string | null>(null);

    useEffect(() => {
        // Load from local storage first for performance
        const cachedPic = localStorage.getItem('admin_profile_pic');
        if (cachedPic) {
            setProfilePic(cachedPic);
        } else {
            // If not in cache, fetch from database once
            getData<string | null>('adminMetadata/profilePic').then(dbPic => {
                if (dbPic) {
                    setProfilePic(dbPic);
                    localStorage.setItem('admin_profile_pic', dbPic);
                }
            });
        }
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (file.size > 100 * 1024) { 
                showNotification('Ukuran gambar maksimal 100KB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64String = event.target?.result as string;
                setProfilePic(base64String);
                
                // Save to local cache
                localStorage.setItem('admin_profile_pic', base64String);
                
                // Save to Firebase database
                try {
                    await setData('adminMetadata/profilePic', base64String);
                    showNotification('Foto profil admin berhasil diperbarui!', 'success');
                } catch (err) {
                    showNotification('Gagal menyimpan foto ke database.', 'error');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showNotification('Password baru dan konfirmasi tidak cocok.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('Password baru harus minimal 6 karakter.', 'error');
            return;
        }
        setLoading(true);
        try {
            await updateAdminPassword(newPassword);
            showNotification('Password berhasil diperbarui!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
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
            
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-secondary bg-gray-100 dark:bg-gray-800 shadow-lg flex items-center justify-center">
                        {profilePic ? (
                            <img src={profilePic} alt="Admin Pic" className="w-full h-full object-cover" />
                        ) : (
                            <i className="fas fa-user-shield text-5xl text-gray-400"></i>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-brand-secondary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-brand-accent transition-colors">
                        <i className="fas fa-camera"></i>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Format: JPG/PNG, Maks 100KB</p>
            </div>

            <div className="space-y-6">
                <div className="relative input-group">
                    <input type="text" id="username" value={user?.displayName || 'Admin'} readOnly className={`${inputClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder=" " />
                    <label htmlFor="username" className={labelClass}>Username</label>
                </div>
                <div className="relative input-group">
                    <input type="email" id="email" value={user?.email || 'admin@paskib.com'} readOnly className={`${inputClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder=" " />
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
                        <button type="submit" disabled={loading} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700 w-full disabled:bg-gray-400 shadow-md transform active:scale-95 transition-transform">
                             {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Update Keamanan Akun'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;