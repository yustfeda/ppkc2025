import React, { useState, useEffect, useCallback } from 'react';
import { getSelectionStages, setData } from '../../services/firebase';
import type { SelectionStage, AdminPageProps } from '../../types';

const AdminManageStages: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const stagesData = await getSelectionStages();
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
            title: 'Tahap Baru',
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

    const inputClass = "p-2 border rounded text-sm w-full bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";

    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="bg-brand-light dark:bg-gray-900 p-6 rounded-lg shadow-md animate-fade-in">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-white mb-6">Kelola Konten Tahapan Seleksi</h1>
            <div className="space-y-4">
                {stages.map((stage, index) => (
                    <div key={stage.id} className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm relative">
                         { index > 0 && // Don't allow deleting the first (admin) stage
                            <button onClick={() => handleDeleteStage(stage.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                         }
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input value={stage.title} onChange={e => handleStageChange(index, 'title', e.target.value)} className={`${inputClass} font-semibold`} placeholder="Judul Tahapan"/>
                           <input value={stage.date} onChange={e => handleStageChange(index, 'date', e.target.value)} className={inputClass} placeholder="Tanggal"/>
                           <textarea value={stage.description} onChange={e => handleStageChange(index, 'description', e.target.value)} className={`${inputClass} md:col-span-2`} placeholder="Deskripsi Singkat" rows={2}/>
                           <input value={stage.formTitle || ''} onChange={e => handleStageChange(index, 'formTitle', e.target.value)} className={`${inputClass} md:col-span-2 font-medium`} placeholder="Judul Form Tugas (opsional)"/>
                           <textarea value={stage.formDescription || ''} onChange={e => handleStageChange(index, 'formDescription', e.target.value)} className={`${inputClass} md:col-span-2`} placeholder="Deskripsi/Instruksi Form (opsional)" rows={3}/>
                           <input value={stage.formViewUrl || ''} onChange={e => handleStageChange(index, 'formViewUrl', e.target.value)} className={inputClass} placeholder="Link Lihat Form (opsional)"/>
                           <input value={stage.formDownloadUrl || ''} onChange={e => handleStageChange(index, 'formDownloadUrl', e.target.value)} className={inputClass} placeholder="Link Unduh Form (opsional)"/>
                        </div>
                        { index === 0 &&
                            <div className="mt-3 pt-3 border-t dark:border-gray-700">
                               <p className="text-xs text-gray-500 dark:text-gray-400">
                                <i className="fas fa-info-circle mr-1"></i>
                                Tahap Administrasi tidak dapat dihapus. Status kelulusannya dikelola di halaman "Kelola User".
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