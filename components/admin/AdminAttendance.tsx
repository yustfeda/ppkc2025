import React, { useState, useEffect, useCallback } from 'react';
import { getRegistrations, getSelectionStages, getDailyAttendanceData, setDailyAttendanceStatus } from '../../services/firebase';
import type { RegistrationData, SelectionStage, AdminPageProps } from '../../types';

declare const Html5QrcodeScanner: any;
declare const jspdf: any;
declare const XLSX: any;

interface Attendee extends RegistrationData {
    presentCount: number;
    lastTimestamp?: number;
}

const AdminAttendance: React.FC<AdminPageProps> = ({ showNotification }) => {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [scannerActive, setScannerActive] = useState(false);
    const [scanResult, setScanResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [regsData, stagesData] = await Promise.all([
                getRegistrations(),
                getSelectionStages()
            ]);
            
            const stages = stagesData || [];
            const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
            
            const passedUsers = Object.values(regsData).filter(reg => 
                lastStage && reg.stageProgress?.[lastStage.id]?.status === 'lolos'
            );
            
            const date = new Date(selectedDate + 'T00:00:00Z');
            let datesToFetch: string[] = [];
            if (viewType === 'daily') {
                datesToFetch.push(selectedDate);
            } else if (viewType === 'weekly') {
                const dayOfWeek = date.getUTCDay();
                const startOfWeek = new Date(date);
                startOfWeek.setUTCDate(date.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday as start of week
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setUTCDate(startOfWeek.getUTCDate() + i);
                    datesToFetch.push(d.toISOString().split('T')[0]);
                }
            } else { // monthly
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                     const d = new Date(Date.UTC(year, month, i));
                     datesToFetch.push(d.toISOString().split('T')[0]);
                }
            }
            
            const attendancePromises = datesToFetch.map(d => getDailyAttendanceData(d));
            const allAttendanceData = await Promise.all(attendancePromises);

            const aggregatedAttendance: { [uid: string]: { count: number; lastTimestamp?: number } } = {};
            
            allAttendanceData.forEach(dailyData => {
                for (const uid in dailyData) {
                    if (dailyData[uid].present) {
                        if (!aggregatedAttendance[uid]) {
                            aggregatedAttendance[uid] = { count: 0, lastTimestamp: 0 };
                        }
                        aggregatedAttendance[uid].count++;
                        if (dailyData[uid].timestamp > (aggregatedAttendance[uid].lastTimestamp || 0)) {
                           aggregatedAttendance[uid].lastTimestamp = dailyData[uid].timestamp;
                        }
                    }
                }
            });

            const attendeeList: Attendee[] = passedUsers.map(user => ({
                ...user,
                presentCount: aggregatedAttendance[user.uid]?.count || 0,
                lastTimestamp: aggregatedAttendance[user.uid]?.lastTimestamp
            })).sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));


            setAttendees(attendeeList);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            showNotification('Gagal memuat data kehadiran.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification, selectedDate, viewType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!scannerActive) {
            setScanResult(null);
            return;
        }

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            videoConstraints: {
                facingMode: cameraFacingMode
            }
        };

        const qrCodeScanner = new Html5QrcodeScanner(
            "qr-reader", 
            config,
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
                
                const allRegs = await getRegistrations();
                const userToUpdate = allRegs[uid];

                if (!userToUpdate) {
                    setScanResult({ message: 'Peserta tidak ditemukan di database.', type: 'error' });
                    return;
                }
                
                // Check current attendance status for the selected date
                const dailyAttendance = await getDailyAttendanceData(selectedDate);
                const isCurrentlyPresent = dailyAttendance[uid]?.present === true;

                // Toggle status
                if (isCurrentlyPresent) {
                    // If present, mark as absent (remove record)
                    await setDailyAttendanceStatus(selectedDate, uid, false);
                    setScanResult({ message: `Berhasil! ${userToUpdate.fullName || ''} ditandai Tidak Hadir (nonaktif).`, type: 'success' });
                } else {
                    // If not present, mark as present
                    await setDailyAttendanceStatus(selectedDate, uid, true);
                    setScanResult({ message: `Berhasil! ${userToUpdate.fullName || ''} ditandai Hadir.`, type: 'success' });
                }
                
                fetchData();

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
    }, [scannerActive, showNotification, selectedDate, fetchData, cameraFacingMode]);
    
    const exportToPDF = () => {
        const doc = new jspdf.jsPDF();
        const viewName = viewType.charAt(0).toUpperCase() + viewType.slice(1);
        doc.text(`Daftar Hadir Peserta (${viewName}) - ${selectedDate}`, 14, 16);
        
        const head = [['No', 'Nama', 'Email', 'Total Kehadiran', 'Terakhir Hadir']];
        const body = attendees.map((att, i) => [
            i + 1,
            att.fullName,
            att.email,
            `${att.presentCount} hari`,
            att.lastTimestamp ? new Date(att.lastTimestamp).toLocaleString('id-ID') : '-'
        ]);

        doc.autoTable({
            startY: 22,
            head: head,
            body: body,
            headStyles: { fillColor: [11, 36, 71] },
        });
        doc.save(`Daftar Hadir ${viewName} - ${selectedDate}.pdf`);
    };

    const exportToExcel = () => {
        const dataToExport = attendees.map(att => ({
            'Nama Lengkap': att.fullName,
            'Email': att.email,
            'Total Kehadiran (hari)': att.presentCount,
            'Terakhir Hadir': att.lastTimestamp ? new Date(att.lastTimestamp).toLocaleString('id-ID') : '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Hadir");
        const viewName = viewType.charAt(0).toUpperCase() + viewType.slice(1);
        XLSX.writeFile(workbook, `Daftar Hadir ${viewName} - ${selectedDate}.xlsx`);
    };

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Daftar Hadir Peserta Lolos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gunakan scanner untuk mencatat kehadiran atau unduh data.</p>
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                     <select value={viewType} onChange={e => setViewType(e.target.value as any)} className="p-2 border rounded-md text-sm bg-white dark:bg-brand-dark dark:border-gray-600 dark:text-white">
                        <option value="daily">Harian</option>
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                    </select>
                    <input type="date" id="attendance-date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border rounded-md text-sm bg-white dark:bg-brand-dark dark:border-gray-600 dark:text-white" />
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={exportToPDF} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700"><i className="fas fa-file-pdf mr-2"></i>Unduh PDF</button>
                <button onClick={exportToExcel} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700"><i className="fas fa-file-excel mr-2"></i>Unduh Excel</button>
            </div>
            
            {viewType === 'daily' && (
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
                             <div className="mt-4 flex flex-wrap gap-4">
                                <button 
                                    onClick={() => setScannerActive(false)}
                                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700"
                                >
                                    Tutup Scanner
                                </button>
                                <button
                                    onClick={() => setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                                    className="bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-600"
                                    title="Switch Camera"
                                >
                                    <i className="fas fa-camera-rotate mr-2"></i>Ganti Kamera
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}


            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-brand-dark">
                        <tr className="text-gray-800 dark:text-gray-200">
                            <th className="p-3 font-semibold">#</th>
                            <th className="p-3 font-semibold">Nama</th>
                            <th className="p-3 font-semibold">Total Hadir</th>
                            <th className="p-3 font-semibold">Terakhir Hadir</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center"><i className="fas fa-spinner fa-spin text-xl text-brand-secondary"></i></td></tr>
                        ) : attendees.length > 0 ? attendees.map((attendee, index) => (
                            <tr key={attendee.uid}>
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3 font-medium">{attendee.fullName}</td>
                                <td className="p-3">
                                    {attendee.presentCount > 0 ? (
                                        <span className="px-2 py-1 rounded-full font-medium text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                            Hadir {attendee.presentCount} kali
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full font-medium text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                            Tidak Hadir
                                        </span>
                                    )}
                                </td>
                                 <td className="p-3 font-mono text-xs">
                                    {attendee.lastTimestamp ? new Date(attendee.lastTimestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' }) : '-'}
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