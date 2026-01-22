import React, { useState, useEffect } from 'react';
import { getAnnouncements } from '../services/firebase';
import type { AnnouncementDocument } from '../types';

// Improved Cached Image Helper with loading state and sync logic
const CachedImage: React.FC<{ src: string; alt: string; className: string; id: string }> = ({ src, alt, className, id }) => {
    const [imgSrc, setImgSrc] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
        const cacheKey = `ann_img_cache_${id}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached && cached === src) {
            setImgSrc(cached);
        } else {
            if (src) {
                try {
                    localStorage.setItem(cacheKey, src);
                } catch (e) {}
            }
            setImgSrc(src);
        }
    }, [src, id]);

    return (
        <div className={`relative ${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden`}>
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 animate-pulse">
                    <div className="w-8 h-8 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            {imgSrc && (
                <img 
                    src={imgSrc} 
                    alt={alt} 
                    className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 ease-in-out`} 
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none'; 
                        setIsLoaded(true); 
                    }} 
                />
            )}
        </div>
    );
};

const DocumentCard: React.FC<{ doc: AnnouncementDocument; showNotification: (message: string, type: 'success' | 'error') => void; }> = ({ doc, showNotification }) => {
    
    const convertGoogleDriveLink = (url: string) => {
        if (!url || url === '#') return '#';
        
        // 1. Format Standar File (PDF, Image, Zip, etc.) - /file/d/[ID]/view
        const fileDRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const fileDMatch = url.match(fileDRegex);
        if (fileDMatch && fileDMatch[1]) {
            return `https://drive.google.com/uc?export=download&id=${fileDMatch[1]}`;
        }

        // 2. Format Open Link - ?id=[ID]
        const idRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
        const idMatch = url.match(idRegex);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
        }

        // 3. Format Google Docs
        if (url.includes('docs.google.com/document/d/')) {
            const docId = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (docId) return `https://docs.google.com/document/d/${docId}/export?format=pdf`;
        }

        // 4. Format Google Sheets
        if (url.includes('docs.google.com/spreadsheets/d/')) {
            const sheetId = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (sheetId) return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
        }

        // 5. Format Google Slides
        if (url.includes('docs.google.com/presentation/d/')) {
            const slideId = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (slideId) return `https://docs.google.com/presentation/d/${slideId}/export/pdf`;
        }

        return url;
    };
    
    const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        showNotification('File sedang diunduh secara otomatis...', 'success');
        // Tidak perlu e.preventDefault() karena kita ingin browser memproses link unduh tersebut
    };

    const downloadUrl = doc.fileUrl ? convertGoogleDriveLink(doc.fileUrl) : '#';

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex flex-col overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 duration-300">
            {/* Image at the very top, full width */}
            {doc.thumbnailUrl && (
                <div className="w-full h-40 sm:h-52 bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                    <CachedImage
                        id={doc.id}
                        src={doc.thumbnailUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                <h3 className="font-bold text-lg text-brand-dark dark:text-white line-clamp-2">{doc.title}</h3>
            </div>
            
            <div className="p-5 flex-grow">
                {doc.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{doc.description}</p>
                ) : (
                    <p className="text-sm text-gray-400 italic">Tidak ada detail tambahan.</p>
                )}
            </div>

            {doc.fileUrl && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3 mt-auto">
                     <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-white dark:bg-gray-700 text-brand-secondary dark:text-white border border-brand-secondary dark:border-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-brand-secondary hover:text-white transition-all text-sm shadow-sm">
                        <i className="fas fa-external-link-alt mr-2"></i>Buka
                    </a>
                     <a href={downloadUrl} download onClick={handleDownloadClick} className="flex-1 text-center bg-brand-secondary text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-accent transition-all text-sm shadow-md">
                        <i className="fas fa-download mr-2"></i>Unduh
                    </a>
                </div>
            )}
        </div>
    );
};

const Announcements: React.FC<{ showNotification: (message: string, type: 'success' | 'error') => void; }> = ({ showNotification }) => {
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
        <div className="bg-brand-light dark:bg-brand-dark min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark dark:text-gray-100 tracking-tight">Pengumuman</h1>
                    <div className="w-20 h-1.5 bg-brand-secondary mx-auto mt-4 rounded-full"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
                        Informasi resmi, dokumen penting, dan panduan terkait proses seleksi Paskibraka.
                    </p>
                </div>
                {documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {documents.map(doc => (
                            <DocumentCard key={doc.id} doc={doc} showNotification={showNotification} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                        <i className="fas fa-folder-open text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <p className="text-gray-500 dark:text-gray-400">Belum ada pengumuman saat ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Announcements;