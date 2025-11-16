const DocumentCard: React.FC<{ doc: AnnouncementDocument }> = ({ doc }) => {
    return (
        <div className="bg-brand-light dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md flex flex-col overflow-hidden transition-transform hover:scale-105 duration-300">

            {/* THUMBNAIL FIX (FULL LEBAR, 16:9, OBJECT-COVER) */}
            {doc.thumbnailUrl && (
                <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-t-lg">
                    <img
                        src={doc.thumbnailUrl}
                        alt={doc.title}
                        className="absolute top-0 left-0 w-full h-full object-cover"
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
                {doc.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.description}
                    </p>
                ) : (
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