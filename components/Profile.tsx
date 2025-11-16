import React, { useState, useEffect, useCallback } from 'react';
import type { User, RegistrationData, FormField } from '../types';
import { getUserRegistration, setData, deleteUserRegistration, logoutUser, getRegistrationFormFields } from '../services/firebase';

interface ProfileProps {
    user: User;
    showNotification: (message: string, type: 'success' | 'error') => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, showNotification, showConfirmation }) => {
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [formData, setFormData] = useState<Partial<RegistrationData>>({});
    const [docFields, setDocFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [data, fieldsData] = await Promise.all([
            getUserRegistration(user.uid),
            getRegistrationFormFields()
        ]);
        if (data) {
            setRegistration(data);
            setFormData(data);
        }
        setDocFields(fieldsData);
        setLoading(false);
    }, [user.uid]);
    
    useEffect(() => { fetchData() }, [fetchData]);

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
    
    const inputClass = "peer form-input block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-dark rounded-md shadow-sm p-3 text-sm dark:text-white focus:ring-brand-accent focus:border-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";


    return (
        <div className="bg-brand-light dark:bg-brand-dark min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                     <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                        {formData.profilePictureUrl ? (
                            <img src={formData.profilePictureUrl} alt="Foto Profil" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                            <i className="fas fa-user text-6xl text-gray-400 dark:text-gray-500"></i>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-brand-primary dark:text-white">{formData.fullName}</h1>
                    <p className="text-base text-gray-500 dark:text-gray-400">{formData.email}</p>
                </div>
                
                <form onSubmit={handleSave} className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-lg space-y-6">
                    <h2 className="text-xl font-semibold text-brand-primary dark:text-white border-b dark:border-gray-700 pb-2 mb-4">Data Diri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative input-group">
                            <input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} className={inputClass} required placeholder=" " />
                            <label htmlFor="fullName" className={labelClass}>Nama Lengkap</label>
                        </div>
                        <div className="relative input-group">
                            <input id="originUnit" name="originUnit" value={formData.originUnit || ''} onChange={handleChange} className={inputClass} required placeholder=" " />
                             <label htmlFor="originUnit" className={labelClass}>Asal Satuan</label>
                        </div>
                         <div className="relative input-group">
                            <input id="birthPlace" name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} className={inputClass} required placeholder=" " />
                            <label htmlFor="birthPlace" className={labelClass}>Tempat Lahir</label>
                        </div>
                         <div className="relative input-group">
                            <input id="birthDate" type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className={inputClass} required placeholder=" " />
                             <label htmlFor="birthDate" className={labelClass}>Tanggal Lahir</label>
                        </div>
                        <div className="relative input-group">
                            <select id="gender" name="gender" value={formData.gender || 'Laki-laki'} onChange={handleChange} className={inputClass}>
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                            </select>
                             <label htmlFor="gender" className={labelClass}>Jenis Kelamin</label>
                        </div>
                        <div className="relative input-group">
                             <input id="email" type="email" name="email" value={formData.email || ''} className={`${inputClass} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`} required readOnly placeholder=" " />
                             <label htmlFor="email" className={labelClass}>Email</label>
                        </div>
                    </div>
                     <div className="relative input-group">
                        <textarea id="medicalHistory" name="medicalHistory" value={formData.medicalHistory || ''} onChange={handleChange} className={inputClass} rows={2} placeholder=" "></textarea>
                         <label htmlFor="medicalHistory" className={labelClass}>Riwayat Penyakit (jika ada)</label>
                    </div>
                     <div className="relative input-group">
                        <input id="emergencyContact" name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} className={inputClass} required placeholder=" " />
                         <label htmlFor="emergencyContact" className={labelClass}>Kontak Darurat (Nama & No. HP)</label>
                    </div>
                    
                    <div className="relative input-group">
                        <input id="profilePictureUrl" name="profilePictureUrl" type="url" value={formData.profilePictureUrl || ''} onChange={handleChange} className={inputClass} placeholder=" " />
                        <label htmlFor="profilePictureUrl" className={labelClass}>Link Foto Profil (Opsional)</label>
                    </div>

                    <h2 className="text-xl font-semibold text-brand-primary dark:text-white border-b dark:border-gray-700 pb-2 pt-4">Dokumen Pendukung</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {docFields.map(field => (
                             <div key={field.id} className="relative input-group md:col-span-2">
                                <input 
                                    id={field.id} 
                                    type="url" 
                                    name={field.id} 
                                    value={formData.documentLinks?.[field.id] || ''}
                                    onChange={handleDocLinkChange} 
                                    className={inputClass} 
                                    placeholder=" " 
                                    required={field.required} 
                                />
                                 <label htmlFor={field.id} className={labelClass}>{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                            </div>
                        ))}
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