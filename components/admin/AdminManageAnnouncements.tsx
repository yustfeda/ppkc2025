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
        // Filter out any empty announcements before saving
        const announcementsToSave = announcements.filter(doc => doc.title.trim() !== '');
        await setData('announcements', announcementsToSave);
        setAnnouncements(announcementsToSave); // Update state to reflect saved data
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
    
    const inputClass = "p-2 border rounded text-sm w-full bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="bg-brand-light dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-white mb-6">Kelola Pengumuman</h1>
            <div className="space-y-4">
                {announcements.map((doc, index) => (
                    <div key={doc.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md space-y-2">
                        <input value={doc.title} onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, title: e.target.value} : d))} className={inputClass} placeholder="Judul Pengumuman"/>
                        <textarea 
                            value={doc.description || ''} 
                            onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, description: e.target.value} : d))} 
                            className={inputClass} 
                            placeholder="Deskripsi (opsional)"
                            rows={3}
                        />
                        <input value={doc.thumbnailUrl} onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, thumbnailUrl: e.target.value} : d))} className={inputClass} placeholder="Link Gambar Thumbnail (opsional)"/>
                        <input value={doc.fileUrl} onChange={e => setAnnouncements(prev => prev.map((d, i) => i === index ? {...d, fileUrl: e.target.value} : d))} className={inputClass} placeholder="Link Drive File (opsional)"/>
                        <button onClick={() => handleDeleteWithConfirm(doc.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"><i className="fas fa-trash"></i> Hapus</button>
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