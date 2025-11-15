import React from 'react';
import type { PublicPage } from '../types';

interface FooterProps {
    setCurrentPage: (page: PublicPage) => void;
    appVersion?: string;
}

const Logo: React.FC = () => (
    <div className="flex-shrink-0 flex items-center cursor-pointer">
        <span className="text-xl font-bold">
            <span className="text-orange-500">PPKC</span>
            <span className="text-brand-logo-blue">2025</span>
        </span>
    </div>
);

const Footer: React.FC<FooterProps> = ({ setCurrentPage, appVersion }) => {
    return (
        <footer className="bg-brand-primary text-white">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div onClick={() => setCurrentPage('home')}>
                       <Logo />
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-xs text-gray-300">
                            &copy; {new Date().getFullYear()} Purna Paskibraka Kecamatan Cileles. All Rights Reserved. {appVersion && `| ${appVersion}`}
                        </p>
                        <div className="mt-3 flex justify-center md:justify-end space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-youtube"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;