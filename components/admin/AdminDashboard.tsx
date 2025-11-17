import React, { useState, useEffect } from 'react';
import { getRegistrations, getSelectionStages } from '../../services/firebase';
import type { RegistrationData, SelectionStage } from '../../types';

const AdminDashboard: React.FC = () => {
    const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
    const [stages, setStages] = useState<SelectionStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueSchools, setUniqueSchools] = useState<string[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>('all');

    useEffect(() => {
        const calculateStats = async () => {
            setLoading(true);
            try {
                const [regsData, stagesData] = await Promise.all([getRegistrations(), getSelectionStages()]);
                const regsArray = regsData ? Object.values(regsData) : [];
                setRegistrations(regsArray);
                setStages(stagesData || []);
                const schools = [...new Set(regsArray.map(r => r.originUnit))].sort();
                setUniqueSchools(schools);
            } catch (error) {
                console.error("Failed to calculate dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        calculateStats();
    }, []);

    const getFinalStats = () => {
        const total = registrations.length;
        let passed = 0;
        let failed = 0;
        const male = registrations.filter(r => r.gender === 'Laki-laki').length;
        const female = registrations.filter(r => r.gender === 'Perempuan').length;
        const schoolCount = selectedSchool === 'all' 
            ? 0 
            : registrations.filter(r => r.originUnit === selectedSchool).length;

        registrations.forEach(reg => {
            if (reg.status === 'Gagal') {
                failed++;
                return;
            }
            const hasFailedStage = Object.values(reg.stageProgress || {}).some((p: any) => p && p.status === 'gagal');
            if (hasFailedStage) {
                failed++;
                return;
            }
            if (stages.length > 0) {
                const lastStage = stages[stages.length - 1];
                if (reg.stageProgress?.[lastStage.id]?.status === 'lolos') {
                    passed++;
                    return;
                }
            }
        });
        return { total, passed, failed, male, female, schoolCount };
    };

    const finalStats = getFinalStats();
    
    const barChartStats = [
        { label: 'Total Pendaftar', value: finalStats.total },
        { label: 'Lolos Administrasi', value: registrations.filter(r => r.status === 'Lolos').length },
        ...stages.slice(1).map(stage => ({
            label: `Lolos ${stage.title}`,
            value: registrations.filter(r => r.stageProgress?.[stage.id]?.status === 'lolos').length
        }))
    ];

    const maxValue = Math.max(...barChartStats.map(s => s.value), 1); // Avoid division by zero

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center mb-2">
                <h1 className="text-2xl font-bold text-brand-primary dark:text-white">Dashboard Admin</h1>
                <p className="text-gray-600 dark:text-gray-300">Ringkasan statistik pendaftaran dan kelulusan peserta.</p>
            </div>
            {loading ? (
                 <div className="text-center p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-brand-secondary"></i>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-brand-primary p-4 rounded-lg shadow-md text-center">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Pendaftar</h3>
                        <p className="text-3xl font-bold text-brand-secondary dark:text-blue-400">{finalStats.total}</p>
                    </div>
                     <div className="bg-white dark:bg-brand-primary p-4 rounded-lg shadow-md text-center">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Lolos Seleksi</h3>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{finalStats.passed}</p>
                    </div>
                     <div className="bg-white dark:bg-brand-primary p-4 rounded-lg shadow-md text-center">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Gagal Seleksi</h3>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">{finalStats.failed}</p>
                    </div>
                     <div className="bg-white dark:bg-brand-primary p-4 rounded-lg shadow-md text-center">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Laki-laki</h3>
                        <p className="text-3xl font-bold text-blue-500 dark:text-blue-300">{finalStats.male}</p>
                    </div>
                     <div className="bg-white dark:bg-brand-primary p-4 rounded-lg shadow-md text-center">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Perempuan</h3>
                        <p className="text-3xl font-bold text-pink-500 dark:text-pink-300">{finalStats.female}</p>
                    </div>
                </div>

                 <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                     <h2 className="text-lg font-semibold text-brand-primary dark:text-white mb-4">Statistik Asal Sekolah</h2>
                     <div className="flex items-center gap-4 mb-4">
                         <select 
                            value={selectedSchool} 
                            onChange={e => setSelectedSchool(e.target.value)}
                            className="p-2 border rounded text-sm w-full sm:w-auto bg-white dark:bg-brand-dark dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">Pilih Asal Sekolah</option>
                            {uniqueSchools.map(school => (
                                <option key={school} value={school}>{school}</option>
                            ))}
                        </select>
                        {selectedSchool !== 'all' && (
                            <div className="text-center">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Pendaftar dari {selectedSchool}</h3>
                                <p className="text-2xl font-bold text-brand-secondary dark:text-blue-400">{finalStats.schoolCount}</p>
                            </div>
                        )}
                     </div>
                 </div>

                <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md">
                     <h2 className="text-lg font-semibold text-brand-primary dark:text-white mb-4">Grafik Pendaftar Lolos per Tahap</h2>
                     <div className="bg-gray-50 dark:bg-brand-dark/50 p-4 rounded-lg">
                        {barChartStats.length > 0 ? (
                            <div className="space-y-3">
                                {barChartStats.map((stat, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-1/3 text-xs font-semibold text-gray-600 dark:text-gray-300 truncate pr-2 text-right">{stat.label}</div>
                                        <div className="w-2/3 flex items-center gap-2">
                                            <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-5">
                                                <div 
                                                    className="bg-brand-secondary h-5 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold"
                                                    style={{ width: `${(stat.value / maxValue) * 100}%` }}
                                                >
                                                   
                                                </div>
                                            </div>
                                            <div className="w-8 text-sm font-bold text-brand-primary dark:text-white text-left">{stat.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400">Data tidak tersedia.</p>
                        )}
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
