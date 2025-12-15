
import React, { useState, useEffect } from 'react';
import { getAnnouncements, setData } from '../../services/firebase';
import type { AnnouncementDocument, AdminPageProps } from '../../types';

const AdminManageAnnouncements: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [announcements, setAnnouncements] = useState<AnnouncementDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAnnouncements().then(data => {
            setAnnouncements(data || []);
            setLoading(false);
        });
    }, []);
    
    const handleSave = async () => {
        const announcementsToSave = announcements.filter(doc => doc.title.trim() !== '');
        await setData('announcements', announcementsToSave);
        setAnnouncements(announcementsToSave); 
        showNotification('Perubahan pengumuman berhasil disimpan!', 'success');
    };

    const handleAdd = () => {
        const newDoc: AnnouncementDocument = { id: Date.now().toString(), title: "", description: "", fileUrl: "", thumbnailUrl: "" };
        setAnnouncements([...announcements, newDoc]);
    };

    const confirmDelete = (id: string) => {
        const updatedAnnouncements = announcements.filter(doc => doc.id !== id);
        setAnnouncements(updatedAnnouncements);
        showNotification('Pengumuman dihapus. Klik "Simpan" untuk mengkonfirmasi perubahan.', 'success');
    };
    
    const handleDeleteWithConfirm = (id: string) => {
        showConfirmation(
            'Anda yakin ingin menghapus pengumuman ini?',
            () => confirmDelete(id)
        );
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                 showNotification('Ukuran gambar maksimal 2MB.', 'error');
                 return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setAnnouncements(prev => prev.map(d => d.id === id ? { ...d, thumbnailUrl: base64 } : d));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (id: string) => {
        showConfirmation(
            'Hapus gambar thumbnail ini?',
            () => {
                setAnnouncements(prev => prev.map(d => d.id === id ? { ...d, thumbnailUrl: '' } : d));
            }
        );
    };
    
    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola Pengumuman</h1>
            <div className="space-y-4">
                {announcements.map((doc, index) => (
                    <div key={doc.id} className="p-4 bg-gray-50 dark:bg-brand-dark rounded-md space-y-6 form-input-bg-dark border dark:border-gray-700">
                        <div className="relative input-group">
                            <input id={`title-${doc.id}`} value={doc.title} onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, title: e.target.value} : d))} className={inputClass} placeholder=" "/>
                            <label htmlFor={`title-${doc.id}`} className={labelClass}>Judul Pengumuman</label>
                        </div>
                        <div className="relative input-group">
                            <textarea 
                                id={`desc-${doc.id}`}
                                value={doc.description || ''} 
                                onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, description: e.target.value} : d))} 
                                className={inputClass} 
                                placeholder=" "
                                rows={3}
                            />
                            <label htmlFor={`desc-${doc.id}`} className={labelClass}>Deskripsi (opsional)</label>
                        </div>
                        
                        {/* Image Upload */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail / Gambar</span>
                            {doc.thumbnailUrl ? (
                                <div className="relative inline-block">
                                    <img src={doc.thumbnailUrl} alt="Thumbnail Preview" className="h-32 w-auto object-contain rounded border bg-gray-100" />
                                    <button 
                                        onClick={() => handleRemoveImage(doc.id)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow hover:bg-red-600"
                                        title="Hapus Gambar"
                                    >
                                        <i className="fas fa-times text-xs"></i>
                                    </button>
                                </div>
                            ) : (
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, doc.id)}
                                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary file:text-white hover:file:bg-brand-accent"
                                />
                            )}
                        </div>

                        <div className="relative input-group">
                            <input id={`file-${doc.id}`} value={doc.fileUrl} onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, fileUrl: e.target.value} : d))} className={inputClass} placeholder=" "/>
                            <label htmlFor={`file-${doc.id}`} className={labelClass}>Link Drive File (opsional)</label>
                        </div>
                        <div className="text-right">
                             <button onClick={() => handleDeleteWithConfirm(doc.id)} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"><i className="fas fa-trash mr-1"></i> Hapus</button>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-6 flex gap-3">
                <button onClick={handleAdd} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700">Tambah Pengumuman</button>
                <button onClick={handleSave} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700">Simpan Semua Perubahan</button>
            </div>
        </div>
    );
};

export default AdminManageAnnouncements;
