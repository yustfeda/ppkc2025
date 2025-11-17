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
    
    const handleDownloadPdfProof = async () => {
        if (!registration) {
            alert('Data pendaftaran tidak ditemukan.');
            return;
        }

        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // --- Title ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(32);
            doc.setTextColor('#FF8C00'); // Orange
            doc.text('PPKC', 80, 25);
            doc.setTextColor('#42A5F5'); // Blue
            doc.text('2025', 115, 25);

            // --- Subtitle ---
            doc.setFontSize(18);
            doc.setTextColor('#0B2447');
            doc.text('BUKTI KELULUSAN SELEKSI', 105, 40, { align: 'center' });
            doc.setDrawColor(200, 200, 200);
            doc.line(30, 45, 180, 45); // line separator

            // --- Profile Picture ---
            if (profilePic) {
                try {
                    doc.addImage(profilePic, 'PNG', 30, 55, 40, 40);
                    doc.setDrawColor(11, 36, 71);
                    doc.setLineWidth(0.5);
                    doc.rect(30, 55, 40, 40); // Border
                } catch (e) {
                    console.error("Could not add profile picture to PDF.", e);
                }
            }

            // --- User Details with AutoTable ---
            const detailsStartY = 55;
            (doc as any).autoTable({
                startY: detailsStartY,
                margin: { left: 80 },
                theme: 'plain',
                styles: { fontSize: 11, cellPadding: 2 },
                head: [],
                body: [
                    ['Nama Lengkap', `: ${registration.fullName}`],
                    ['No. Peserta', `: ${registration.participantNumber || 'N/A'}`],
                    ['Jenis Kelamin', `: ${registration.gender}`],
                    ['Tanggal Lahir', `: ${registration.birthPlace}, ${new Date(registration.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
                    ['Asal Satuan', `: ${registration.originUnit}`],
                ],
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 35 },
                    1: { cellWidth: 'auto' },
                }
            });

            // --- QR Code ---
            const qrData = JSON.stringify({ uid: user.uid, name: registration.fullName, number: registration.participantNumber });
            const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 256, margin: 1 });
            const qrY = (doc as any).lastAutoTable.finalY + 20 > 110 ? (doc as any).lastAutoTable.finalY + 20 : 110;
            doc.addImage(qrCodeUrl, 'PNG', 75, qrY, 60, 60);

            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('Pindai QR Code ini untuk verifikasi kehadiran.', 105, qrY + 65, { align: 'center' });

            doc.save(`bukti-lolos-${registration.participantNumber}-${registration.fullName}.pdf`);

        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            alert('Terjadi kesalahan saat membuat file PDF. Silakan coba lagi.');
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
                            onClick={handleDownloadPdfProof}
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