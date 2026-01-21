import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.modal-drag-handle')) {
            setIsDragging(true);
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initialX: position.x,
                initialY: position.y
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            setPosition({
                x: dragRef.current.initialX + dx,
                y: dragRef.current.initialY + dy
            });
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setPosition({ x: 0, y: 0 });
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 overflow-hidden" onClick={handleClose}>
            <div 
                className={`bg-white dark:bg-brand-primary rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'} ${isDragging ? 'select-none' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            >
                <div 
                    onMouseDown={handleMouseDown}
                    className="modal-drag-handle flex-shrink-0 flex justify-between items-center p-5 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 cursor-move"
                >
                    <h3 className="text-lg font-bold text-brand-primary dark:text-white flex items-center gap-2 pointer-events-none">
                        <i className="fas fa-edit text-brand-secondary"></i>
                        {title}
                    </h3>
                    <button onClick={handleClose} className="btn-close-x text-gray-400 hover:text-red-500 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-5 custom-scrollbar space-y-4">
                    {children}
                </div>

                <div className="flex-shrink-0 p-5 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 flex justify-between items-center">
                    {onDelete ? (
                        <button onClick={onDelete} className="btn-no-lift text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl transition-colors">
                            <i className="fas fa-trash-alt mr-2"></i>Hapus
                        </button>
                    ) : <div></div>}
                    <div className="flex gap-3">
                        <button onClick={handleClose} className="btn-no-lift bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 px-5 rounded-xl text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Batal
                        </button>
                        <button onClick={() => { onSave(); handleClose(); }} className="btn-no-lift bg-brand-secondary text-white font-bold py-2.5 px-8 rounded-xl text-xs hover:bg-brand-accent shadow-lg shadow-brand-secondary/20 transition-all active:scale-95">
                            Simpan
                        </button>
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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.modal-drag-handle')) {
            setIsDragging(true);
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initialX: position.x,
                initialY: position.y
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            setPosition({
                x: dragRef.current.initialX + dx,
                y: dragRef.current.initialY + dy
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

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
        setTimeout(() => {
            onClose();
            setPosition({ x: 0, y: 0 });
        }, 300);
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

    const inputClass = "peer form-input p-3 border rounded-xl text-sm w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent transition-all";
    const labelClass = "form-label text-xs dark:text-gray-400";

    return (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center z-[100000] p-4 overflow-hidden" onClick={handleClose}>
             <div 
                className={`bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'} ${isDragging ? 'select-none' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            >
                <div onMouseDown={handleMouseDown} className="modal-drag-handle flex justify-between items-center mb-6 cursor-move">
                     <h3 className="text-xl font-bold text-brand-dark dark:text-white pointer-events-none">Konfigurasi Pesan Popup</h3>
                     <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
                </div>
                
                <div className="space-y-6 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            <i className="fas fa-info-circle mr-2 text-sm"></i>
                            Pesan di bawah ini akan muncul saat peserta mengklik kartu tahapan sesuai dengan status seleksi mereka.
                        </p>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/50">
                        <h4 className="font-bold text-yellow-700 dark:text-yellow-400 text-sm mb-4 flex items-center gap-2">
                            <i className="fas fa-clock"></i> Status: Sedang Ditinjau
                        </h4>
                        <div className="space-y-4">
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

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50">
                        <h4 className="font-bold text-green-700 dark:text-green-400 text-sm mb-4 flex items-center gap-2">
                            <i className="fas fa-check-circle"></i> Status: Lolos Tahapan
                        </h4>
                        <div className="space-y-4">
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

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
                        <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-4 flex items-center gap-2">
                            <i className="fas fa-times-circle"></i> Status: Tidak Lolos
                        </h4>
                        <div className="space-y-4">
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
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-gray-700">
                    <button onClick={handleSave} className="btn-no-lift bg-brand-secondary text-white font-bold py-3 px-6 rounded-xl text-sm hover:bg-brand-accent w-full shadow-lg shadow-brand-secondary/20 transition-all active:scale-95">
                        Simpan Konfigurasi Pesan
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminManageStages: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);
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

    const inputClass = "peer form-input p-3 border rounded-xl text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent transition-all";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-12"><i className="fas fa-spinner fa-spin text-3xl text-brand-secondary"></i></div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-160px)] animate-fade-in">
            <div className="bg-white dark:bg-brand-primary p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex-grow flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-primary dark:text-white tracking-tight">Kelola Tahapan Seleksi</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Atur urutan, jadwal, dan kriteria kelulusan tiap tahap.</p>
                    </div>
                    <button onClick={handleAddStage} className="btn-no-lift bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-sm hover:bg-green-700 shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all active:scale-95">
                        <i className="fas fa-plus"></i> Tambah Tahapan Baru
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stages.map((stage, index) => (
                        <div 
                            key={stage.id} 
                            onClick={() => handleEditStage(stage)}
                            className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:border-brand-secondary/30 transition-all transform hover:-translate-y-1 relative group flex flex-col h-full overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary"></div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-brand-secondary/10 dark:bg-brand-secondary/20 text-brand-secondary w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm flex-shrink-0">
                                    {index + 1}
                                </div>
                                <h3 className="font-bold text-brand-primary dark:text-white text-lg leading-snug line-clamp-2 group-hover:text-brand-secondary transition-colors">{stage.title || 'Tanpa Judul'}</h3>
                            </div>
                            
                            <div className="mb-6 flex-grow">
                                <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary dark:text-blue-300 mb-2 uppercase tracking-wider">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>{stage.date || 'Tanggal belum diatur'}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                    {stage.description || 'Tidak ada deskripsi tahapan.'}
                                </p>
                            </div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 bg-white dark:bg-gray-900 rounded-xl p-2.5 shadow-xl z-10 border dark:border-gray-700">
                                <i className="fas fa-pen text-sm text-brand-secondary"></i>
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>ID: {stage.id.substring(0, 8)}</span>
                                {index === 0 && <span className="text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">Langkah Utama</span>}
                            </div>
                        </div>
                    ))}
                    {stages.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <i className="fas fa-layer-group text-4xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada tahapan seleksi yang dibuat.</p>
                        </div>
                    )}
                </div>
            </div>

            <div id="modal-portal">
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
                    title={stages.some(s => s.id === editingStage?.id) ? "Edit Detail Tahapan" : "Tambah Tahapan Baru"}
                    onSave={handleSaveStage}
                    onDelete={stages.some(s => s.id === editingStage?.id) && stages.indexOf(editingStage!) !== 0 ? handleDeleteStage : undefined}
                >
                    {editingStage && (
                        <div className="space-y-6 pt-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <label className={labelClass}>Deskripsi Singkat Tahapan</label>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border dark:border-gray-700 space-y-4">
                                <h4 className="font-bold text-brand-primary dark:text-white text-sm flex items-center gap-2">
                                    <i className="fas fa-file-alt text-brand-secondary"></i>
                                    Konfigurasi Form & Dokumen (Opsional)
                                </h4>
                                <div className="space-y-5">
                                    <div className="relative input-group">
                                        <input value={editingStage.formTitle || ''} onChange={e => setEditingStage({...editingStage, formTitle: e.target.value})} className={inputClass} placeholder=" "/>
                                        <label className={labelClass}>Judul Form Tugas</label>
                                    </div>
                                    <div className="relative input-group">
                                        <textarea value={editingStage.formDescription || ''} onChange={e => setEditingStage({...editingStage, formDescription: e.target.value})} className={inputClass} rows={2} placeholder=" "/>
                                        <label className={labelClass}>Deskripsi Form</label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                className="btn-no-lift w-full py-4 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
                            >
                                <i className="fas fa-comment-dots text-lg"></i> 
                                Edit Pesan Popup Khusus (Lolos/Gagal/Pending)
                            </button>

                            {stages.indexOf(editingStage) === 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50 flex gap-3">
                                    <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-500 mt-0.5"></i>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                                        Catatan: Tahap pertama adalah Seleksi Administrasi (Sistem Utama). Tahap ini tidak dapat dihapus untuk menjaga integritas data pendaftaran.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </EditModal>
            </div>
        </div>
    );
};

export default AdminManageStages;
