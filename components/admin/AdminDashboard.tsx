import React, { useState, useEffect } from 'react';
import { getRegistrations, getSelectionStages } from '../../services/firebase';
import type { RegistrationData, SelectionStage } from '../../types';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<{ label: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateStats = async () => {
            setLoading(true);
            try {
                const [regsData, stagesData] = await Promise.all([getRegistrations(), getSelectionStages()]);
                const registrations = regsData ? Object.values(regsData) : [];
                const stages = stagesData || [];

                const newStats = [];
                newStats.push({ label: 'Total Pendaftar', value: registrations.length });
                
                const passedAdmin = registrations.filter(r => r.status === 'Lolos').length;
                newStats.push({ label: 'Lolos Administrasi', value: passedAdmin });

                // Process subsequent stages
                if (stages.length > 1) {
                    stages.slice(1).forEach(stage => {
                        const passedStage = registrations.filter(r => r.stageProgress?.[stage.id]?.status === 'lolos').length;
                        newStats.push({ label: `Lolos ${stage.title}`, value: passedStage });
                    });
                }
                
                setStats(newStats);
            } catch (error) {
                console.error("Failed to calculate dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        calculateStats();
    }, []);

    const maxValue = Math.max(...stats.map(s => s.value), 1); // Avoid division by zero

    return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-lg shadow-md animate-fade-in">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-white mb-2">Dashboard Admin</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Ringkasan statistik pendaftaran dan kelulusan peserta.</p>

            {loading ? (
                <div className="text-center p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-brand-secondary"></i>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-brand-primary dark:text-white">Grafik Pendaftar</h2>
                     <div className="bg-gray-50 dark:bg-brand-dark/50 p-4 rounded-lg">
                        {stats.length > 0 ? (
                            <div className="space-y-3">
                                {stats.map((stat, index) => (
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
            )}
        </div>
    );
};

export default AdminDashboard;