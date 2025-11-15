import React from 'react';

interface AdminFooterProps {
    appVersion?: string;
}

const AdminFooter: React.FC<AdminFooterProps> = ({ appVersion }) => {
    return (
        <footer className="bg-brand-primary text-white mt-auto">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2">
                    <p className="text-xs text-gray-300">
                        Admin Panel | &copy; {new Date().getFullYear()} Purna Paskibra Kecamatan Cileles.
                    </p>
                    {appVersion && (
                        <p className="text-xs text-gray-400">
                            Version {appVersion}
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default AdminFooter;