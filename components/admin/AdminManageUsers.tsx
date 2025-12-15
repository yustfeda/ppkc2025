
import React, { useState, useEffect, useCallback } from 'react';
import { getRegistrations, updateRegistrationStatus, deleteUserRegistration, getSelectionStages, updateUserStageProgress } from '../../services/firebase';
import type { RegistrationData, AdminPageProps, SelectionStage } from '../../types';

interface AdminManageUsersProps extends AdminPageProps {
    onUpdate: () => void; // Callback to refresh badge count
}

const AdminManageUsers: React.FC<AdminManageUsersProps> = ({ showNotification, showConfirmation, onUpdate }) => {
    const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            getRegistrations(),
            getSelectionStages()
        ]).then(([regsData, stagesData]) => {
            const regsArray = regsData ? Object.values(regsData) : [];
            setRegistrations(regsArray.filter(reg => reg.status !== 'Belum Mendaftar').sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)));
            setStages(stagesData || []);
            setLoading(false);
            onUpdate(); // Refresh badge count in AdminApp
        });
    }, [onUpdate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStageProgressUpdate = async (uid: string, stageId: string, status: 'lolos' | 'gagal') => {
        const reg = registrations.find(r => r.uid === uid);
        if (!reg) return;

        const currentProgress = reg.stageProgress?.[stageId];
        const submissionUrl = currentProgress?.submissionUrl || '';
        const submittedAt = currentProgress?.submittedAt || Date.now();

        try {
            await updateUserStageProgress(uid, stageId, { status, submissionUrl, submittedAt });
            showNotification('Status peserta berhasil diperbarui.', 'success');
            fetchData();
        } catch (error) {
            showNotification('Gagal mengubah status peserta.', 'error');
        }
        onUpdate();
    };

    const handleFailStageWithConfirm = (uid: string, stageId: string, stageTitle: string) => {
        showConfirmation(
            `Anda yakin ingin menggagalkan peserta ini dari tahap "${stageTitle}"?`,
            () => handleStageProgressUpdate(uid, stageId, 'gagal')
        );
    };

    const handleStatusChange = async (uid: string, status: 'Lolos' | 'Gagal') => {
        try {
            await updateRegistrationStatus(uid, status);
            const statusText = status === 'Lolos' ? 'disetujui' : 'ditolak';
            showNotification(`Status pendaftar berhasil ${statusText}.`, 'success');
            fetchData();
        } catch (error) {
            showNotification('Gagal mengubah status pendaftar.', 'error');
        }
        onUpdate();
    };

    const handleDelete = async (uid: string) => {
        try {
            await deleteUserRegistration(uid);
            showNotification('Pendaftaran pengguna berhasil dihapus.', 'success');
            fetchData();
        } catch (error) {
            console.error("Failed to delete user registration:", error);
            showNotification('Gagal menghapus pendaftaran pengguna.', 'error');
        }
    };

    const handleRejectWithConfirm = (uid: string) => {
        showConfirmation(
            'Anda yakin ingin menolak pendaftar ini? Status administrasi akan diubah menjadi "Ditolak".',
            () => handleStatusChange(uid, 'Gagal')
        );
    };

    const handleDeleteWithConfirm = (uid: string, fullName: string) => {
        showConfirmation(
            `Anda yakin ingin menghapus pendaftaran untuk "${fullName}"? Tindakan ini tidak dapat diurungkan.`,
            () => handleDelete(uid)
        );
    };

    const StatusBadge: React.FC<{ text: string, className: string }> = ({ text, className }) => (
        <span className={`px-2 py-1 rounded-full font-medium text-xs whitespace-nowrap ${className}`}>
            {text}
        </span>
    );
    
    const renderStageCell = (reg: RegistrationData, stage: SelectionStage, stageIndex: number) => {
        const classNames = {
            pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            locked: 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
            awaiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        };

        const ActionButtons: React.FC<{ onApprove: () => void; onReject: () => void; approveText?: string; rejectText?: string }> = 
            ({ onApprove, onReject, approveText = 'Approve', rejectText = 'Reject' }) => (
            <div className="flex items-center gap-2 mt-2">
                <button onClick={onApprove} className="text-green-600 hover:text-green-800 text-xs font-semibold">{approveText}</button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button onClick={onReject} className="text-red-600 hover:text-red-800 text-xs font-semibold">{rejectText}</button>
            </div>
        );

        if (stageIndex === 0) {
            switch(reg.status) {
                case 'Terkirim': return (
                    <div>
                        <StatusBadge text="Pending" className={classNames.pending} />
                        <ActionButtons onApprove={() => handleStatusChange(reg.uid, 'Lolos')} onReject={() => handleRejectWithConfirm(reg.uid)} />
                    </div>
                );
                case 'Lolos': return <StatusBadge text="Approved" className={classNames.approved} />;
                case 'Gagal': return <StatusBadge text="Rejected" className={classNames.rejected} />;
                default: return <StatusBadge text="N/A" className="bg-gray-100 text-gray-800" />;
            }
        }

        if (reg.status !== 'Lolos') {
            return <StatusBadge text="Locked" className={classNames.locked} />;
        }

        const prevStage = stages[stageIndex - 1];
        const prevStageStatus = (stageIndex === 1) ? reg.status : reg.stageProgress?.[prevStage.id]?.status;
        const prevStagePassed = (stageIndex === 1) ? prevStageStatus === 'Lolos' : prevStageStatus === 'lolos';

        if (!prevStagePassed) {
            return <StatusBadge text="Locked" className={classNames.locked} />;
        }

        const progress = reg.stageProgress?.[stage.id];
        if (progress) {
             switch(progress.status) {
                case 'pending': return (
                    <div>
                        <StatusBadge text="Pending Review" className={classNames.pending} />
                        <ActionButtons 
                            onApprove={() => handleStageProgressUpdate(reg.uid, stage.id, 'lolos')} 
                            onReject={() => handleFailStageWithConfirm(reg.uid, stage.id, stage.title)}
                            approveText="Pass"
                            rejectText="Fail"
                        />
                    </div>
                );
                case 'lolos': return <StatusBadge text="Passed" className={classNames.approved} />;
                case 'gagal': return <StatusBadge text="Failed" className={classNames.rejected} />;
            }
        }
        
        return <StatusBadge text="Awaiting Submission" className={classNames.awaiting} />;
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = registrations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(registrations.length / itemsPerPage);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    if (loading) {
        return <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-2xl text-brand-secondary"></i></div>;
    }

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-6">Kelola User & Pendaftaran</h1>
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-brand-dark">
                        <tr className="text-gray-800 dark:text-gray-200">
                            <th className="p-3 font-semibold sticky left-0 bg-gray-50 dark:bg-brand-dark">#</th>
                            <th className="p-3 font-semibold sticky left-8 bg-gray-50 dark:bg-brand-dark">Nama</th>
                            <th className="p-3 font-semibold">Email</th>
                            {stages.map(stage => (
                                <th key={stage.id} className="p-3 font-semibold whitespace-nowrap">{stage.title}</th>
                            ))}
                            <th className="p-3 font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {currentItems.length > 0 ? currentItems.map((reg, index) => (
                            <tr key={reg.uid}>
                                <td className="p-3 sticky left-0 bg-white dark:bg-brand-primary align-top">{indexOfFirstItem + index + 1}</td>
                                <td className="p-3 font-medium sticky left-8 bg-white dark:bg-brand-primary whitespace-nowrap align-top">{reg.fullName}</td>
                                <td className="p-3 align-top">{reg.email}</td>
                                {stages.map((stage, stageIndex) => (
                                    <td key={stage.id} className="p-3 align-top">
                                        {renderStageCell(reg, stage, stageIndex)}
                                    </td>
                                ))}
                                <td className="p-3 align-top">
                                    <div className="flex gap-4 items-center">
                                        <button onClick={() => handleDeleteWithConfirm(reg.uid, reg.fullName)} className="text-gray-400 hover:text-red-500" aria-label="Hapus Pendaftaran" title="Hapus Pendaftaran">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4 + stages.length} className="p-4 text-center text-gray-500">Belum ada data pendaftar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Controls */}
            {registrations.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-6 border-t pt-4 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, registrations.length)} dari {registrations.length} peserta
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrevPage} 
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span className="px-3 py-1 font-semibold text-brand-primary dark:text-white bg-gray-100 dark:bg-gray-800 rounded">
                            {currentPage}
                        </span>
                        <button 
                            onClick={handleNextPage} 
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManageUsers;
