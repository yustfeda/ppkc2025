
import React, { useState, useEffect } from 'react';
import { getAnnouncements, setData } from '../../services/firebase';
import type { AnnouncementDocument, AdminPageProps } from '../../types';

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

                <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                    {onDelete ? (
                        <button onClick={onDelete} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"><i className="fas fa-trash-alt mr-2"></i>Hapus</button>
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

const AdminManageAnnouncements: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [announcements, setAnnouncements] = useState<AnnouncementDocument[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<AnnouncementDocument | null>(null);

    useEffect(() => {
        setLoading(true);
        getAnnouncements().then(data => {
            setAnnouncements(data || []);
            setLoading(false);
        });
    }, []);
    
    const handleSave = async () => {
        if (!editingDoc) return;
        
        const newAnnouncements = announcements.some(doc => doc.id === editingDoc.id)
            ? announcements.map(doc => doc.id === editingDoc.id ? editingDoc : doc)
            : [...announcements, editingDoc];
            
        await setData('announcements', newAnnouncements);
        setAnnouncements(newAnnouncements); 
        showNotification('Pengumuman berhasil disimpan!', 'success');
        setEditingDoc(null);
    };

    const handleAdd = () => {
        setEditingDoc({ id: Date.now().toString(), title: "", description: "", fileUrl: "", thumbnailUrl: "" });
        setIsModalOpen(true);
    };

    const handleEdit = (doc: AnnouncementDocument) => {
        setEditingDoc(doc);
        setIsModalOpen(true);
    }

    const handleDelete = () => {
        if (!editingDoc) return;
        showConfirmation(
            'Anda yakin ingin menghapus pengumuman ini?',
            async () => {
                const updatedAnnouncements = announcements.filter(doc => doc.id !== editingDoc.id);
                await setData('announcements', updatedAnnouncements);
                setAnnouncements(updatedAnnouncements);
                showNotification('Pengumuman dihapus.', 'success');
                setIsModalOpen(false);
            }
        );
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && editingDoc) {
            const file = e.target.files[0];
            // 100KB limit
            if (file.size > 100 * 1024) {
                 showNotification('Ukuran gambar maksimal 100KB.', 'error');
                 return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setEditingDoc({ ...editingDoc, thumbnailUrl: base64 });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Kelola Pengumuman</h1>
                    <button onClick={handleAdd} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700 shadow flex items-center gap-2">
                        <i className="fas fa-plus"></i> Tambah Pengumuman
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {announcements.map((doc) => (
                        <div 
                            key={doc.id} 
                            onClick={() => handleEdit(doc)}
                            className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 relative group flex flex-col h-full"
                        >
                             <div className="h-40 bg-gray-200 dark:bg-gray-700 relative overflow-hidden flex items-center justify-center">
                                {doc.thumbnailUrl ? (
                                    <img src={doc.thumbnailUrl} alt={doc.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <i className="fas fa-image text-4xl mb-2"></i>
                                        <span className="text-xs">Tidak ada gambar</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                            </div>
                            
                            <div className="p-4 flex-grow flex flex-col">
                                <h3 className="font-bold text-brand-primary dark:text-white text-lg mb-2 line-clamp-2">{doc.title || 'Tanpa Judul'}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-grow">
                                    {doc.description || 'Tidak ada deskripsi.'}
                                </p>
                                
                                {doc.fileUrl && (
                                     <div className="mt-auto pt-3 border-t dark:border-gray-700">
                                         <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded inline-flex items-center">
                                             <i className="fas fa-link mr-1"></i> Tautan File Aktif
                                         </span>
                                     </div>
                                )}
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-black rounded-full p-2 shadow-md z-10">
                                <i className="fas fa-pen text-sm text-blue-500"></i>
                            </div>
                        </div>
                    ))}
                    {announcements.length === 0 && <p className="text-gray-500 text-sm italic col-span-full text-center py-8">Belum ada pengumuman.</p>}
                </div>
            </div>

            {/* Edit Modal */}
            <EditModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={announcements.some(d => d.id === editingDoc?.id) ? "Edit Pengumuman" : "Tambah Pengumuman"}
                onSave={handleSave}
                onDelete={announcements.some(d => d.id === editingDoc?.id) ? handleDelete : undefined}
            >
                {editingDoc && (
                    <div className="space-y-6 pt-1">
                        <div className="relative input-group">
                            <input value={editingDoc.title} onChange={e => setEditingDoc({...editingDoc, title: e.target.value})} className={inputClass} placeholder=" " autoFocus/>
                            <label className={labelClass}>Judul Pengumuman</label>
                        </div>
                        <div className="relative input-group">
                            <textarea 
                                value={editingDoc.description || ''} 
                                onChange={e => setEditingDoc({...editingDoc, description: e.target.value})} 
                                className={inputClass} 
                                rows={4}
                                placeholder=" "
                            />
                            <label className={labelClass}>Deskripsi</label>
                        </div>
                         
                         <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-dashed dark:border-gray-600">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail / Gambar</span>
                            {editingDoc.thumbnailUrl ? (
                                <div className="relative inline-block group/img">
                                    <img src={editingDoc.thumbnailUrl} alt="Thumbnail Preview" className="h-32 w-auto object-contain rounded border bg-gray-50" />
                                    <button 
                                        onClick={() => setEditingDoc({...editingDoc, thumbnailUrl: ''})}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow hover:bg-red-600"
                                        title="Hapus Gambar"
                                    >
                                        <i className="fas fa-times text-xs"></i>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                                        <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Klik untuk upload</span></p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (Max 100KB)</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>

                        <div className="relative input-group">
                            <input value={editingDoc.fileUrl} onChange={e => setEditingDoc({...editingDoc, fileUrl: e.target.value})} className={inputClass} placeholder=" "/>
                            <label className={labelClass}>Link Drive File / Dokumen (Opsional)</label>
                        </div>
                    </div>
                )}
            </EditModal>
        </div>
    );
};

export default AdminManageAnnouncements;
