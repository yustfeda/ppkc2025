
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

// Modal component for editing stage details
const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, title, children, onSave, onDelete }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.modal-drag-handle') && !target.closest('button')) {
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
                className={`bg-white dark:bg-brand-primary rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'} ${isDragging ? 'select-none' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            >
                <div 
                    onMouseDown={handleMouseDown}
                    className="modal-drag-handle flex-shrink-0 flex justify-between items-center p-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 cursor-move"
                >
                    <h3 className="text-xl font-bold text-brand-primary dark:text-white flex items-center gap-2 pointer-events-none">
                        <i className="fas fa-edit text-brand-secondary"></i>
                        {title}
                    </h3>
                    <button onClick={handleClose} className="btn-close-x text-gray-400 hover:text-red-500 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar space-y-4">
                    {children}
                </div>

                <div className="flex-shrink-0 p-6 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-black/10 flex justify-between items-center">
                    {onDelete ? (
                        <button onClick={onDelete} className="btn-no-lift text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl transition-colors">
                            <i className="fas fa-trash-alt mr-2"></i>Hapus Tahapan
                        </button>
                    ) : <div></div>}
                    <div className="flex gap-3">
                        <button onClick={handleClose} className="btn-no-lift bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Batal
                        </button>
                        <button onClick={() => { onSave(); handleClose(); }} className="btn-no-lift bg-brand-secondary text-white font-bold py-2.5 px-8 rounded-xl text-sm hover:bg-brand-accent shadow-lg shadow-brand-secondary/20 transition-all active:scale-95">
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal component for configuring custom popup messages based on participant status
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
        const target = e.target as HTMLElement;
        if (target.closest('.modal-drag-handle') && !target.closest('button')) {
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
            setIsClosing(false);
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

                    {/* Pending Status Messages */}
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

                     {/* Success Status Messages */}
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

                    {/* Failure Status Messages */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
                        <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-4 flex items-center gap-2">
                            <i className="fas fa-times-circle"></i> Status: Gagal Tahapan
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

                <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button onClick={handleClose} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded-xl text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Batal</button>
                    <button onClick={handleSave} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-xl text-sm hover:bg-brand-accent shadow-lg shadow-brand-secondary/20 transition-all">Simpan Konfigurasi</button>
                </div>
            </div>
        </div>
    );
};

// Main component for managing the various stages of the selection process
const AdminManageStages: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<SelectionStage | null>(null);

    const fetchStages = useCallback(async () => {
        setLoading(true);
        const data = await getSelectionStages();
        setStages(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStages();
    }, [fetchStages]);

    const handleSaveStage = async () => {
        if (!editingStage) return;
        const newStages = stages.some(s => s.id === editingStage.id)
            ? stages.map(s => s.id === editingStage.id ? editingStage : s)
            : [...stages, editingStage];
        
        await setData('selectionStages', newStages);
        setStages(newStages);
        showNotification('Tahapan seleksi berhasil disimpan!', 'success');
        setIsEditModalOpen(false);
        setEditingStage(null);
    };

    const handleDeleteStage = () => {
        if (!editingStage) return;
        showConfirmation(
            `Hapus tahapan "${editingStage.title}"?`,
            async () => {
                const newStages = stages.filter(s => s.id !== editingStage.id);
                await setData('selectionStages', newStages);
                setStages(newStages);
                showNotification('Tahapan dihapus.', 'success');
                setIsEditModalOpen(false);
                setEditingStage(null);
            }
        );
    };

    const handleAddStage = () => {
        setEditingStage({
            id: Date.now().toString(),
            title: '',
            description: '',
            date: '',
            formTitle: '',
            formDescription: '',
            formViewUrl: '',
            formDownloadUrl: '',
            popupContent: {
                pending: { title: 'Sedang Ditinjau', message: 'Pendaftaran Anda untuk tahap ini sedang dalam proses peninjauan.' },
                lolos: { title: 'Selamat!', message: 'Anda dinyatakan lolos ke tahapan selanjutnya.' },
                gagal: { title: 'Mohon Maaf', message: 'Anda dinyatakan gagal pada tahap ini.' }
            }
        });
        setIsEditModalOpen(true);
    };

    const handleSavePopupContent = async (newContent: SelectionStage['popupContent']) => {
        if (!editingStage || !newContent) return;
        const updatedStage = { ...editingStage, popupContent: newContent };
        const newStages = stages.map(s => s.id === updatedStage.id ? updatedStage : s);
        await setData('selectionStages', newStages);
        setStages(newStages);
        showNotification('Pesan popup berhasil diperbarui!', 'success');
        setIsPopupModalOpen(false);
        setEditingStage(null);
    };

    if (loading) return <div className="text-center p-8"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    const inputClass = "peer form-input p-3 border rounded-xl text-sm w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent transition-all";
    const labelClass = "form-label text-xs dark:text-gray-400";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-brand-primary p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Kelola Tahapan Seleksi</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Atur alur seleksi, jadwal, dan formulir pendaftaran.</p>
                    </div>
                    <button onClick={handleAddStage} className="bg-brand-secondary text-white font-bold py-2.5 px-6 rounded-xl text-sm hover:bg-brand-accent shadow-lg shadow-brand-secondary/20 flex items-center gap-2 active:scale-95 transition-all">
                        <i className="fas fa-plus"></i> Tambah Tahapan
                    </button>
                </div>

                <div className="space-y-4">
                    {stages.map((stage, index) => (
                        <div key={stage.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gray-50 dark:bg-brand-dark rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-secondary dark:hover:border-brand-secondary transition-all">
                            <div className="flex items-start gap-4 flex-grow mb-4 sm:mb-0">
                                <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 dark:bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-lg flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-brand-primary dark:text-white text-base truncate">{stage.title}</h3>
                                    <p className="text-xs text-brand-secondary font-medium">{stage.date}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{stage.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={() => { setEditingStage(stage); setIsPopupModalOpen(true); }}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-lg hover:bg-yellow-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                                    title="Atur Pesan Popup"
                                >
                                    <i className="fas fa-comment-dots"></i> Popup
                                </button>
                                <button 
                                    onClick={() => { setEditingStage(stage); setIsEditModalOpen(true); }}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                            </div>
                        </div>
                    ))}
                    {stages.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 dark:bg-brand-dark rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <i className="fas fa-tasks text-4xl text-gray-300 dark:text-gray-700 mb-4"></i>
                            <p className="text-gray-500 dark:text-gray-400">Belum ada tahapan seleksi yang dibuat.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Stage Modal */}
            <EditModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                title={stages.some(s => s.id === editingStage?.id) ? "Edit Tahapan Seleksi" : "Tambah Tahapan Baru"}
                onSave={handleSaveStage}
                onDelete={stages.some(s => s.id === editingStage?.id) ? handleDeleteStage : undefined}
            >
                {editingStage && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative input-group">
                                <input value={editingStage.title} onChange={e => setEditingStage({...editingStage, title: e.target.value})} className={inputClass} placeholder=" " autoFocus/>
                                <label className={labelClass}>Judul Tahapan</label>
                            </div>
                            <div className="relative input-group">
                                <input value={editingStage.date} onChange={e => setEditingStage({...editingStage, date: e.target.value})} className={inputClass} placeholder=" "/>
                                <label className={labelClass}>Waktu Pelaksanaan</label>
                            </div>
                        </div>
                        <div className="relative input-group">
                            <textarea value={editingStage.description} onChange={e => setEditingStage({...editingStage, description: e.target.value})} className={inputClass} rows={3} placeholder=" "/>
                            <label className={labelClass}>Deskripsi Singkat</label>
                        </div>

                        <div className="bg-gray-50 dark:bg-brand-dark/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                            <h4 className="font-bold text-brand-primary dark:text-white text-sm flex items-center gap-2">
                                <i className="fas fa-file-signature text-brand-secondary"></i>
                                Konfigurasi Formulir Tahap Ini (Opsional)
                            </h4>
                            <div className="relative input-group">
                                <input value={editingStage.formTitle || ''} onChange={e => setEditingStage({...editingStage, formTitle: e.target.value})} className={inputClass} placeholder=" "/>
                                <label className={labelClass}>Judul Formulir</label>
                            </div>
                            <div className="relative input-group">
                                <textarea value={editingStage.formDescription || ''} onChange={e => setEditingStage({...editingStage, formDescription: e.target.value})} className={inputClass} rows={2} placeholder=" "/>
                                <label className={labelClass}>Instruksi Pengisian</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative input-group">
                                    <input value={editingStage.formViewUrl || ''} onChange={e => setEditingStage({...editingStage, formViewUrl: e.target.value})} className={inputClass} placeholder=" "/>
                                    <label className={labelClass}>URL Lihat Formulir</label>
                                </div>
                                <div className="relative input-group">
                                    <input value={editingStage.formDownloadUrl || ''} onChange={e => setEditingStage({...editingStage, formDownloadUrl: e.target.value})} className={inputClass} placeholder=" "/>
                                    <label className={labelClass}>URL Unduh Formulir</label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </EditModal>

            {/* Popup Content Modal */}
            <PopupContentModal 
                stage={editingStage} 
                onClose={() => setIsPopupModalOpen(false)} 
                onSave={handleSavePopupContent} 
            />
        </div>
    );
};

export default AdminManageStages;
