import React, { useState, useEffect } from 'react';
import type { PublicPage, AdminConfig, HomePageUpdate, User, RegistrationData, SelectionStage, ManagedButton, SupportersSection } from '../types';
import { getAdminConfig, getHomeUpdates, getUserRegistration, getSelectionStages, getSupporters } from '../services/firebase';

interface HomeProps {
  setCurrentPage: (page: PublicPage) => void;
  user: User | null;
  onManagedButtonClick: (button: ManagedButton) => void;
}

const Home: React.FC<HomeProps> = ({ setCurrentPage, user, onManagedButtonClick }) => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [updates, setUpdates] = useState<HomePageUpdate[]>([]);
  const [supportersSection, setSupportersSection] = useState<SupportersSection | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [stages, setStages] = useState<SelectionStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const promises: any[] = [getAdminConfig(), getHomeUpdates(), getSelectionStages(), getSupporters()];
    if (user) {
        promises.push(getUserRegistration(user.uid));
    }
    Promise.all(promises).then(([configData, updatesData, stagesData, supportersData, regData]) => {
      setConfig(configData);
      setUpdates(updatesData);
      setStages(stagesData || []);
      setSupportersSection(supportersData || { title: 'Didukung Oleh', items: [] });
      if (user && regData) {
        setRegistration(regData as RegistrationData);
      }
      setLoading(false);
    });
  }, [user]);
  
  const allStagesPassed = stages.length > 0 && registration?.stageProgress?.[stages[stages.length - 1].id]?.status === 'lolos';

  const WelcomeSection: React.FC = () => {
    if (user) {
       const getStatusInfo = () => {
        if (!registration || registration.status === 'Belum Mendaftar') return { text: "Anda belum melakukan pendaftaran.", color: "text-gray-600 dark:text-gray-300" };
        
        if (allStagesPassed) {
          return { text: `Status: Selamat, Anda LULUS seluruh rangkaian seleksi!`, color: "text-green-600 dark:text-green-400" };
        }
        
        switch(registration.status) {
            case 'Terkirim': return { text: "Status Pendaftaran: Pendaftaran Anda sedang ditinjau oleh admin.", color: "text-yellow-600 dark:text-yellow-400" };
            case 'Gagal': return { text: "Status Pendaftaran: Mohon maaf, pendaftaran administrasi Anda dinyatakan Gagal.", color: "text-red-600 dark:text-red-400" };
            case 'Lolos': 
                const allUserStages = [{id: '1', title: 'Seleksi Administrasi'}, ...stages.slice(1)];
                let currentStatus = { text: "Status: Selamat, seleksi administrasi Anda Lolos!", color: "text-green-600 dark:text-green-400" };

                for (let i = 1; i < allUserStages.length; i++) {
                    const stage = allUserStages[i];
                    const progress = registration.stageProgress?.[stage.id];
                    const prevStageId = allUserStages[i-1].id;
                    const prevStageProgress = (i === 1) ? {status: 'lolos'} : registration.stageProgress?.[prevStageId];

                    if (prevStageProgress?.status !== 'lolos') break;

                    if (!progress) {
                        currentStatus = { text: `Status: Lanjut ke tahap "${stage.title}".`, color: "text-blue-600 dark:text-blue-400" };
                        break;
                    }
                    if (progress.status === 'pending') {
                        currentStatus = { text: `Status: Sedang ditinjau untuk tahap "${stage.title}".`, color: "text-yellow-600 dark:text-yellow-400" };
                        break;
                    }
                    if (progress.status === 'gagal') {
                        currentStatus = { text: `Status: Anda Gagal pada tahap "${stage.title}".`, color: "text-red-600 dark:text-red-400" };
                        break;
                    }
                }
                return currentStatus;

            default: return { text: "Anda belum melakukan pendaftaran.", color: "text-gray-600 dark:text-gray-300" };
        }
      };
      const statusInfo = getStatusInfo();
      return (
        <div className="bg-white dark:bg-brand-primary p-6 rounded-xl shadow-lg max-w-4xl w-full mx-auto animate-fade-in">
          <h1 className="text-xl font-bold text-brand-primary dark:text-gray-100">
             Selamat Datang, {user?.displayName || user?.email}!
          </h1>
          <p className={`text-sm mt-1 ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
        </div>
      );
    }
    return (
       <div className="bg-white dark:bg-brand-primary p-6 md:p-8 rounded-xl shadow-lg animate-float">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-primary dark:text-gray-100 mb-4">
          Purna Paskibra Kecamatan Cileles
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
          Platform informasi terpusat untuk seluruh tahapan seleksi, pengumuman penting, dan pendaftaran Calon Anggota Paskibra.
        </p>
         {config?.showRegistrationButton && !config?.registrationActive && (
            <p className="text-yellow-600 dark:text-yellow-400 text-xs font-semibold animate-pulse mb-2">
                {config.registrationComingSoonText || 'PENDAFTARAN SEGERA DIBUKA'}
            </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {config?.showRegistrationButton && (
                <button
                    onClick={() => setCurrentPage('login')}
                    disabled={!config.registrationActive}
                    className={`font-bold py-2 px-6 rounded-lg text-sm w-full sm:w-auto transition-colors duration-300 flex items-center justify-center gap-2
                        ${config?.registrationActive 
                            ? 'bg-brand-secondary text-white hover:bg-brand-accent' 
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 cursor-not-allowed'
                        }`
                    }
                >
                    {config?.registrationActive ? 'Daftar Akun' : <><i className="far fa-clock"></i> Pendaftaran Belum Tersedia</>}
                </button>
            )}
            {config?.loginActive && (
                 <button
                    onClick={() => setCurrentPage('login')}
                    className="bg-gray-200 dark:bg-gray-700 text-brand-primary dark:text-gray-200 font-bold py-2 px-6 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
                >
                    Masuk
                </button>
            )}
        </div>
        {(supportersSection && (supportersSection.title || supportersSection.items.length > 0)) && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">{supportersSection.title || 'Didukung Oleh'}</h3>
                {supportersSection.items.length > 0 ? (
                    <div className="flex justify-center items-center gap-1 flex-wrap">
                        {supportersSection.items.map(supporter => (
                             <div key={supporter.id} title={supporter.name} className="flex items-center justify-center h-20 w-24 transition-all duration-300">
                               {supporter.imageUrl ? (
                                   <img src={supporter.imageUrl} alt={supporter.name} className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                               ) : supporter.icon ? (
                                   <i className={`${supporter.icon} text-4xl text-gray-700 dark:text-gray-200 p-4 rounded-lg`}></i>
                               ) : (
                                   <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold text-center p-4 rounded-lg">{supporter.name}</span>
                               )}
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-center items-center gap-6 h-16">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-float"
                                style={{ animationDelay: `${i * 0.2}s` }}
                            ></div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-brand-light dark:bg-brand-dark">
      {user && allStagesPassed && (
        <div className="bg-green-100 dark:bg-green-900/50 p-3 w-full text-center animate-fade-in border-b-2 border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-300 font-semibold text-sm">
                <i className="fas fa-award mr-2"></i>Selamat, Anda Lolos! Cek detail kelulusan di halaman <button onClick={() => setCurrentPage('status')} className="font-bold underline">Status</button>.
            </p>
        </div>
      )}
      <div className={`flex flex-col items-center justify-center ${user ? 'py-12' : 'min-h-[calc(100vh-5rem)]'} text-center p-4`}>
        <WelcomeSection />
      </div>
      {updates.length > 0 && (
          <div className="py-12 bg-brand-light dark:bg-brand-dark">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-10">
                      <h2 className="text-3xl font-bold text-brand-primary dark:text-gray-100">Update Terbaru</h2>
                      <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Informasi dan highlight kegiatan terkini.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {updates.slice(0, 3).map(update => (
                          <div key={update.id} className="bg-white dark:bg-brand-primary rounded-lg shadow-lg overflow-hidden flex flex-col interactive-card">
                              {update.imageUrl && (
                                <div className="w-full h-40 bg-gray-100 dark:bg-brand-dark">
                                    <img
                                        src={update.imageUrl}
                                        alt={update.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                              )}
                              <div className="p-6 flex flex-col flex-grow">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{update.date}</p>
                                  <h3 className="text-lg font-semibold text-brand-primary dark:text-white mt-2 mb-2">{update.title}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">{update.content}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};

export default Home;