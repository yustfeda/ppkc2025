import React, { useState, useEffect } from 'react';
import { getAnnouncements } from '../services/firebase';
import type { AnnouncementDocument } from '../types';

const DocumentCard: React.FC<{ doc: AnnouncementDocument }> = ({ doc }) => {
    return (
        <div className="bg-brand-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md flex flex-col overflow-hidden transition-transform hover:scale-105 duration-300">

            {/* FOTO FIT & TIDAK PECAH */}
            {doc.thumbnailUrl && (
                <div className="relative w-full h-48 md:h-56 overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <img 
                        src={doc.thumbnailUrl}
                        alt={doc.title}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}

            {/* JUDUL */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-brand-dark dark:text-white">
                    {doc.title}
                </h3>
            </div>
            
            {/* DESKRIPSI */}
            <div className="p-4 flex-grow">
                {doc.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.description}
                    </p>
                )}
                
                {(!doc.thumbnailUrl && !doc.description) && (
                    <p className="text-sm text-gray-400 italic">
                        Tidak ada detail tambahan.
                    </p>
                )}
            </div>

            {/* BUTTON FILE */}
            {doc.fileUrl && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-center gap-3 mt-auto">
                    <a 
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-brand-secondary text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                        <i className="fas fa-external-link-alt mr-2"></i>Buka
                    </a>

                    <a 
                        href={doc.fileUrl}
                        download
                        className="flex-1 text-center bg-gray-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors text-sm"
                    >
                        <i className="fas fa-download mr-2"></i>Download
                    </a>
                </div>
            )}
        </div>
    );
};

const Announcements: React.FC = () => {
    const [documents, setDocuments] = useState<AnnouncementDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            const data = await getAnnouncements();
            setDocuments(data);
            setLoading(false);
        };
        fetchDocs();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-100 dark:bg-brand-dark min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-brand-dark dark:text-gray-100">
                        Pengumuman
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                        Informasi resmi terkait jadwal seleksi, latihan, perubahan data,
                        dan pengumuman tahap setiap proses. Silakan cek secara berkala.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {documents.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Announcements;