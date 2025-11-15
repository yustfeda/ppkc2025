import React, { useState, useEffect } from 'react';
import { getRegistrations, getSelectionStages, deleteUserRegistration } from '../../services/firebase';
import type { RegistrationData, SelectionStage, AdminPageProps } from '../../types';

declare const jspdf: any;
declare const XLSX: any;

const AdminRecap: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    const fetchData = React.useCallback(() => {
        setLoading(true);
        Promise.all([getRegistrations(), getSelectionStages()]).then(([regsData, stagesData]) => {
            setRegistrations(regsData ? Object.values(regsData) : []);
            setStages([{ id: 'administration', title: 'Lolos Administrasi', description: '', date: '' }, ...stagesData]);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getFilteredRegistrations = () => {
        if (selectedStage === 'all') {
            return registrations;
        }
        if (selectedStage === 'administration') {
            return registrations.filter(r => r.status === 'Lolos');
        }
        return registrations.filter(r => r.stageProgress?.[selectedStage]?.status === 'lolos');
    };
    
    const handleDelete = async (uid: string) => {
        await deleteUserRegistration(uid);
        showNotification('Pendaftaran pengguna berhasil dihapus. Pengguna dapat mendaftar ulang.', 'success');
        fetchData();
    };

    const handleDeleteWithConfirm = (uid: string) => {
        showConfirmation(
            'Menghapus pendaftar akan menghapus semua data pendaftaran mereka. Pengguna harus mendaftar ulang dari awal. Anda yakin?',
            () => handleDelete(uid)
        );
    };

    const filteredData = getFilteredRegistrations();
    const currentStageTitle = stages.find(s => s.id === selectedStage)?.title || "Semua Pendaftar";

    const exportToPDF = () => {
        const doc = new jspdf.jsPDF({ orientation: 'landscape' });
        doc.setFontSize(10);
        doc.text("Rekapitulasi Pendaftar Calon Paskibraka Kecamatan Cileles Tahun 2025", 14, 16);
        doc.setFontSize(9);
        doc.text(`Filter Tahapan: ${currentStageTitle}`, 14, 22);
        
        const head = [['No', 'Nama', 'TTL', 'Asal Satuan', 'Kontak Darurat', 'Link KK', 'Link Foto', 'Link Izin Ortu']];
        const body = filteredData.map((r, i) => [
            i + 1,
            r.fullName,
            `${r.birthPlace}, ${r.birthDate}`,
            r.originUnit,
            r.emergencyContact,
            r.kkUrl || '-',
            r.photoUrl || '-',
            r.parentPermitUrl || '-'
        ]);

        doc.autoTable({
            startY: 26,
            head: head,
            body: body,
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { fontSize: 8, fillColor: [11, 36, 71] },
        });
        doc.save(`Rekap Peserta - ${currentStageTitle}.pdf`);
    };

    const exportToExcel = () => {
        const dataToExport = filteredData.map(r => ({
            'Nama Lengkap': r.fullName,
            'Tempat Lahir': r.birthPlace,
            'Tanggal Lahir': r.birthDate,
            'Jenis Kelamin': r.gender,
            'Asal Satuan': r.originUnit,
            'Email': r.email,
            'Riwayat Penyakit': r.medicalHistory,
            'Kontak Darurat': r.emergencyContact,
            'Link KK': r.kkUrl,
            'Link Foto': r.photoUrl,
            'Link Izin Ortu': r.parentPermitUrl,
            'Status Administrasi': r.status,
            'Waktu Pendaftaran': r.submittedAt ? new Date(r.submittedAt).toLocaleString('id-ID') : '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Peserta");
        XLSX.writeFile(workbook, `Rekap Peserta - ${currentStageTitle}.xlsx`);
    };


    const tableHeaders = ["#", "Nama", "TTL", "Jenis Kelamin", "Asal Satuan", "Email", "Riwayat Penyakit", "Kontak Darurat", "Aksi"];

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-4">Rekapitulasi Peserta</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select 
                    value={selectedStage} 
                    onChange={e => setSelectedStage(e.target.value)}
                    className="p-2 border rounded text-sm w-full sm:w-auto bg-white dark:bg-brand-dark dark:border-gray-600 dark:text-white"
                >
                    <option value="all">Semua Pendaftar</option>
                    {stages.map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.title}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <button onClick={exportToPDF} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-red-700"><i className="fas fa-file-pdf mr-2"></i>PDF</button>
                    <button onClick={exportToExcel} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-green-700"><i className="fas fa-file-excel mr-2"></i>Excel</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                     <thead className="bg-gray-50 dark:bg-brand-dark">
                        <tr className="text-gray-800 dark:text-gray-200">
                            {tableHeaders.map(header => <th key={header} className="p-2 font-semibold">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {loading ? (
                            <tr><td colSpan={tableHeaders.length} className="p-4 text-center"><i className="fas fa-spinner fa-spin text-xl"></i></td></tr>
                        ) : filteredData.length > 0 ? filteredData.map((reg, index) => (
                            <tr key={reg.uid}>
                                <td className="p-2">{index + 1}</td>
                                <td className="p-2 font-medium">{reg.fullName}</td>
                                <td className="p-2">{reg.birthPlace}, {reg.birthDate}</td>
                                <td className="p-2">{reg.gender}</td>
                                <td className="p-2">{reg.originUnit}</td>
                                <td className="p-2">{reg.email}</td>
                                <td className="p-2">{reg.medicalHistory || '-'}</td>
                                <td className="p-2">{reg.emergencyContact}</td>
                                <td className="p-2">
                                    <button onClick={() => handleDeleteWithConfirm(reg.uid)} className="text-gray-400 hover:text-red-500">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                             <tr><td colSpan={tableHeaders.length} className="p-4 text-center text-gray-500">Tidak ada data peserta untuk tahapan ini.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRecap;