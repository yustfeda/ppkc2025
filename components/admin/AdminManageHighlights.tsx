
import React, { useState, useEffect } from 'react';
import { getHomeUpdates, setData, getSupporters } from '../../services/firebase';
import type { HomePageUpdate, AdminPageProps, Supporter, SupportersSection } from '../../types';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSave: () => void;
    onDelete?: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, title, children, onSave, onDelete }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1001] p-4" onClick={handleClose}>
            <div 
                className={`bg-white dark:bg-brand-primary rounded-lg p-6 max-w-lg w-full shadow-2xl ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'} flex flex-col max-h-[90vh]`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-2">
                    <h3 className="text-xl font-bold text-brand-primary dark:text-white">{title}</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><i className="fas fa-times"></i></button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {children}
                </div>

                <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-between">
                    {onDelete ? (
                        <button onClick={onDelete} className="text-red-500 hover:text-red-700 font-bold text-sm"><i className="fas fa-trash-alt mr-2"></i>Hapus</button>
                    ) : <div></div>}
                    <div className="flex gap-3">
                        <button onClick={handleClose} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600">Batal</button>
                        <button onClick={() => { onSave(); handleClose(); }} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md text-sm hover:bg-brand-accent">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminManageHighlights: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [updates, setUpdates] = useState<HomePageUpdate[]>([]);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [supportersTitle, setSupportersTitle] = useState('Didukung Oleh');
    const [loading, setLoading] = useState(true);

    // Modal States
    const [editingHighlight, setEditingHighlight] = useState<HomePageUpdate | null>(null);
    const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
    
    const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null);
    const [isSupporterModalOpen, setIsSupporterModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getHomeUpdates(),
            getSupporters()
        ]).then(([updatesData, supportersSectionData]) => {
            setUpdates(updatesData || []);
            setSupporters(supportersSectionData?.items || []);
            setSupportersTitle(supportersSectionData?.title || 'Didukung Oleh');
            setLoading(false);
        });
    }, []);
    
    // --- Highlight Logic ---
    const handleSaveHighlight = async () => {
        if (!editingHighlight) return;
        const newUpdates = updates.some(u => u.id === editingHighlight.id)
            ? updates.map(u => u.id === editingHighlight.id ? editingHighlight : u)
            : [editingHighlight, ...updates];
        
        await setData('homeUpdates', newUpdates);
        setUpdates(newUpdates);
        showNotification('Highlight berhasil disimpan!', 'success');
        setEditingHighlight(null);
    };

    const handleDeleteHighlight = () => {
        if (!editingHighlight) return;
        showConfirmation('Hapus highlight ini?', async () => {
            const newUpdates = updates.filter(u => u.id !== editingHighlight.id);
            await setData('homeUpdates', newUpdates);
            setUpdates(newUpdates);
            showNotification('Highlight dihapus.', 'success');
            setIsHighlightModalOpen(false);
        });
    };

    const openNewHighlightModal = () => {
        setEditingHighlight({
            id: Date.now().toString(),
            title: "",
            content: "",
            imageUrl: "",
            date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
        });
        setIsHighlightModalOpen(true);
    };

    const handleHighlightImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && editingHighlight) {
            const file = e.target.files[0];
            // 100KB limit
            if (file.size > 100 * 1024) { showNotification('Max 100KB', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => setEditingHighlight({...editingHighlight, imageUrl: ev.target?.result as string});
            reader.readAsDataURL(file);
        }
    };

    // --- Supporter Logic ---
    const handleSaveSupporter = async () => {
        if (!editingSupporter) return;
        const newSupporters = supporters.some(s => s.id === editingSupporter.id)
            ? supporters.map(s => s.id === editingSupporter.id ? editingSupporter : s)
            : [...supporters, editingSupporter];
        
        const sectionToSave: SupportersSection = { title: supportersTitle, items: newSupporters };
        await setData('supporters', sectionToSave);
        setSupporters(newSupporters);
        showNotification('Item pendukung disimpan!', 'success');
        setEditingSupporter(null);
    };

    const handleDeleteSupporter = () => {
        if (!editingSupporter) return;
        showConfirmation('Hapus item pendukung ini?', async () => {
            const newSupporters = supporters.filter(s => s.id !== editingSupporter.id);
            const sectionToSave: SupportersSection = { title: supportersTitle, items: newSupporters };
            await setData('supporters', sectionToSave);
            setSupporters(newSupporters);
            showNotification('Item dihapus.', 'success');
            setIsSupporterModalOpen(false);
        });
    };

    const openNewSupporterModal = () => {
        setEditingSupporter({ id: `sup_${Date.now()}`, name: "", imageUrl: "", icon: "", link: "" });
        setIsSupporterModalOpen(true);
    };

    const handleSupporterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && editingSupporter) {
            const file = e.target.files[0];
            // 100KB limit
            if (file.size > 100 * 1024) { showNotification('Max 100KB', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => setEditingSupporter({...editingSupporter, imageUrl: ev.target?.result as string});
            reader.readAsDataURL(file);
        }
    };

    const handleSaveTitle = async () => {
        const sectionToSave: SupportersSection = { title: supportersTitle, items: supporters };
        await setData('supporters', sectionToSave);
        showNotification('Judul bagian disimpan.', 'success');
    }

    
    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Highlight Section */}
            <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Kelola Highlight</h1>
                    <button onClick={openNewHighlightModal} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700 shadow flex items-center gap-2">
                        <i className="fas fa-plus"></i> Tambah Highlight
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {updates.map((update) => (
                        <div 
                            key={update.id} 
                            onClick={() => { setEditingHighlight(update); setIsHighlightModalOpen(true); }}
                            className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 relative group"
                        >
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-3 overflow-hidden flex items-center justify-center">
                                {update.imageUrl ? (
                                    <img src={update.imageUrl} alt={update.title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-xs">No Image</span>
                                )}
                            </div>
                            <h3 className="font-bold text-brand-primary dark:text-white text-sm truncate">{update.title || 'Tanpa Judul'}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{update.date}</p>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-black rounded-full p-1 shadow">
                                <i className="fas fa-pen text-xs text-blue-500"></i>
                            </div>
                        </div>
                    ))}
                    {updates.length === 0 && <p className="text-gray-500 text-sm italic col-span-full text-center py-4">Belum ada highlight.</p>}
                </div>
            </div>

            {/* Supporters Section */}
            <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-2">Kelola "Didukung Oleh"</h1>
                        <div className="flex gap-2">
                            <input 
                                value={supportersTitle} 
                                onChange={e => setSupportersTitle(e.target.value)} 
                                className="border rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            <button onClick={handleSaveTitle} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Simpan Judul</button>
                        </div>
                    </div>
                    <button onClick={openNewSupporterModal} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700 shadow flex items-center gap-2">
                        <i className="fas fa-plus"></i> Tambah Item
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {supporters.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => { setEditingSupporter(item); setIsSupporterModalOpen(true); }}
                            className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 relative group text-center"
                        >
                            <div className="h-16 w-16 mx-auto bg-white rounded-full mb-2 flex items-center justify-center overflow-hidden border">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-2" />
                                ) : (
                                    <i className={`${item.icon || 'fas fa-star'} text-gray-400`}></i>
                                )}
                            </div>
                            <p className="font-bold text-brand-primary dark:text-white text-xs truncate">{item.name || 'Tanpa Nama'}</p>
                             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fas fa-pen text-xs text-blue-500"></i>
                            </div>
                        </div>
                    ))}
                     {supporters.length === 0 && <p className="text-gray-500 text-sm italic col-span-full text-center py-4">Belum ada item pendukung.</p>}
                </div>
            </div>

            {/* Highlight Modal */}
            <EditModal 
                isOpen={isHighlightModalOpen} 
                onClose={() => setIsHighlightModalOpen(false)} 
                title={updates.some(u => u.id === editingHighlight?.id) ? "Edit Highlight" : "Tambah Highlight"}
                onSave={handleSaveHighlight}
                onDelete={updates.some(u => u.id === editingHighlight?.id) ? handleDeleteHighlight : undefined}
            >
                {editingHighlight && (
                    <div className="space-y-6 pt-2">
                        <div className="relative input-group">
                            <input value={editingHighlight.title} onChange={e => setEditingHighlight({...editingHighlight, title: e.target.value})} className={inputClass} placeholder=" " />
                            <label className={labelClass}>Judul</label>
                        </div>
                        <div className="relative input-group">
                            <textarea value={editingHighlight.content} onChange={e => setEditingHighlight({...editingHighlight, content: e.target.value})} className={inputClass} rows={4} placeholder=" " />
                            <label className={labelClass}>Konten</label>
                        </div>
                        <div className="relative input-group">
                            <input value={editingHighlight.date} onChange={e => setEditingHighlight({...editingHighlight, date: e.target.value})} className={inputClass} placeholder=" " />
                            <label className={labelClass}>Tanggal</label>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-dashed dark:border-gray-600">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gambar</span>
                            {editingHighlight.imageUrl ? (
                                <div className="relative inline-block">
                                    <img src={editingHighlight.imageUrl} alt="Preview" className="h-32 w-auto object-cover rounded" />
                                    <button onClick={() => setEditingHighlight({...editingHighlight, imageUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow"><i className="fas fa-times text-xs"></i></button>
                                </div>
                            ) : (
                                <input type="file" accept="image/*" onChange={handleHighlightImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary file:text-white hover:file:bg-brand-accent" />
                            )}
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maksimal 100KB.</p>
                        </div>
                    </div>
                )}
            </EditModal>

            {/* Supporter Modal */}
            <EditModal 
                isOpen={isSupporterModalOpen} 
                onClose={() => setIsSupporterModalOpen(false)} 
                title={supporters.some(s => s.id === editingSupporter?.id) ? "Edit Item" : "Tambah Item"}
                onSave={handleSaveSupporter}
                onDelete={supporters.some(s => s.id === editingSupporter?.id) ? handleDeleteSupporter : undefined}
            >
                {editingSupporter && (
                    <div className="space-y-6 pt-2">
                        <div className="relative input-group">
                            <input value={editingSupporter.name} onChange={e => setEditingSupporter({...editingSupporter, name: e.target.value})} className={inputClass} placeholder=" " />
                            <label className={labelClass}>Nama</label>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-dashed dark:border-gray-600">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo (Gambar)</span>
                            {editingSupporter.imageUrl ? (
                                <div className="relative inline-block">
                                    <img src={editingSupporter.imageUrl} alt="Preview" className="h-20 w-auto object-contain rounded bg-white p-1" />
                                    <button onClick={() => setEditingSupporter({...editingSupporter, imageUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow"><i className="fas fa-times text-xs"></i></button>
                                </div>
                            ) : (
                                <input type="file" accept="image/*" onChange={handleSupporterImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary file:text-white hover:file:bg-brand-accent" />
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maksimal 100KB.</p>
                        </div>
                        <div className="relative input-group">
                            <input value={editingSupporter.icon || ''} onChange={e => setEditingSupporter({...editingSupporter, icon: e.target.value})} className={inputClass} placeholder=" " />
                            <label className={labelClass}>Atau Kelas Ikon (ex: fas fa-star)</label>
                        </div>
                        <div className="relative input-group">
                            <input value={editingSupporter.link || ''} onChange={e => setEditingSupporter({...editingSupporter, link: e.target.value})} className={inputClass} placeholder=" " />
                            <label className={labelClass}>Link (Opsional)</label>
                        </div>
                    </div>
                )}
            </EditModal>
        </div>
    );
};

export default AdminManageHighlights;
