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
                resolve(null);
                return;
            }
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        } catch {
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
                if (storedPic) setProfilePic(storedPic);
                else if (regData?.profilePictureUrl) setProfilePic(regData.profilePictureUrl);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.uid]);

    const getFinalStatus = (): 'lolos' | 'gagal' | 'pending' => {
        if (!registration) return 'pending';
        if (registration.status === 'Gagal') return 'gagal';

        const hasFailedStage =
            registration.stageProgress &&
            Object.values(registration.stageProgress).some(
                (p: any) => p && p.status === 'gagal'
            );
        if (hasFailedStage) return 'gagal';

        if (allStages.length > 0) {
            const lastStage = allStages[allStages.length - 1];
            if (registration.stageProgress?.[lastStage.id]?.status === 'lolos') {
                return 'lolos';
            }
        }
        return 'pending';
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

            const logoUrl = adminConfig?.proofOfPassing?.logoUrl;
            const logoData = logoUrl ? await imageUrlToBase64(logoUrl) : null;

            // ===== HEADER =====
            if (logoData) {
                const logoHeight = 20;
                const logoWidth = 20;
                const logoX = 20;

                doc.addImage(logoData, 'PNG', logoX, currentY, logoWidth, logoHeight);

                const textX = logoX + logoWidth + 5;
                const textY = currentY + 5;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor('#0B2447');
                doc.text("PANITIA SELEKSI", textX, textY + 2);

                doc.setFontSize(14);
                doc.setTextColor('#1B5E20'); // hijau agak tua
                doc.text("PURNA PASKIBRA INDONESIA KECAMATAN CILELES", textX, textY + 9);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(90);
                doc.text(
                    "Jl. Raya Gunungkencana-Cileles km. 25",
                    textX,
                    textY + 14
                );

                currentY += logoHeight + 8;
            } else {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor('#0B2447');
                doc.text("PANITIA SELEKSI", 105, currentY + 5, { align: 'center' });

                doc.setFontSize(14);
                doc.setTextColor('#1B5E20'); // hijau agak tua
                doc.text(
                    "PURNA PASKIBRA INDONESIA KECAMATAN CILELES",
                    105,
                    currentY + 12,
                    { align: 'center' }
                );

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(90);
                doc.text(
                    "Jl. Raya Gunungkencana-Cileles km. 25",
                    105,
                    currentY + 17,
                    { align: 'center' }
                );

                currentY += 20;
            }

            // Garis
            doc.setLineWidth(1);
            doc.line(20, currentY, 190, currentY);
            currentY += 15;

            // ===== ISI DOKUMEN (TIDAK DIUBAH) =====
            const passingStatement =
                adminConfig?.proofOfPassing?.passingStatement ||
                'SELAMAT ANDA DINYATAKAN LOLOS SELEKSI PENERIMAAN PASKIBRA KECAMATAN CILELES TAHUN {year}';

            const finalStatement = passingStatement.replace(
                '{year}',
                new Date().getFullYear().toString()
            );

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(finalStatement, 105, currentY, { align: 'center', maxWidth: 170 });

            doc.save(`bukti-lolos-${registration.participantNumber}-${registration.fullName}.pdf`);
            showNotification('Bukti Lolos berhasil diunduh.', 'success');

        } catch {
            showNotification('Gagal membuat PDF.', 'error');
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
        return null;
    }

    const isLolos = getFinalStatus() === 'lolos';

    return (
        <div className="text-center">
            {isLolos && (
                <button onClick={handleDownloadPdfProof}>
                    Download Bukti Lolos
                </button>
            )}
        </div>
    );
};

export default Status;