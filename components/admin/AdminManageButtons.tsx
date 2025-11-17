import React, { useState, useEffect } from 'react';
import { getManagedButtonsRealtime, setData } from '../../services/firebase';
import type { ManagedButton, FormField, AdminPageProps } from '../../types';

const AdminManageButtons: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [buttons, setButtons] = useState<ManagedButton[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getManagedButtonsRealtime().then(data => {
            setButtons(data || []);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        const buttonsToSave = buttons.filter(b => b.label.trim() !== '');
        await setData('managedButtons', buttonsToSave);
        setButtons(buttonsToSave);
        setLoading(false);
        showNotification('Perubahan tombol berhasil disimpan!', 'success');
    };

    const handleAddButton = () => {
        const newButton: ManagedButton = {
            id: `btn_${Date.now()}`,
            label: '',
            icon: 'fas fa-link',
            link: '#',
            formFields: [],
            showOnGuest: false,
            showOnUser: true,
        };
        setButtons([...buttons, newButton]);
    };

    const handleDeleteButton = (id: string) => {
        showConfirmation(
            'Anda yakin ingin menghapus tombol ini?',
            () => setButtons(buttons.filter(b => b.id !== id))
        );
    };

    const handleButtonChange = (index: number, field: keyof ManagedButton, value: any) => {
        const newButtons = [...buttons];
        (newButtons[index] as any)[field] = value;
        setButtons(newButtons);
    };

    const handleAddField = (buttonIndex: number) => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            label: '',
            type: 'text',
            required: false,
        };
        const newButtons = [...buttons];
        newButtons[buttonIndex].formFields = [...(newButtons[buttonIndex].formFields || []), newField];
        setButtons(newButtons);
    };

    const handleFieldChange = (buttonIndex: number, fieldIndex: number, field: keyof FormField, value: any) => {
        const newButtons = [...buttons];
        const fields = newButtons[buttonIndex].formFields || [];
        (fields[fieldIndex] as any)[field] = value;
        setButtons(newButtons);
    };

    const handleDeleteField = (buttonIndex: number, fieldId: string) => {
        const newButtons = [...buttons];
        newButtons[buttonIndex].formFields = (newButtons[buttonIndex].formFields || []).filter(f => f.id !== fieldId);
        setButtons(newButtons);
    };

    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";


    if (loading) return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola Tombol Navigasi</h1>
            <div className="space-y-4">
                {buttons.map((button, buttonIndex) => (
                    <div key={button.id} className="p-4 bg-gray-50 dark:bg-brand-dark rounded-lg shadow-sm form-input-bg-dark">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="relative input-group">
                                <input id={`label-${button.id}`} value={button.label} onChange={e => handleButtonChange(buttonIndex, 'label', e.target.value)} className={inputClass} placeholder=" " />
                                <label htmlFor={`label-${button.id}`} className={labelClass}>Label Tombol</label>
                            </div>
                            <div className="relative input-group">
                                <input id={`icon-${button.id}`} value={button.icon} onChange={e => handleButtonChange(buttonIndex, 'icon', e.target.value)} className={inputClass} placeholder=" " />
                                <label htmlFor={`icon-${button.id}`} className={labelClass}>Ikon (e.g., fas fa-link)</label>
                            </div>
                            <div className="relative input-group">
                                <input id={`link-${button.id}`} value={button.link} onChange={e => handleButtonChange(buttonIndex, 'link', e.target.value)} className={inputClass} placeholder=" " />
                                <label htmlFor={`link-${button.id}`} className={labelClass}>URL Link (jika bukan form)</label>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                            <h3 className="text-sm font-semibold dark:text-white mb-2">Pengaturan Tombol</h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                                <label className="flex items-center gap-2 text-sm dark:text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={!!button.showOnGuest} onChange={e => handleButtonChange(buttonIndex, 'showOnGuest', e.target.checked)} className="h-4 w-4 rounded text-brand-secondary focus:ring-brand-secondary"/>
                                    Tampil di Global Panel (Guest)
                                </label>
                                <label className="flex items-center gap-2 text-sm dark:text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={!!button.showOnUser} onChange={e => handleButtonChange(buttonIndex, 'showOnUser', e.target.checked)} className="h-4 w-4 rounded text-brand-secondary focus:ring-brand-secondary"/>
                                    Tampil di User Panel (Logged In)
                                </label>
                                {button.formFields && button.formFields.length > 0 && (
                                     <label className="flex items-center gap-2 text-sm dark:text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={!!button.includeInRecap} onChange={e => handleButtonChange(buttonIndex, 'includeInRecap', e.target.checked)} className="h-4 w-4 rounded text-brand-secondary focus:ring-brand-secondary"/>
                                        Sertakan data form di Rekap
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                            <h3 className="text-sm font-semibold dark:text-white mb-2">Form (Opsional)</h3>
                             <div className="relative input-group mb-4">
                                <input id={`form-title-${button.id}`} value={button.formTitle || ''} onChange={e => handleButtonChange(buttonIndex, 'formTitle', e.target.value)} className={`${inputClass}`} placeholder=" " />
                                <label htmlFor={`form-title-${button.id}`} className={labelClass}>Judul Form</label>
                             </div>
                            <div className="space-y-2">
                                {(button.formFields || []).map((field, fieldIndex) => (
                                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded form-input-bg-darkest">
                                        <div className="relative input-group">
                                            <input id={`field-label-${field.id}`} value={field.label} onChange={e => handleFieldChange(buttonIndex, fieldIndex, 'label', e.target.value)} className={inputClass} placeholder=" " />
                                            <label htmlFor={`field-label-${field.id}`} className={labelClass}>Label Field</label>
                                        </div>
                                         <div className="relative input-group">
                                            <select id={`field-type-${field.id}`} value={field.type} onChange={e => handleFieldChange(buttonIndex, fieldIndex, 'type', e.target.value)} className={inputClass}>
                                                <option value="text">Teks</option>
                                                <option value="textarea">Text Area</option>
                                            </select>
                                            <label htmlFor={`field-type-${field.id}`} className={labelClass}>Tipe Field</label>
                                        </div>
                                        <div className="flex items-center justify-end gap-4">
                                            <label className="flex items-center gap-2 text-sm dark:text-gray-300 cursor-pointer">
                                                <input type="checkbox" checked={field.required} onChange={e => handleFieldChange(buttonIndex, fieldIndex, 'required', e.target.checked)} className="h-4 w-4 rounded text-brand-secondary focus:ring-brand-secondary"/>
                                                Wajib
                                            </label>
                                            <button onClick={() => handleDeleteField(buttonIndex, field.id)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => handleAddField(buttonIndex)} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"><i className="fas fa-plus mr-1"></i>Tambah Field</button>
                            </div>
                        </div>
                        <div className="text-right mt-3">
                            <button onClick={() => handleDeleteButton(button.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"><i className="fas fa-trash"></i> Hapus Tombol Ini</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button onClick={handleAddButton} disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700">
                    <i className="fas fa-plus mr-2"></i>Tambah Tombol
                </button>
                <button onClick={handleSave} disabled={loading} className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent flex-grow">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Simpan Semua Perubahan'}
                </button>
            </div>
        </div>
    );
};

export default AdminManageButtons;