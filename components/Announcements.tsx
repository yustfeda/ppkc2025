import React, { useState, useEffect } from 'react';
import { getAnnouncements } from '../services/firebase';
import type { AnnouncementDocument } from '../types';

const DocumentCard: React.FC<{ doc: AnnouncementDocument }> = ({ doc }) => {
    
    const convertGoogleDriveLink = (url: string) => {
        const regex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
        return url;
    };

    const downloadUrl = doc.fileUrl ? convertGoogleDriveLink(doc.fileUrl) : '#';

    const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (downloadUrl.startsWith('https://drive.google.com/uc?export=download')) {
            e.preventDefault();
            
            const oldIframe = document.getElementById('gdrive-downloader');
            if (oldIframe) {
                oldIframe.remove();
            }

            const iframe = document.createElement('iframe');
            iframe.id = 'gdrive-downloader';
            iframe.style.display = 'none';
            iframe.src = downloadUrl;
            document.body.appendChild(iframe);
        }
    };

    return (
        <div className="bg-brand-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md flex flex-col overflow-hidden transition-transform hover:scale-105 duration-300">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-brand-dark dark:text-white">{doc.title}</h3>
            </div>
            
            <div className="p-4 flex-grow">
                {doc.thumbnailUrl && (
                     <div className="mb-4 h-40 bg-gray-200 dark:bg-gray-700 rounded-md flex justify-center items-center">
                        <img
                            src={doc.thumbnailUrl}
                            alt={doc.title}
                            className="max-w-full max-h-full"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                )}
                {doc.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
                )}
                 {(!doc.thumbnailUrl && !doc.description) && (
                    <p className="text-sm text-gray-400 italic">Tidak ada detail tambahan.</p>
                )}
            </div>

            {doc.fileUrl && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-center gap-3 mt-auto">
                     <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-brand-secondary text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors text-sm">
                        <i className="fas fa-external-link-alt mr-2"></i>Buka
                    </a>
                     <a href={downloadUrl} onClick={handleDownload} download className="flex-1 text-center bg-gray-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors text-sm">
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
                    <h1 className="text-4xl font-bold text-brand-dark dark:text-gray-100">Pengumuman</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Informasi dan dokumen penting terkait proses seleksi.</p>
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