import React, { useState, useEffect, useCallback } from 'react';
import { getSelectionStages, setData } from '../../services/firebase';
import type { SelectionStage, AdminPageProps } from '../../types';

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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4 overflow-y-auto" onClick={handleClose}>
            <div 
                className={`bg-white dark:bg-brand-primary rounded-lg p-6 max-w-2xl w-full shadow-2xl ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'} flex flex-col max-h-[85vh] overflow-hidden my-auto`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-2">
                    <h3 className="text-xl font-bold text-brand-primary dark:text-white">{title}</h3>
                    <button onClick={handleClose} className="btn-close-x text-gray-400 hover:text-red-500 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {children}
                </div>

                <div className="flex-shrink-0 mt-6 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                    {onDelete ? (
                        <button onClick={onDelete} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"><i className="fas fa-trash-alt mr-2"></i>Hapus</button>
                    ) : <div></div>}
                    <div className="flex gap-3">
                        <button onClick={handleClose} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600">Batal</button>
                        <button onClick={() => { onSave(); handleClose(); }} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md text-sm hover:bg-brand-accent shadow-md">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PopupContentModal: React.FC<{
    stage: SelectionStage | null;
    onClose: () => void;
    onSave: (newContent: SelectionStage['popupContent']) => void;
}> = ({ stage, onClose, onSave }) => {
    const [content, setContent] = useState(stage?.popupContent);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setContent(stage?.popupContent || {
            pending: { title: '', message: '' },
            lolos: { title: '', message: '' },
            gagal: { title: '', message: '' },
        });
    }, [stage]);

    if (!stage) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleSave = () => {
        onSave(content);
        handleClose();
    };
    
    const handleChange = (status: 'pending' | 'lolos' | 'gagal', field: 'title' | 'message', value: string) => {
        setContent(prev => ({
            ...prev!,
            [status]: { ...prev![status], [field]: value }
        }));
    };

    const inputClass = "peer form-input p-2 border rounded text-sm w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-xs dark:text-gray-400";

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100000] p-4" onClick={handleClose}>
             <div 
                className={`bg-brand-light dark:bg-gray-700 rounded-lg p-6 max-w-lg w-full shadow-lg ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'} flex flex-col max-h-[80vh]`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Edit Konten Popup</h3>
                     <button onClick={handleClose} className="text-gray-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
                </div>
                
                <div className="space-y-4 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        <i className="fas fa-info-circle mr-1"></i>
                        Pesan ini akan muncul saat peserta mengklik kartu tahapan di halaman "Tahapan Seleksi".
                    </p>

                    {/* Pending */}
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-100 dark:border-yellow-800">
                        <h4 className="font-bold text-yellow-700 dark:text-yellow-300 text-sm mb-2 flex items-center"><i className="fas fa-hourglass-half mr-2"></i>Status: Pending Review</h4>
                        <div className="space-y-3">
                            <div className="relative input-group">
                                <input value={content?.pending?.title || ''} onChange={(e) => handleChange('pending', 'title', e.target.value)} className={inputClass} placeholder=" "/>
                                <label className={labelClass}>Judul Popup</label>
                            </div>
                            <div className="relative input-group">
                                <textarea value={content?.pending?.message || ''} onChange={(e) => handleChange('pending', 'message', e.target.value)} className={inputClass} rows={2} placeholder=" "/>
                                <label className={labelClass}>Pesan Popup</label>
                            </div>
                        </div>
                    </div>
                     {/* Lolos */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-100 dark:border-green-800">
                        <h4 className="font-bold text-green-700 dark:text-green-300 text-sm mb-2 flex items-center"><i className="fas fa-check-circle mr-2"></i>Status: Lolos</h4>
                        <div className="space-y-3">
                            <div className="relative input-group">
                                <input value={content?.lolos?.title || ''} onChange={(e) => handleChange('lolos', 'title', e.target.value)} className={inputClass} placeholder=" "/>
                                <label className={labelClass}>Judul Popup</label>
                            </div>
                             <div className="relative input-group">
                                <textarea value={content?.lolos?.message || ''} onChange={(e) => handleChange('lolos', 'message', e.target.value)} className={inputClass} rows={2} placeholder=" "/>
                                <label className={labelClass}>Pesan Popup</label>
                            </div>
                        </div>
                    </div>
                     {/* Gagal */}
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-100 dark:border-red-800">
                        <h4 className="font-bold text-red-700 dark:text-red-300 text-sm mb-2 flex items-center"><i className="fas fa-times-circle mr-2"></i>Status: Gagal</h4>
                        <div className="space-y-3">
                            <div className="relative input-group">
                                <input value={content?.gagal?.title || ''} onChange={(e) => handleChange('gagal', 'title', e.target.value)} className={inputClass} placeholder=" "/>
                                <label className={labelClass}>Judul Popup</label>
                            </div>
                            <div className="relative input-group">
                                <textarea value={content?.gagal?.message || ''} onChange={(e) => handleChange('gagal', 'message', e.target.value)} className={inputClass} rows={2} placeholder=" "/>
                                <label className={labelClass}>Pesan Popup</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t dark:border-gray-600">
                    <button onClick={handleSave} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent w-full shadow-md">Simpan Konten Popup</button>
                </div>
            </div>
        </div>
    );
};

