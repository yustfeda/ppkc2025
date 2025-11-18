import React, { useState, useEffect, useCallback } from 'react';
import type { User, RegistrationData, FormField, AdminConfig } from '../types';
import { getUserRegistration, setData, deleteUserRegistration, logoutUser, getRegistrationFormFields, getRegistrations, getAdminConfig } from '../services/firebase';

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
    const [profilePic, setProfilePic] = useState<string | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, fieldsData] = await Promise.all([
                getUserRegistration(user.uid),
                getRegistrationFormFields()
            ]);
            
            const storedPic = localStorage.getItem(`profilePic_${user.uid}`);
            
            if (data) {
                setRegistration(data);
                setFormData(data);
                if (storedPic) {
                    setProfilePic(storedPic);
                } else if (data.profilePictureUrl) {
                    setProfilePic(data.profilePictureUrl);
                }
            } else {
                 setFormData({
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
                if (storedPic) setProfilePic(storedPic);
            }
            setDocFields(fieldsData || []);
        } catch(e) {
            console.error(e);
            showNotification('Gagal memuat data profil.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user.uid, showNotification]);
    
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
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                // Basic size check
                if (base64String.length > 2 * 1024 * 1024) { // ~2MB limit
                    showNotification('Ukuran gambar terlalu besar. Pilih gambar di bawah 2MB.', 'error');
                    return;
                }
                localStorage.setItem(`profilePic_${user.uid}`, base64String);
                setProfilePic(base64String);
                setFormData(prev => ({ ...prev, profilePictureUrl: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const confirmationMessage = registration 
            ? "Anda yakin ingin menyimpan perubahan pada profil Anda?"
            : "Pastikan semua data sudah benar. Setelah dikirim, beberapa data tidak dapat diubah. Lanjutkan pendaftaran?";

        showConfirmation(confirmationMessage, async () => {
            setIsSaving(true);
            try {
                let participantNumber = registration?.participantNumber;
                // Generate participant number only on first submission
                if (!registration) {
                    const [allRegs, adminConfig] = await Promise.all([getRegistrations(), getAdminConfig()]);
                    const count = allRegs ? Object.keys(allRegs).length : 0;
                    const prefix1 = adminConfig?.proofOfPassing?.participantNumberPrefix1 || 'PPKC25';
                    const prefix2 = adminConfig?.proofOfPassing?.participantNumberPrefix2 || '26';
                    participantNumber = `${prefix1}-${prefix2}-${(count + 1).toString().padStart(3, '0')}`;
                }

                 const dataToSave: RegistrationData = {
                    ...registration,
                    ...formData,
                    uid: user.uid,
                    email: user.email || '',
                    participantNumber: participantNumber,
                    profilePictureUrl: profilePic || '',
                    status: registration?.status || 'Terkirim',
                    submittedAt: registration?.submittedAt || Date.now(),
                    stageProgress: registration?.stageProgress || {},
                } as RegistrationData;

                await setData(`registrations/${user.uid}`, dataToSave);
                showNotification(registration ? 'Profil berhasil diperbarui.' : 'Pendaftaran berhasil dikirim!', 'success');
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
                    localStorage.removeItem(`profilePic_${user.uid}`);
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
    
    const inputClass = "peer form-input block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-dark rounded-md shadow-sm p-3 text-sm dark:text-white focus:ring-brand-accent focus:border-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";


    return (
        <div className="bg-brand-light dark:bg-brand-dark min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                     <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                        {profilePic ? (
                            <img src={profilePic} alt="Foto Profil" className="w-full h-full object-cover" />
                        ) : (
                            <i className="fas fa-user text-6xl text-gray-400 dark:text-gray-500"></i>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-brand-primary dark:text-white">{formData.fullName || "Profil & Pendaftaran"}</h1>
                    <p className="text-base text-gray-500 dark:text-gray-400">{formData.email}</p>
                     {registration?.participantNumber && (
                        <p className="text-sm font-semibold text-brand-secondary dark:text-brand-accent mt-2 bg-blue-100 dark:bg-blue-900/50 inline-block px-3 py-1 rounded-full">
                            No. Peserta: {registration.participantNumber}
                        </p>
                     )}
                </div>
                
                <form onSubmit={handleSave} className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-lg space-y-6">
                    <h2 className="text-xl font-semibold text-brand-primary dark:text-white border-b dark:border-gray-700 pb-2 mb-4">Data Diri</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Foto Profil</label>
                        <div className="mt-1 flex items-center">
                            <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {profilePic ? (
                                    <img src={profilePic} alt="Foto Profil" className="h-full w-full object-cover" />
                                ) : (
                                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 20.993V24H0v-2.993A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )}
                            </span>
                            <input type="file" id="photo-upload" accept="image/png, image/jpeg" onChange={handlePhotoChange} className="hidden" />
                            <label htmlFor="photo-upload" className="ml-5 bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none cursor-pointer">
                                Ganti Foto
                            </label>
                        </div>
                    </div>

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
                        {registration && (
                           <button type="button" onClick={handleDelete} className="text-sm font-medium text-red-600 hover:text-red-800 dark:hover:text-red-400 order-2 sm:order-1">
                                <i className="fas fa-trash-alt mr-2"></i>Hapus Akun & Pendaftaran
                            </button>
                        )}
                         <button type="submit" disabled={isSaving || loading} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent disabled:bg-gray-400 w-full sm:w-auto order-1 sm:order-2 ml-auto">
                            {isSaving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</> : (registration ? 'Simpan Perubahan' : 'Kirim Pendaftaran')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;