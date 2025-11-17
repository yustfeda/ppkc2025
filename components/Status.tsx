import React, { useState, useEffect } from 'react';
import type { User, RegistrationData, SelectionStage } from '../types';
import { getUserRegistration, getSelectionStages } from '../services/firebase';

declare const QRCode: any;
declare const jspdf: any;

interface StatusProps {
    user: User;
}

const Status: React.FC<StatusProps> = ({ user }) => {
    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [allStages, setAllStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [profilePic, setProfilePic] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [regData, stagesData] = await Promise.all([
                    getUserRegistration(user.uid),
                    getSelectionStages()
                ]);
                setRegistration(regData);
                setAllStages(stagesData);
                
                const storedPic = localStorage.getItem(`profilePic_${user.uid}`);
                if (storedPic) {
                    setProfilePic(storedPic);
                } else if (regData?.profilePictureUrl) {
                    setProfilePic(regData.profilePictureUrl);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.uid]);

    const getFinalStatus = (): 'lolos' | 'gagal' | 'pending' => {
        if (!registration) return 'pending';
        if (registration.status === 'Gagal') return 'gagal';

        // FIX: Added a check for `p` to prevent runtime errors if a stage progress entry is null.
        const hasFailedStage = registration.stageProgress && Object.values(registration.stageProgress).some((p: { status: 'lolos' | 'gagal' | 'pending' }) => p && p.status === 'gagal');
        if (hasFailedStage) return 'gagal';

        if (allStages.length > 0) {
            const lastStage = allStages[allStages.length - 1];
            if (registration.stageProgress?.[lastStage.id]?.status === 'lolos') {
                return 'lolos';
            }
        }
        return 'pending'; // In case selection is not fully completed
    };
    
    const handleDownloadProof = async () => {
        if (!registration) return;
        const doc = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [400, 650]
        });

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 400, 650, 'F');
        
        // Logo
        const logoGifUrl = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzFhMWl0Z2wxNnZpcG9sbDh5cDF2OHBjcTBhcTRrbm53bW5pNWhmOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/A6wzZDYl66nNU6ZCCq/giphy.gif";
        try {
            const response = await fetch(logoGifUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function() {
                const base64data = reader.result;
                if (typeof base64data === 'string') {
                     doc.addImage(base64data, 'GIF', 20, 20, 28, 28);
                }
                
                doc.setFont('Quicksand', 'bold');
                doc.setTextColor('#FF8C00'); // Orange
                doc.setFontSize(16);
                doc.text('PPKC', 55, 38);
        
                doc.setFont('Orbitron', 'bold');
                doc.setTextColor('#42A5F5'); // Blue
                doc.text('2025', 95, 38);
                
                generatePdfContent(doc);
            }
        } catch (e) {
            console.error("Could not load logo image for PDF", e);
            generatePdfContent(doc); // Proceed without logo
        }
    };
    
    const generatePdfContent = (doc: any) => {
        if (!registration) return;
        // Header text
        doc.setTextColor('#0B2447');
        doc.setFont('Inter', 'bold');
        doc.setFontSize(18);
        doc.text('BUKTI KELULUSAN SELEKSI', 200, 70, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('Inter', 'normal');
        doc.text('Paskibra Kec. Cileles 2025', 200, 90, { align: 'center' });

        const drawContent = () => {
            // User Info
            doc.setTextColor('#1A1A2E');
            doc.setFontSize(12);
            doc.setFont('Inter', 'bold');
            doc.text('No. Peserta', 30, 270);
            doc.setFont('Inter', 'normal');
            doc.text(`: ${registration.participantNumber || 'N/A'}`, 120, 270);

            doc.setFont('Inter', 'bold');
            doc.text('Nama', 30, 290);
            doc.setFont('Inter', 'normal');
            doc.text(`: ${registration.fullName}`, 120, 290);
            
            doc.setFont('Inter', 'bold');
            doc.text('Asal Satuan', 30, 310);
            doc.setFont('Inter', 'normal');
            doc.text(`: ${registration.originUnit}`, 120, 310);
            
            // QR Code generation
            const qrData = JSON.stringify({ uid: user.uid, name: registration.fullName, number: registration.participantNumber });
            const qrCodeUrl = QRCode.toDataURL(qrData, { width: 200, margin: 1 });
            
            doc.addImage(qrCodeUrl, 'PNG', (400 - 200) / 2, 340, 200, 200);

            // Footer text
            doc.setTextColor('#333333');
            doc.setFontSize(10);
            doc.text('Scan QR Code ini untuk verifikasi.', 200, 560, { align: 'center' });

            // Confidential footer
            doc.setFont('Inter', 'italic');
            doc.setFontSize(9);
            doc.setTextColor('#888888');
            doc.text('Dokumen Rahasia', 200, 630, { align: 'center' });

            doc.save(`bukti-lolos-${registration.participantNumber}-${registration.fullName}.pdf`);
        };
        
        if (profilePic) {
            const userImage = new Image();
            userImage.crossOrigin = "anonymous";
            userImage.onload = () => {
                const picSize = 120;
                const x = (400 - picSize) / 2;
                const y = 120;
                doc.addImage(userImage, x, y, picSize, picSize);
                drawContent();
            };
            userImage.onerror = () => {
                drawContent(); // Proceed without photo if it fails to load
            };
            userImage.src = profilePic;
        } else {
            drawContent();
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                <i className="fas fa-spinner fa-spin text-4xl text-brand-secondary"></i>
            </div>
        );
    }
    
    if (!registration || getFinalStatus() === 'pending') {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
                 <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Status Kelulusan</h1>
                 <p className="text-gray-600 dark:text-gray-400">Proses seleksi Anda masih berlangsung atau data tidak ditemukan.</p>
            </div>
        )
    }
    
    const finalStatus = getFinalStatus();
    const isLolos = finalStatus === 'lolos';

    return (
        <div className="bg-brand-light dark:bg-brand-dark min-h-[calc(100vh-5rem)] py-10 px-4 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white dark:bg-brand-primary rounded-xl shadow-2xl p-8 animate-fade-in">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                         {profilePic ? (
                            <img src={profilePic} alt="Foto Profil" className="w-full h-full object-cover" />
                        ) : (
                            <i className="fas fa-user text-5xl text-gray-400 dark:text-gray-500"></i>
                        )}
                    </div>
                    
                    <h1 className={`text-2xl font-bold uppercase ${isLolos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isLolos ? `SELAMAT, ANDA LOLOS!` : `MOHON MAAF, ANDA GAGAL!`}
                    </h1>
                     <p className="text-lg text-gray-800 dark:text-white font-medium">{registration.fullName}</p>
                </div>

                <div className="my-6 border-t border-b border-gray-200 dark:border-gray-700 py-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">No. Peserta</span>
                        <span className="text-gray-800 dark:text-white font-medium text-right">{registration.participantNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Asal Satuan</span>
                        <span className="text-gray-800 dark:text-white font-medium text-right">{registration.originUnit}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">TTL</span>
                        <span className="text-gray-800 dark:text-white font-medium text-right">{registration.birthPlace}, {new Date(registration.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                    {isLolos 
                        ? "Anda dinyatakan lolos seluruh tahapan seleksi menjadi anggota paskibra kec. cileles tahun 2026. Untuk info selanjutnya silahkan tunggu informasi dari penyelenggara."
                        : "Anda dinyatakan tidak lolos dan tidak dapat melanjutkan ke tahap selanjutnya, jangan patah semangat! Hari esok kita tidak tahu menahu maka berjuanglah."
                    }
                </p>

                {isLolos && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleDownloadProof}
                            className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-md hover:bg-brand-accent transition-colors"
                        >
                            <i className="fas fa-download mr-2"></i>Download Bukti Lolos
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Status;