const AdminManageStages: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Editing States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<SelectionStage | null>(null);
    const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const stagesData = await getSelectionStages();
        setStages(stagesData || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveStage = async () => {
        if (!editingStage) return;

        const newStages = stages.some(s => s.id === editingStage.id)
            ? stages.map(s => s.id === editingStage.id ? editingStage : s)
            : [...stages, editingStage];
            
        const stagesToSave = newStages.map(stage => ({...stage, id: String(stage.id)}));
        
        await setData('selectionStages', stagesToSave);
        setStages(stagesToSave);
        showNotification('Data tahapan berhasil disimpan!', 'success');
        setEditingStage(null);
    };

    const handleAddStage = () => {
        setEditingStage({
            id: `new_${Date.now()}`,
            title: '',
            date: '',
            description: '',
            formTitle: '',
            formDescription: '',
            formViewUrl: '',
            formDownloadUrl: '',
            popupContent: {
                pending: { title: '', message: '' },
                lolos: { title: '', message: '' },
                gagal: { title: '', message: '' },
            }
        });
        setIsModalOpen(true);
    };

    const handleEditStage = (stage: SelectionStage) => {
        setEditingStage(stage);
        setIsModalOpen(true);
    }

    const handleDeleteStage = () => {
        if (!editingStage) return;
        showConfirmation(
            'Anda yakin ingin menghapus tahapan ini? Tindakan ini tidak dapat diurungkan.',
            async () => {
                const newStages = stages.filter(s => s.id !== editingStage.id);
                const stagesToSave = newStages.map(stage => ({...stage, id: String(stage.id)}));
                await setData('selectionStages', stagesToSave);
                setStages(stagesToSave);
                showNotification('Tahapan berhasil dihapus.', 'success');
                setIsModalOpen(false);
            }
        );
    };
    
    const handlePopupContentUpdate = (newContent: SelectionStage['popupContent']) => {
        if (editingStage) {
            setEditingStage({ ...editingStage, popupContent: newContent });
        }
    }

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Kelola Tahapan Seleksi</h1>
                        <button onClick={handleAddStage} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700 shadow flex items-center gap-2 transition-transform active:scale-95">
                            <i className="fas fa-plus"></i> Tambah Tahapan
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stages.map((stage, index) => (
                            <div 
                                key={stage.id} 
                                onClick={() => handleEditStage(stage)}
                                className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 relative group flex flex-col h-full"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-brand-secondary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-bold text-brand-primary dark:text-white text-lg leading-tight line-clamp-2">{stage.title || 'Tanpa Judul'}</h3>
                                </div>
                                
                                <div className="mb-4 flex-grow">
                                    <p className="text-xs font-semibold text-brand-secondary dark:text-blue-300 mb-1">
                                        <i className="fas fa-calendar-alt mr-1"></i> {stage.date || 'Tanggal belum diatur'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                        {stage.description || 'Tidak ada deskripsi.'}
                                    </p>
                                </div>

                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-black rounded-full p-2 shadow-md">
                                    <i className="fas fa-pen text-sm text-blue-500"></i>
                                </div>
                                
                                <div className="mt-auto pt-3 border-t dark:border-gray-700 flex justify-between items-center text-xs text-gray-400">
                                    <span>ID: {stage.id.substring(0, 8)}...</span>
                                    {index === 0 && <span className="text-yellow-600 font-semibold bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">Langkah Utama</span>}
                                </div>
                            </div>
                        ))}
                        {stages.length === 0 && <p className="text-gray-500 text-sm italic col-span-full text-center py-8">Belum ada tahapan seleksi.</p>}
                    </div>
                </div>
            </div>

            {/* Modal di Render di luar div animasi induk agar tidak terpotong (Stacking Context) */}
            {isPopupModalOpen && editingStage && (
                <PopupContentModal 
                    stage={editingStage} 
                    onClose={() => setIsPopupModalOpen(false)} 
                    onSave={handlePopupContentUpdate} 
                />
            )}

            <EditModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={stages.some(s => s.id === editingStage?.id) ? "Edit Tahapan" : "Tambah Tahapan"}
                onSave={handleSaveStage}
                onDelete={stages.some(s => s.id === editingStage?.id) && stages.indexOf(editingStage!) !== 0 ? handleDeleteStage : undefined}
            >
                {editingStage && (
                    <div className="space-y-5 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative input-group">
                                <input value={editingStage.title} onChange={e => setEditingStage({...editingStage, title: e.target.value})} className={inputClass} placeholder=" " autoFocus/>
                                <label className={labelClass}>Judul Tahapan</label>
                            </div>
                            <div className="relative input-group">
                                <input value={editingStage.date} onChange={e => setEditingStage({...editingStage, date: e.target.value})} className={inputClass} placeholder=" "/>
                                <label className={labelClass}>Tanggal Pelaksanaan</label>
                            </div>
                        </div>
                        
                        <div className="relative input-group">
                            <textarea value={editingStage.description} onChange={e => setEditingStage({...editingStage, description: e.target.value})} className={inputClass} rows={3} placeholder=" "/>
                            <label className={labelClass}>Deskripsi Singkat</label>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border dark:border-gray-700">
                            <h4 className="font-semibold text-brand-primary dark:text-white text-sm mb-3 border-b dark:border-gray-600 pb-2">Konfigurasi Form & Dokumen (Opsional)</h4>
                            <div className="space-y-4">
                                <div className="relative input-group">
                                    <input value={editingStage.formTitle || ''} onChange={e => setEditingStage({...editingStage, formTitle: e.target.value})} className={inputClass} placeholder=" "/>
                                    <label className={labelClass}>Judul Form Tugas</label>
                                </div>
                                <div className="relative input-group">
                                    <textarea value={editingStage.formDescription || ''} onChange={e => setEditingStage({...editingStage, formDescription: e.target.value})} className={inputClass} rows={2} placeholder=" "/>
                                    <label className={labelClass}>Deskripsi Form</label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative input-group">
                                        <input value={editingStage.formViewUrl || ''} onChange={e => setEditingStage({...editingStage, formViewUrl: e.target.value})} className={inputClass} placeholder=" "/>
                                        <label className={labelClass}>Link Lihat Form (URL)</label>
                                    </div>
                                    <div className="relative input-group">
                                        <input value={editingStage.formDownloadUrl || ''} onChange={e => setEditingStage({...editingStage, formDownloadUrl: e.target.value})} className={inputClass} placeholder=" "/>
                                        <label className={labelClass}>Link Unduh Form (URL)</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsPopupModalOpen(true)}
                            className="w-full py-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <i className="fas fa-comment-alt-lines"></i> Edit Pesan Popup Khusus (Lolos/Gagal/Pending)
                        </button>

                        {stages.indexOf(editingStage) === 0 && (
                            <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                                Note: Tahap pertama adalah Seleksi Administrasi. Anda tidak dapat menghapusnya, namun dapat mengedit kontennya.
                            </p>
                        )}
                    </div>
                )}
            </EditModal>
        </>
    );
};

export default AdminManageStages;