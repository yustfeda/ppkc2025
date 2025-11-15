import React, { useState, useEffect } from 'react';
import { getHomeUpdates, setData } from '../../services/firebase';
import type { HomePageUpdate, AdminPageProps } from '../../types';

const AdminManageHighlights: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [updates, setUpdates] = useState<HomePageUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getHomeUpdates().then(data => {
            setUpdates(data || []);
            setLoading(false);
        });
    }, []);
    
    const handleSave = async () => {
        const updatesToSave = updates.filter(up => up.title.trim() !== '');
        await setData('homeUpdates', updatesToSave);
        setUpdates(updatesToSave);
        showNotification('Perubahan highlight berhasil disimpan!', 'success');
    };

    const handleAdd = () => {
        const newUpdate: HomePageUpdate = { 
            id: Date.now().toString(), 
            title: "", 
            content: "", 
            imageUrl: "", 
            date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
        };
        setUpdates([newUpdate, ...updates]);
    };

    const confirmDelete = (id: string) => {
        const updatedItems = updates.filter(up => up.id !== id);
        setUpdates(updatedItems);
        showNotification('Highlight dihapus. Klik "Simpan" untuk mengkonfirmasi perubahan.', 'success');
    };
    
    const handleDeleteWithConfirm = (id: string) => {
        showConfirmation(
            'Anda yakin ingin menghapus highlight ini?',
            () => confirmDelete(id)
        );
    };
    
    const inputClass = "p-2 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola Highlight & Update Terbaru</h1>
            <div className="space-y-4">
                {updates.map((update, index) => (
                    <div key={update.id} className="p-3 bg-gray-50 dark:bg-brand-dark rounded-md space-y-2">
                        <input value={update.title} onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, title: e.target.value} : d))} className={inputClass} placeholder="Judul Highlight"/>
                        <textarea 
                            value={update.content || ''} 
                            onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, content: e.target.value} : d))} 
                            className={inputClass} 
                            placeholder="Konten"
                            rows={3}
                        />
                        <input value={update.imageUrl} onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, imageUrl: e.target.value} : d))} className={inputClass} placeholder="Link Gambar (opsional)"/>
                        <input value={update.date} onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, date: e.target.value} : d))} className={inputClass} placeholder="Tanggal"/>
                        <button onClick={() => handleDeleteWithConfirm(update.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"><i className="fas fa-trash"></i> Hapus</button>
                    </div>
                ))}
            </div>
             <div className="mt-6 flex gap-3">
                <button onClick={handleAdd} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700">Tambah Update</button>
                <button onClick={handleSave} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent">Simpan Semua Perubahan</button>
            </div>
        </div>
    );
};

export default AdminManageHighlights;