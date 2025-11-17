import React, { useState, useEffect, useCallback } from 'react';
import { getSelectionStagesRealtime, setData } from '../../services/firebase';
import type { SelectionStage, AdminPageProps } from '../../types';

const AdminManageStages: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const stagesData = await getSelectionStagesRealtime();
        setStages(stagesData || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        setLoading(true);
        // Ensure IDs are strings and not numbers from Date.now()
        const stagesToSave = stages.map(stage => ({...stage, id: String(stage.id)}));
        await setData('selectionStages', stagesToSave);
        setLoading(false);
        showNotification('Perubahan tahapan berhasil disimpan!', 'success');
        fetchData(); // Refresh to ensure IDs are consistent
    };

    const handleStageChange = (index: number, field: keyof SelectionStage, value: string) => {
        const newStages = [...stages];
        const stageToUpdate = { ...newStages[index], [field]: value };
        newStages[index] = stageToUpdate;
        setStages(newStages);
    }
    
    const handleAddStage = () => {
        const newStage: SelectionStage = {
            id: `new_${Date.now()}`,
            title: '',
            date: '',
            description: '',
            formTitle: '',
            formDescription: '',
            formViewUrl: '',
            formDownloadUrl: '',
        };
        setStages([...stages, newStage]);
    };

    const handleDeleteStage = (id: string) => {
        showConfirmation(
            'Anda yakin ingin menghapus tahapan ini? Tindakan ini tidak dapat diurungkan.',
            () => setStages(stages.filter(s => s.id !== id))
        );
    };

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola Konten Tahapan Seleksi</h1>
            <div className="space-y-4">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="p-4 bg-gray-50 dark:bg-brand-dark rounded-lg shadow-sm relative form-input-bg-dark">
                         { index > 0 && // Don't allow deleting the first (admin) stage
                            <button onClick={() => handleDeleteStage(stage.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs z-10">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                         }
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative input-group">
                                <input id={`title-${stage.id}`} value={stage.title} onChange={e => handleStageChange(index, 'title', e.target.value)} className={`${inputClass} font-semibold`} placeholder=" "/>
                                <label htmlFor={`title-${stage.id}`} className={labelClass}>Judul Tahapan</label>
                            </div>
                            <div className="relative input-group">
                                <input id={`date-${stage.id}`} value={stage.date} onChange={e => handleStageChange(index, 'date', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`date-${stage.id}`} className={labelClass}>Tanggal</label>
                            </div>
                            <div className="md:col-span-2 relative input-group">
                                <textarea id={`desc-${stage.id}`} value={stage.description} onChange={e => handleStageChange(index, 'description', e.target.value)} className={`${inputClass}`} placeholder=" " rows={2}/>
                                <label htmlFor={`desc-${stage.id}`} className={labelClass}>Deskripsi Singkat</label>
                            </div>
                            <div className="md:col-span-2 relative input-group">
                                <input id={`formTitle-${stage.id}`} value={stage.formTitle || ''} onChange={e => handleStageChange(index, 'formTitle', e.target.value)} className={`${inputClass} font-medium`} placeholder=" "/>
                                <label htmlFor={`formTitle-${stage.id}`} className={labelClass}>Judul Form Tugas (opsional)</label>
                            </div>
                            <div className="md:col-span-2 relative input-group">
                                <textarea id={`formDesc-${stage.id}`} value={stage.formDescription || ''} onChange={e => handleStageChange(index, 'formDescription', e.target.value)} className={`${inputClass}`} placeholder=" " rows={3}/>
                                <label htmlFor={`formDesc-${stage.id}`} className={labelClass}>Deskripsi Form (opsional)</label>
                            </div>
                           <div className="relative input-group">
                                <input id={`formView-${stage.id}`} value={stage.formViewUrl || ''} onChange={e => handleStageChange(index, 'formViewUrl', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`formView-${stage.id}`} className={labelClass}>Link Lihat Form (opsional)</label>
                           </div>
                           <div className="relative input-group">
                                <input id={`formDownload-${stage.id}`} value={stage.formDownloadUrl || ''} onChange={e => handleStageChange(index, 'formDownloadUrl', e.target.value)} className={inputClass} placeholder=" "/>
                                <label htmlFor={`formDownload-${stage.id}`} className={labelClass}>Link Unduh Form (opsional)</label>
                           </div>
                        </div>
                        { index === 0 &&
                            <div className="mt-4 pt-3 border-t dark:border-gray-700">
                               <p className="text-xs text-gray-500 dark:text-gray-400">
                                <i className="fas fa-info-circle mr-1"></i>
                                Tahap Administrasi tidak dapat dihapus. Statusnya dikelola di "Kelola User".
                               </p>
                            </div>
                        }
                    </div>
                ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button onClick={handleAddStage} disabled={loading} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700">
                  <i className="fas fa-plus mr-2"></i>Tambah Tahapan
                </button>
                <button onClick={handleSave} disabled={loading} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent flex-grow">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Simpan Semua Perubahan'}
                </button>
            </div>
        </div>
    );
};

export default AdminManageStages;