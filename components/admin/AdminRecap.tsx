import React, { useState, useEffect, useCallback } from 'react';
import { getRegistrations, getSelectionStages, deleteUserRegistration, getManagedButtons, getAllFormSubmissions, getRegistrationFormFields } from '../../services/firebase';
import type { RegistrationData, SelectionStage, AdminPageProps, ManagedButton, FormSubmission, FormField } from '../../types';

declare const jspdf: any;
declare const XLSX: any;

const AdminRecap: React.FC<AdminPageProps> = ({ showNotification, showConfirmation }) => {
    const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [docFields, setDocFields] = useState<FormField[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [formSubmissions, setFormSubmissions] = useState<{[buttonId: string]: FormSubmission[]}>({});
    const [recapButtons, setRecapButtons] = useState<ManagedButton[]>([]);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            getRegistrations(), 
            getSelectionStages(),
            getManagedButtons(),
            getAllFormSubmissions(),
            getRegistrationFormFields()
        ]).then(([regsData, stagesData, buttonsData, submissionsData, fieldsData]) => {
            setRegistrations(regsData ? Object.values(regsData) : []);
            setStages([{ id: 'administration', title: 'Lolos Administrasi', description: '', date: '' }, ...stagesData]);
            setDocFields(fieldsData || []);
            
            const recapEnabledButtons = (buttonsData || []).filter(b => b.includeInRecap && b.formFields && b.formFields.length > 0);
            setRecapButtons(recapEnabledButtons);

            const submissionsByButton: {[buttonId: string]: FormSubmission[]} = {};
            for (const buttonId in submissionsData) {
                if (submissionsData[buttonId]) {
                    submissionsByButton[buttonId] = Object.values(submissionsData[buttonId]).sort((a, b) => b.submittedAt - a.submittedAt);
                }
            }
            setFormSubmissions(submissionsByButton);

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
        doc.text("Rekapitulasi Pendaftar Calon Paskibra Kecamatan Cileles Tahun 2025", 14, 16);
        doc.setFontSize(9);
        doc.text(`Filter Tahapan: ${currentStageTitle}`, 14, 22);
        
        const docFieldLabels = docFields.map(f => f.label);
        const head = [['No', 'Nama', 'TTL', 'Asal Satuan', 'Kontak Darurat', ...docFieldLabels]];
        const body = filteredData.map((r, i) => [
            i + 1,
            r.fullName,
            `${r.birthPlace}, ${r.birthDate}`,
            r.originUnit,
            r.emergencyContact,
            ...docFields.map(field => r.documentLinks?.[field.id] || '-')
        ]);

        doc.autoTable({
            startY: 26,
            head: head,
            body: body,
            styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
            headStyles: { fontSize: 8, fillColor: [11, 36, 71] },
        });

        recapButtons.forEach(button => {
            const submissions = formSubmissions[button.id] || [];
            if (submissions.length > 0) {
                doc.addPage();
                doc.setFontSize(10);
                doc.text(`Rekapitulasi Form: ${button.label}`, 14, 16);
                const formFields = button.formFields || [];
                const head = [['No', 'Email', 'Tanggal Submit', ...formFields.map(f => f.label)]];
                const body = submissions.map((s, i) => [
                    i + 1,
                    s.userEmail,
                    new Date(s.submittedAt).toLocaleDateString('id-ID'),
                    ...formFields.map(f => s.data[f.id] || '-')
                ]);
                doc.autoTable({ startY: 22, head, body, styles: { fontSize: 7, cellPadding: 1.5 }, headStyles: { fontSize: 8, fillColor: [11, 36, 71] } });
            }
        });

        doc.save(`Rekap Peserta - ${currentStageTitle}.pdf`);
    };

    const exportToExcel = () => {
        const mainData = filteredData.map(r => {
            const row: Record<string, any> = {
                'Nama Lengkap': r.fullName,
                'Tempat Lahir': r.birthPlace,
                'Tanggal Lahir': r.birthDate,
                'Jenis Kelamin': r.gender,
                'Asal Satuan': r.originUnit,
                'Email': r.email,
                'Riwayat Penyakit': r.medicalHistory,
                'Kontak Darurat': r.emergencyContact,
                'Status Administrasi': r.status,
                'Waktu Pendaftaran': r.submittedAt ? new Date(r.submittedAt).toLocaleString('id-ID') : '',
            };
            docFields.forEach(field => {
                row[field.label] = r.documentLinks?.[field.id] || '-';
            });
            return row;
        });

        const mainWorksheet = XLSX.utils.json_to_sheet(mainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, mainWorksheet, `Peserta - ${currentStageTitle.substring(0,20)}`);

        recapButtons.forEach(button => {
            const submissions = formSubmissions[button.id] || [];
            if (submissions.length > 0) {
                const formFields = button.formFields || [];
                const dataToExport = submissions.map(s => {
                    const row: Record<string, any> = {
                        'Email': s.userEmail,
                        'Tanggal Submit': new Date(s.submittedAt).toLocaleString('id-ID'),
                    };
                    formFields.forEach(field => {
                        row[field.label] = s.data[field.id] || '-';
                    });
                    return row;
                });
                const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                const sheetName = button.label.substring(0, 30);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            }
        });

        XLSX.writeFile(workbook, `Rekap Peserta - ${currentStageTitle}.xlsx`);
    };


    const tableHeaders = ["#", "Nama", "TTL", "Jenis Kelamin", "Asal Satuan", "Email", "Riwayat Penyakit", "Kontak Darurat", ...docFields.map(f => f.label), "Aksi"];

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
                            {tableHeaders.map(header => <th key={header} className="p-2 font-semibold whitespace-nowrap">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {loading ? (
                            <tr><td colSpan={tableHeaders.length} className="p-4 text-center"><i className="fas fa-spinner fa-spin text-xl"></i></td></tr>
                        ) : filteredData.length > 0 ? filteredData.map((reg, index) => (
                            <tr key={reg.uid}>
                                <td className="p-2">{index + 1}</td>
                                <td className="p-2 font-medium whitespace-nowrap">{reg.fullName}</td>
                                <td className="p-2 whitespace-nowrap">{reg.birthPlace}, {reg.birthDate}</td>
                                <td className="p-2">{reg.gender}</td>
                                <td className="p-2">{reg.originUnit}</td>
                                <td className="p-2">{reg.email}</td>
                                <td className="p-2">{reg.medicalHistory || '-'}</td>
                                <td className="p-2">{reg.emergencyContact}</td>
                                {docFields.map(field => (
                                    <td key={field.id} className="p-2 max-w-xs truncate">
                                        <a href={reg.documentLinks?.[field.id]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {reg.documentLinks?.[field.id] || '-'}
                                        </a>
                                    </td>
                                ))}
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

             {recapButtons.map(button => {
                const submissions = formSubmissions[button.id] || [];
                const formFields = button.formFields || [];
                if (loading) return null;
                
                return (
                    <div key={button.id} className="mt-8">
                        <h2 className="text-xl font-bold text-brand-primary dark:text-white mb-4">Rekap Form: {button.label}</h2>
                        {submissions.length > 0 ? (
                             <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                     <thead className="bg-gray-50 dark:bg-brand-dark">
                                        <tr className="text-gray-800 dark:text-gray-200">
                                            <th className="p-2 font-semibold">#</th>
                                            <th className="p-2 font-semibold">Email</th>
                                            <th className="p-2 font-semibold">Tanggal Submit</th>
                                            {formFields.map(f => <th key={f.id} className="p-2 font-semibold">{f.label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                                        {submissions.map((s, i) => (
                                            <tr key={s.id}>
                                                <td className="p-2">{i + 1}</td>
                                                <td className="p-2">{s.userEmail}</td>
                                                <td className="p-2">{new Date(s.submittedAt).toLocaleString('id-ID')}</td>
                                                {formFields.map(f => <td key={f.id} className="p-2">{s.data[f.id] || '-'}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                             <p className="text-sm text-center text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-brand-dark rounded-md">Belum ada data yang masuk untuk form ini.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AdminRecap;