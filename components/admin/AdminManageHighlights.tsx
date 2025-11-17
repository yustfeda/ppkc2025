import React, { useState, useEffect } from 'react';
import { getHomeUpdatesRealtime, setData, getSupportersRealtime } from '../../services/firebase';
import type { HomePageUpdate, AdminPageProps, Supporter, SupportersSection } from '../../types';

const AdminManageHighlights: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [updates, setUpdates] = useState<HomePageUpdate[]>([]);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [supportersTitle, setSupportersTitle] = useState('Didukung Oleh');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getHomeUpdatesRealtime(),
            getSupportersRealtime()
        ]).then(([updatesData, supportersSectionData]) => {
            setUpdates(updatesData || []);
            setSupporters(supportersSectionData?.items || []);
            setSupportersTitle(supportersSectionData?.title || 'Didukung Oleh');
            setLoading(false);
        });
    }, []);
    
    const handleSaveUpdates = async () => {
        const updatesToSave = updates.filter(up => up.title.trim() !== '');
        await setData('homeUpdates', updatesToSave);
        setUpdates(updatesToSave);
        showNotification('Perubahan highlight berhasil disimpan!', 'success');
    };

    const handleAddUpdate = () => {
        const newUpdate: HomePageUpdate = { 
            id: Date.now().toString(), 
            title: "", 
            content: "", 
            imageUrl: "", 
            date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
        };
        setUpdates([newUpdate, ...updates]);
    };

    const handleDeleteUpdate = (id: string) => {
        showConfirmation(
            'Anda yakin ingin menghapus highlight ini?',
            () => {
                const updatedItems = updates.filter(up => up.id !== id);
                setUpdates(updatedItems);
                showNotification('Highlight dihapus. Klik "Simpan" untuk mengkonfirmasi perubahan.', 'success');
            }
        );
    };

    const handleSaveSupporters = async () => {
        const supportersToSave = supporters.filter(s => s.name.trim() !== '');
        const sectionToSave: SupportersSection = {
            title: supportersTitle,
            items: supportersToSave
        };
        await setData('supporters', sectionToSave);
        setSupporters(supportersToSave);
        showNotification('Data "Didukung Oleh" berhasil disimpan!', 'success');
    };

    const handleAddSupporter = () => {
        const newSupporter: Supporter = {
            id: `sup_${Date.now()}`,
            name: "",
            imageUrl: "",
            icon: "",
            link: ""
        };
        setSupporters([...supporters, newSupporter]);
    };

    const handleDeleteSupporter = (id: string) => {
        showConfirmation(
            'Anda yakin ingin menghapus item pendukung ini?',
            () => {
                const updated = supporters.filter(s => s.id !== id);
                setSupporters(updated);
                showNotification('Item dihapus. Klik "Simpan" untuk mengkonfirmasi perubahan.', 'success');
            }
        );
    };

    const handleSupporterChange = (index: number, field: keyof Supporter, value: string) => {
        const newSupporters = [...supporters];
        (newSupporters[index] as any)[field] = value;
        setSupporters(newSupporters);
    };
    
    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola Highlight & Update Terbaru</h1>
                <div className="space-y-4">
                    {updates.map((update, index) => (
                        <div key={update.id} className="p-4 bg-gray-50 dark:bg-brand-dark rounded-md space-y-6 form-input-bg-dark">
                            <div className="relative input-group">
                                <input id={`upd-title-${update.id}`} value={update.title} onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, title: e.target.value} : d))} className={inputClass} placeholder=" "/>
                                <label htmlFor={`upd-title-${update.id}`} className={labelClass}>Judul Highlight</label>
                            </div>
                            <div className="relative input-group">
                                <textarea 
                                    id={`upd-content-${update.id}`}
                                    value={update.content || ''} 
                                    onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, content: e.target.value} : d))} 
                                    className={inputClass} 
                                    placeholder=" "
                                    rows={3}
                                />
                                <label htmlFor={`upd-content-${update.id}`} className={labelClass}>Konten</label>
                            </div>
                             <div className="relative input-group">
                                <input id={`upd-img-${update.id}`} value={update.imageUrl} onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, imageUrl: e.target.value} : d))} className={inputClass} placeholder=" "/>
                                <label htmlFor={`upd-img-${update.id}`} className={labelClass}>Link Gambar (opsional)</label>
                             </div>
                            <div className="relative input-group">
                                <input id={`upd-date-${update.id}`} value={update.date} onChange={e => setUpdates(prev => prev.map((d, i) => i === index ? {...d, date: e.target.value} : d))} className={inputClass} placeholder=" "/>
                                <label htmlFor={`upd-date-${update.id}`} className={labelClass}>Tanggal</label>
                            </div>
                            <button onClick={() => handleDeleteUpdate(update.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"><i className="fas fa-trash"></i> Hapus</button>
                        </div>
                    ))}
                </div>
                 <div className="mt-6 flex gap-3">
                    <button onClick={handleAddUpdate} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700">Tambah Update</button>
                    <button onClick={handleSaveUpdates} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent">Simpan Perubahan Highlight</button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola Bagian "Didukung Oleh"</h1>
                 <div className="mb-4 relative input-group">
                    <input 
                        id="supportersTitle"
                        value={supportersTitle} 
                        onChange={e => setSupportersTitle(e.target.value)} 
                        className={inputClass} 
                        placeholder=" "
                    />
                    <label htmlFor="supportersTitle" className={labelClass}>Judul Bagian</label>
                </div>
                <div className="space-y-4">
                    {supporters.map((supporter, index) => (
                        <div key={supporter.id} className="p-4 bg-gray-50 dark:bg-brand-dark rounded-md space-y-6 form-input-bg-dark">
                             <div className="relative input-group">
                                <input id={`sup-name-${supporter.id}`} value={supporter.name} onChange={e => handleSupporterChange(index, 'name', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`sup-name-${supporter.id}`} className={labelClass}>Nama/Judul</label>
                             </div>
                              <div className="relative input-group">
                                <input id={`sup-img-${supporter.id}`} value={supporter.imageUrl || ''} onChange={e => handleSupporterChange(index, 'imageUrl', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`sup-img-${supporter.id}`} className={labelClass}>URL Gambar Logo (opsional)</label>
                              </div>
                               <div className="relative input-group">
                                <input id={`sup-icon-${supporter.id}`} value={supporter.icon || ''} onChange={e => handleSupporterChange(index, 'icon', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`sup-icon-${supporter.id}`} className={labelClass}>Kelas Ikon FontAwesome (opsional)</label>
                               </div>
                                <div className="relative input-group">
                                <input id={`sup-link-${supporter.id}`} value={supporter.link || ''} onChange={e => handleSupporterChange(index, 'link', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`sup-link-${supporter.id}`} className={labelClass}>URL Link (opsional)</label>
                                </div>
                            <button onClick={() => handleDeleteSupporter(supporter.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"><i className="fas fa-trash"></i> Hapus</button>
                        </div>
                    ))}
                </div>
                 <div className="mt-6 flex gap-3">
                    <button onClick={handleAddSupporter} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700">Tambah Item</button>
                    <button onClick={handleSaveSupporters} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent">Simpan Perubahan "Didukung Oleh"</button>
                </div>
            </div>
        </div>
    );
};

export default AdminManageHighlights;