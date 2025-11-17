import React, { useState, useEffect } from 'react';
import type { User, RegistrationData, SelectionStage } from '../types';
import { getUserRegistration, getSelectionStages } from '../services/firebase';

declare const QRCode: any;

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
    
    const handleDownloadProof = () => {
        if (!registration) return;
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 550;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0B2447';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BUKTI KELULUSAN SELEKSI', canvas.width / 2, 40);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('Paskibra Kec. Cileles 2025', canvas.width / 2, 70);

        // User Info
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1A1A2E';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('Nama', 30, 110);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`: ${registration.fullName}`, 120, 110);
        
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('Asal Satuan', 30, 140);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`: ${registration.originUnit}`, 120, 140);
        
        // QR Code
        const qrData = JSON.stringify({ uid: user.uid, name: registration.fullName });
        QRCode.toDataURL(qrData, { width: 250, margin: 2 }, (err: any, url: string) => {
            if (err) {
                console.error(err);
                return;
            }
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, (canvas.width - 250) / 2, 180, 250, 250);
                
                // Footer text
                ctx.textAlign = 'center';
                ctx.fillStyle = '#333';
                ctx.font = '12px Inter, sans-serif';
                ctx.fillText('Scan QR Code ini untuk verifikasi kehadiran.', canvas.width / 2, 460);
                
                // Trigger download
                const link = document.createElement('a');
                link.download = `bukti-lolos-${registration.fullName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
            img.src = url;
        });
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