import React, { useState } from 'react';
import type { ManagedButton, User } from '../types';
import { setFormSubmission } from '../services/firebase';

interface DynamicFormModalProps {
    button: ManagedButton;
    user: User | null;
    onClose: () => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
}

const DynamicFormModal: React.FC<DynamicFormModalProps> = ({ button, user, onClose, showNotification }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isClosing, setIsClosing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (button.includeInRecap) {
            if (!user) {
                showNotification('Anda harus login untuk mengirimkan form ini.', 'error');
                return;
            }
            try {
                await setFormSubmission(button.id, user.uid, user.email || 'N/A', formData);
            } catch (error) {
                console.error("Error saving form submission:", error);
                showNotification('Gagal mengirim form. Coba lagi.', 'error');
                return;
            }
        }
        
        console.log("Form submitted for button:", button.id, formData);
        showNotification('Form berhasil dikirim. Terima kasih!', 'success');
        handleClose();
    };
    
    const inputClass = "peer form-input p-3 border rounded text-sm w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-accent";
    const labelClass = "form-label text-sm text-gray-500 dark:text-gray-400";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1001] p-4" onClick={handleClose}>
            <div 
                className={`bg-brand-light dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-lg ${isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-white">{button.formTitle || 'Formulir'}</h3>
                    <button onClick={handleClose} className="btn-close-x text-gray-400">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {(button.formFields || []).map(field => (
                        <div key={field.id} className="relative input-group form-input-bg-darker">
                            {field.type === 'textarea' ? (
                                <textarea
                                    id={field.id}
                                    name={field.id}
                                    onChange={handleChange}
                                    required={field.required}
                                    className={inputClass}
                                    rows={4}
                                    placeholder=" "
                                />
                            ) : (
                                <input
                                    type="text"
                                    id={field.id}
                                    name={field.id}
                                    onChange={handleChange}
                                    required={field.required}
                                    className={inputClass}
                                    placeholder=" "
                                />
                            )}
                             <label htmlFor={field.id} className={labelClass}>
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
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