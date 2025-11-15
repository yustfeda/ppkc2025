import React, { useState } from 'react';
import type { ManagedButton } from '../types';

interface DynamicFormModalProps {
    button: ManagedButton;
    onClose: () => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
}

const DynamicFormModal: React.FC<DynamicFormModalProps> = ({ button, onClose, showNotification }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real application, you would send this data to a server or Firebase.
        console.log("Form submitted for button:", button.id, formData);
        showNotification('Form berhasil dikirim. Terima kasih!', 'success');
        onClose();
    };
    
    const inputClass = "p-2 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
            <div className="bg-brand-light dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-white">{button.formTitle || 'Formulir'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {(button.formFields || []).map(field => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    name={field.id}
                                    onChange={handleChange}
                                    required={field.required}
                                    className={inputClass}
                                    rows={4}
                                />
                            ) : (
                                <input
                                    type="text"
                                    name={field.id}
                                    onChange={handleChange}
                                    required={field.required}
                                    className={inputClass}
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md text-sm hover:bg-brand-accent">
                            Kirim
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DynamicFormModal;
