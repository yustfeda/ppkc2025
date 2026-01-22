import React, { useState, useEffect } from 'react';
import type { User, RegistrationData, SelectionStage, AdminConfig } from '../types';
import { getUserRegistration, getSelectionStages } from '../services/firebase';

declare const QRCode: any;
declare const jspdf: any;

const imageUrlToBase64 = (url: string): Promise<string | null> => {
    return new Promise(async (resolve) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch image: ${response.statusText}`);
                resolve(null);
                return;
            }
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                resolve(null);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            resolve(null);
        }
    });
};

interface StatusProps {
    user: User;
    adminConfig: AdminConfig | null;
    showNotification: (message: string, type: 'success' | 'error') => void;
}

const Status: React.FC<StatusProps> = ({ user, adminConfig, showNotification }) => {
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
                    // Fallback for old data, new data won't have this
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
            showNotification('Data pendaftaran tidak ditemukan.', 'error');
            return;
        }

        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            let currentY = 20;

            // --- PILIHAN WARNA BACKGROUND KERTAS ---
            // Silakan ganti kode hex di bawah ini (e.g. #FDF5E6) untuk mengubah warna background kertas
            const PAGE_BG_COLOR = '#FFFFFF'; 
            if (PAGE_BG_COLOR !== '#FFFFFF') {
                doc.setFillColor(PAGE_BG_COLOR);
                doc.rect(0, 0, 210, 297, 'F');
            }

            const logoUrl = adminConfig?.proofOfPassing?.logoUrl;
            const logoData = logoUrl ? await imageUrlToBase64(logoUrl) : null;

            // --- Header ---
            if (logoData) {
                try {
                    const logoHeight = 20;
                    const logoWidth = 20; 
                    const logoX = 20;
                    doc.addImage(logoData, 'PNG', logoX, currentY, logoWidth, logoHeight);

                    const textX = logoX + logoWidth + 5;
                    const textY = currentY + 5; // Vertically center text with logo
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(18);
                    doc.setTextColor('#0B2447');
                    doc.text("PANITIA SELEKSI", textX, textY + 2);
                    
                    doc.setFontSize(13);
                    doc.setTextColor('#006400'); // Hijau Tua
                    doc.text("PURNA PASKIBRA INDONESIA KECAMATAN CILELES", textX, textY + 9);

                    doc.setFontSize(8);
                    doc.setTextColor(0, 0, 0); // Hitam
                    doc.setFont('helvetica', 'italic');
                    doc.text("Jl. Raya Cileles-Gunungkencana Km. 25", textX, textY + 14);
                    doc.setFont('helvetica', 'bold'); // Reset font ke bold untuk konten selanjutnya
                    
                    currentY += logoHeight + 5;
                } catch(e) {
                    // Fallback to centered text if addImage fails
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(18);
                    doc.setTextColor('#0B2447');
                    doc.text("PANITIA SELEKSI", 105, currentY + 5, { align: 'center' });
                    doc.setFontSize(13);
                    doc.setTextColor('#006400'); // Hijau Tua
                    doc.text("PURNA PASKIBRA INDONESIA KECAMATAN CILELES", 105, currentY + 12, { align: 'center' });
                    doc.setFontSize(8);
                    doc.setTextColor(0, 0, 0); // Hitam
                    doc.setFont('helvetica', 'italic');
                    doc.text("Jl. Raya Cileles-Gunungkencana Km. 25", 105, currentY + 17, { align: 'center' });
                    doc.setFont('helvetica', 'bold');
                    currentY += 20 + 5;
                }
            } else {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor('#0B2447');
                doc.text("PANITIA SELEKSI", 105, currentY + 5, { align: 'center' });
                doc.setFontSize(13);
                doc.setTextColor('#006400'); // Hijau Tua
                doc.text("PURNA PASKIBRA INDONESIA KECAMATAN CILELES", 105, currentY + 12, { align: 'center' });
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0); // Hitam
                doc.setFont('helvetica', 'italic');
                doc.text("Jl. Raya Cileles-Gunungkencana Km. 25", 105, currentY + 17, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                currentY += 20 + 5;
            }
            
            // Line
            doc.setLineWidth(1);
            doc.line(20, currentY, 190, currentY);
            currentY += 15;

            // --- Main Title ---
            const passingStatement = adminConfig?.proofOfPassing?.passingStatement || 'SELAMAT ANDA DINYATAKAN LOLOS SELEKSI PENERIMAAN PASKIBRA KECAMATAN CILELES TAHUN {year}';
            const finalStatement = passingStatement.replace('{year}', new Date().getFullYear().toString());
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(finalStatement, 105, currentY, { align: 'center', maxWidth: 170 });
            currentY += 15;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text("BUKTI LOLOS SELEKSI", 105, currentY, { align: 'center' });
            currentY += 20;
            
            // --- Participant Data & Photo ---
            const dataStartY = currentY;
            const photoX = 30;
            const photoY = dataStartY;
            const photoWidth = 30;
            const photoHeight = 40;

            // Photo (no border)
            if (profilePic) {
                try {
                    const imageType = profilePic.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
                    doc.addImage(profilePic, imageType, photoX, photoY, photoWidth, photoHeight);
                } catch (e) {
                    console.error("Could not add profile picture to PDF.", e);
                    doc.text("Foto", photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center', baseline: 'middle' });
                }
            } else {
                 doc.text("Foto", photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center', baseline: 'middle' });
            }

            // Data
            const dataPairs = [
                ["NAMA LENGKAP", registration.fullName],
                ["NO PESERTA", registration.participantNumber || 'N/A'],
                ["TEMPAT, TGL LAHIR", `${registration.birthPlace}, ${new Date(registration.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
                ["ASAL SATUAN", registration.originUnit],
                ["JENIS KELAMIN", registration.gender],
            ];
            
            const dataX = photoX + photoWidth + 15; // Positioned next to photo
            let dataY = dataStartY + 3; // Adjust text block down slightly to align top with photo top
            const labelWidth = 40;

            doc.setFontSize(10);
            dataPairs.forEach(([label, value]) => {
                doc.setFont('helvetica', 'normal');
                doc.text(label, dataX, dataY, { align: 'left' });
                doc.text(":", dataX + labelWidth, dataY);
                doc.setFont('helvetica', 'bold');
                doc.text(value, dataX + labelWidth + 3, dataY);
                dataY += 8;
            });
            
            currentY = dataStartY + photoHeight + 20; // Position below the info section

            // --- QR Code ---
            const qrBoxSize = 40;
            const qrBoxX = (210 - qrBoxSize) / 2;
            
            // QR code (no border)
            const qrData = JSON.stringify({ uid: user.uid, name: registration.fullName, number: registration.participantNumber });
            const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 256, margin: 1 });
            doc.addImage(qrCodeUrl, 'PNG', qrBoxX, currentY, qrBoxSize, qrBoxSize);
            
            currentY += qrBoxSize + 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text("Pindai qr code ini untuk verifikasi kehadiran", 105, currentY, { align: 'center' });

            // --- Footer ---
            const pageHeight = doc.internal.pageSize.height;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(100);
            const footerText = "Dokumen ini bersifat rahasia, kerusakan dan kehilangan jadi tanggung jawab peserta";
            doc.text(footerText, 105, pageHeight - 15, { align: 'center' });

            doc.save(`bukti-lolos-${registration.participantNumber}-${registration.fullName}.pdf`);
            showNotification('Bukti Lolos berhasil diunduh.', 'success');

        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            showNotification('Terjadi kesalahan saat membuat file PDF. Silakan coba lagi.', 'error');
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
                        ? "Anda dinyatakan lolos seluruh tahapan seleksi. Untuk info selanjutnya silahkan tunggu informasi dari penyelenggara."
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