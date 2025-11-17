import React, { useState, useEffect, useCallback } from 'react';
import { getRegistrations, getSelectionStages, getAttendanceData, setAttendanceStatus } from '../../services/firebase';
import type { RegistrationData, SelectionStage, AdminPageProps } from '../../types';

declare const Html5QrcodeScanner: any;
declare const jspdf: any;
declare const XLSX: any;

interface Attendee extends RegistrationData {
    present: boolean;
}

const AdminAttendance: React.FC<AdminPageProps> = ({ showNotification }) => {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [scannerActive, setScannerActive] = useState(false);
    const [scanResult, setScanResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [regsData, stagesData, attendanceData] = await Promise.all([
                getRegistrations(),
                getSelectionStages(),
                getAttendanceData()
            ]);
            
            const stages = stagesData || [];
            const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
            
            const passedUsers = Object.values(regsData).filter(reg => 
                lastStage && reg.stageProgress?.[lastStage.id]?.status === 'lolos'
            );

            const attendeeList: Attendee[] = passedUsers.map(user => ({
                ...user,
                present: attendanceData[user.uid]?.present || false,
            }));

            setAttendees(attendeeList);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            showNotification('Gagal memuat data kehadiran.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!scannerActive) {
            setScanResult(null);
            return;
        }

        const qrCodeScanner = new Html5QrcodeScanner(
            "qr-reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        const onScanSuccess = async (decodedText: string) => {
            try {
                const data = JSON.parse(decodedText);
                const uid = data.uid;

                if (!uid) {
                    setScanResult({ message: 'QR Code tidak valid.', type: 'error' });
                    return;
                }

                setAttendees(currentAttendees => {
                    const userIndex = currentAttendees.findIndex(att => att.uid === uid);
                    if (userIndex === -1) {
                        setScanResult({ message: 'Peserta tidak ditemukan.', type: 'error' });
                        return currentAttendees;
                    }

                    const userToUpdate = currentAttendees[userIndex];
                    const newStatus = !userToUpdate.present;

                    setAttendanceStatus(uid, newStatus).catch(err => {
                        showNotification('Gagal update status di server.', 'error');
                        setAttendees(currentAttendees);
                    });
                    
                    setScanResult({ message: `Berhasil! ${userToUpdate.fullName} - ${newStatus ? 'Hadir' : 'Batal'}`, type: 'success' });
                    
                    const updatedAttendees = [...currentAttendees];
                    updatedAttendees[userIndex] = { ...userToUpdate, present: newStatus };
                    return updatedAttendees;
                });

            } catch (e) {
                setScanResult({ message: 'Gagal memproses QR Code.', type: 'error' });
            } finally {
                setTimeout(() => setScanResult(null), 3000);
            }
        };
        
        qrCodeScanner.render(onScanSuccess, (error: any) => {});

        return () => {
             if (qrCodeScanner && qrCodeScanner.getState() !== 1) { // 1 is NOT_STARTED
                qrCodeScanner.clear().catch((error: any) => console.error("Failed to clear scanner.", error));
            }
        };
    }, [scannerActive, showNotification]);
    
    const exportToPDF = () => {
        const doc = new jspdf.jsPDF();
        doc.text("Daftar Hadir Peserta Lolos", 14, 16);
        
        const head = [['No', 'Nama', 'Email', 'Status Kehadiran']];
        const body = attendees.map((att, i) => [
            i + 1,
            att.fullName,
            att.email,
            att.present ? 'Hadir' : 'Nonaktif'
        ]);

        doc.autoTable({
            startY: 22,
            head: head,
            body: body,
            headStyles: { fillColor: [11, 36, 71] },
        });
        doc.save(`Daftar Hadir.pdf`);
    };

    const exportToExcel = () => {
        const dataToExport = attendees.map(att => ({
            'Nama Lengkap': att.fullName,
            'Email': att.email,
            'Status Kehadiran': att.present ? 'Hadir' : 'Nonaktif',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Hadir");
        XLSX.writeFile(workbook, `Daftar Hadir.xlsx`);
    };

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Daftar Hadir Peserta Lolos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gunakan scanner untuk mencatat kehadiran atau unduh data.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={exportToPDF} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700"><i className="fas fa-file-pdf mr-2"></i>Unduh PDF</button>
                    <button onClick={exportToExcel} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700"><i className="fas fa-file-excel mr-2"></i>Unduh Excel</button>
                </div>
            </div>
            
            <div className="mb-6 bg-gray-50 dark:bg-brand-dark p-4 rounded-lg">
                {!scannerActive ? (
                    <button 
                        onClick={() => setScannerActive(true)}
                        className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-brand-accent"
                    >
                        <i className="fas fa-qrcode mr-2"></i>Mulai Scan Kehadiran
                    </button>
                ) : (
                    <div className="relative">
                        <div id="qr-reader" style={{ width: '100%' }}></div>
                        {scanResult && (
                             <div className={`absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-300 bg-black/70 rounded-md`}>
                                <div className={`text-center p-4 rounded-lg ${scanResult.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg`}>
                                    <i className={`fas ${scanResult.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} text-3xl mb-2`}></i>
                                    <p className="font-bold">{scanResult.message}</p>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => setScannerActive(false)}
                            className="mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700"
                        >
                            Tutup Scanner
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-brand-dark">
                        <tr className="text-gray-800 dark:text-gray-200">
                            <th className="p-3 font-semibold">#</th>
                            <th className="p-3 font-semibold">Nama</th>
                            <th className="p-3 font-semibold">Email</th>
                            <th className="p-3 font-semibold">Status Kehadiran</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center"><i className="fas fa-spinner fa-spin text-xl text-brand-secondary"></i></td></tr>
                        ) : attendees.length > 0 ? attendees.map((attendee, index) => (
                            <tr key={attendee.uid}>
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-medium">{attendee.fullName}</td>
                                <td className="p-3">{attendee.email}</td>
                                <td className="p-3">
                                    {attendee.present ? (
                                        <span className="px-2 py-1 rounded-full font-medium text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                            <i className="fas fa-check-circle mr-1"></i>Hadir
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full font-medium text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                            Nonaktif
                                        </span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">Belum ada peserta yang lolos seleksi akhir.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAttendance;