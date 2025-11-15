import React, { useState, useEffect, useCallback } from 'react';
import type { User, RegistrationData } from '../types';
import { getUserRegistration, setData, deleteUserRegistration, logoutUser } from '../services/firebase';

interface ProfileProps {
    user: User;
    showNotification: (message: string, type: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, showNotification, showConfirmation }) => {
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [formData, setFormData] = useState<Partial<RegistrationData>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await getUserRegistration(user.uid);
        if (data) {
            setRegistration(data);
            setFormData(data);
        }
        setLoading(false);
    }, [user.uid]);
    
    useEffect(() => { fetchData() }, [fetchData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        showConfirmation("Anda yakin ingin menyimpan perubahan pada profil Anda?", async () => {
            setIsSaving(true);
            try {
                await setData(`registrations/${user.uid}`, { ...registration, ...formData });
                showNotification('Profil berhasil diperbarui.', 'success');
                fetchData(); // Refresh data to show saved state
            } catch (error) {
                showNotification('Gagal menyimpan perubahan.', 'error');
            } finally {
                setIsSaving(false);
            }
        });
    };

    const handleDelete = () => {
        showConfirmation(
            "APAKAH ANDA YAKIN? Menghapus akun akan menghapus semua data pendaftaran Anda secara permanen. Tindakan ini tidak dapat diurungkan.",
            async () => {
                try {
                    await deleteUserRegistration(user.uid);
                    showNotification('Akun dan data pendaftaran berhasil dihapus.', 'success');
                    setTimeout(() => logoutUser(), 1000); // Logout after a short delay
                } catch (error) {
                    showNotification('Gagal menghapus akun.', 'error');
                }
            }
        );
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-5rem)]"><i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i></div>;
    }

    if (!registration) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] text-center p-4">
                <i className="fas fa-file-alt text-5xl text-gray-400 mb-4"></i>
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Data Pendaftaran Tidak Ditemukan</h2>
                <p className="text-gray-600 dark:text-gray-400">Anda belum melakukan pendaftaran. Silakan lengkapi form di halaman pendaftaran.</p>
            </div>
        );
    }
    
    const inputClass = "mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-dark rounded-md shadow-sm p-2 text-sm dark:text-white dark:placeholder-gray-400";


    return (
        <div className="bg-brand-light dark:bg-brand-dark min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                     <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                        ) : (
                            <i className="fas fa-user text-6xl text-gray-400 dark:text-gray-500"></i>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-brand-primary dark:text-white">{formData.fullName}</h1>
                    <p className="text-base text-gray-500 dark:text-gray-400">{formData.email}</p>
                </div>
                
                <form onSubmit={handleSave} className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-lg space-y-4">
                    <h2 className="text-xl font-semibold text-brand-primary dark:text-white border-b dark:border-gray-700 pb-2 mb-4">Data Diri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Nama Lengkap</label>
                            <input name="fullName" value={formData.fullName || ''} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Asal Satuan</label>
                            <input name="originUnit" value={formData.originUnit || ''} onChange={handleChange} className={inputClass} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Tempat Lahir</label>
                            <input name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} className={inputClass} required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Tanggal Lahir</label>
                            <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Jenis Kelamin</label>
                            <select name="gender" value={formData.gender || 'Laki-laki'} onChange={handleChange} className={inputClass}>
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium dark:text-gray-300">Email</label>
                            <input type="email" name="email" value={formData.email || ''} className={`${inputClass} bg-gray-100 dark:bg-gray-700`} required readOnly />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Riwayat Penyakit (jika ada)</label>
                        <textarea name="medicalHistory" value={formData.medicalHistory || ''} onChange={handleChange} className={inputClass} rows={2}></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Kontak Darurat (Nama & No. HP)</label>
                        <input name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} className={inputClass} required />
                    </div>

                    <h2 className="text-xl font-semibold text-brand-primary dark:text-white border-b dark:border-gray-700 pb-2 pt-4">Dokumen Pendukung</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Link Kartu Keluarga</label>
                            <input type="url" name="kkUrl" value={formData.kkUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://drive.google.com/..." required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Link Foto 4x6</label>
                            <input type="url" name="photoUrl" value={formData.photoUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://drive.google.com/..." required />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium dark:text-gray-300">Link Surat Izin Orang Tua (Opsional)</label>
                            <input type="url" name="parentPermitUrl" value={formData.parentPermitUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://drive.google.com/..." />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
                        <button type="button" onClick={handleDelete} className="text-sm font-medium text-red-600 hover:text-red-800 dark:hover:text-red-400 order-2 sm:order-1">
                            <i className="fas fa-trash-alt mr-2"></i>Hapus Akun & Pendaftaran
                        </button>
                         <button type="submit" disabled={isSaving} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent disabled:bg-gray-400 w-full sm:w-auto order-1 sm:order-2">
                            {isSaving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</> : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;