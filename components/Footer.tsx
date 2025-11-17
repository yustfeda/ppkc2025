import React, { useState, useEffect } from 'react';
import type { PublicPage } from '../types';

interface FooterProps {
    setCurrentPage: (page: PublicPage) => void;
    appVersion?: string;
}

const StaticLogo: React.FC = () => {
    return (
        <div className="flex-shrink-0 flex items-center cursor-pointer">
            <img 
                src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzFhMWl0Z2wxNnZpcG9sbDh5cDF2OHBjcTBhcTRrbm53bW5pNWhmOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/A6wzZDYl66nNU6ZCCq/giphy.gif"
                alt="Paskibra animation"
                className="h-7 mr-1"
            />
            <span className="text-xl font-bold">
                <span className="text-orange-500 font-quicksand tracking-wide">PPKC</span>
                <span className="text-brand-logo-blue font-orbitron">2025</span>
            </span>
        </div>
    );
};


const Footer: React.FC<FooterProps> = ({ setCurrentPage, appVersion }) => {
    return (
        <footer className="bg-brand-primary text-white">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div onClick={() => setCurrentPage('home')}>
                       <StaticLogo />
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
