
import React, { useState, useEffect } from 'react';
import type { PublicPage, AdminConfig, HomePageUpdate, User, RegistrationData, SelectionStage, ManagedButton, SupportersSection } from '../types';
import { getAdminConfig, getHomeUpdates, getUserRegistration, getSelectionStages, getSupporters } from '../services/firebase';

interface HomeProps {
  setCurrentPage: (page: PublicPage) => void;
  user: User | null;
  onManagedButtonClick: (button: ManagedButton) => void;
}

// Helper component for caching images
const CachedImage: React.FC<{ src: string; alt: string; className: string; id: string }> = ({ src, alt, className, id }) => {
    const [imgSrc, setImgSrc] = useState<string>(src);
    
    useEffect(() => {
        const cacheKey = `img_cache_${id}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached && cached === src) {
            setImgSrc(cached);
        } else {
            try {
                localStorage.setItem(cacheKey, src);
            } catch (e) {
                console.warn("Local storage quota exceeded, skipping image cache.");
            }
            setImgSrc(src);
        }
    }, [src, id]);

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className} 
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
        />
    );
};

const Home: React.FC<HomeProps> = ({ setCurrentPage, user, onManagedButtonClick }) => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [updates, setUpdates] = useState<HomePageUpdate[]>([]);
  const [supportersSection, setSupportersSection] = useState<SupportersSection | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [stages, setStages] = useState<SelectionStage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for expanding news items
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

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

  // Default Hero Image (Placeholder Illustration)
  const defaultHeroImage = "banner.png";

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
        <div className="bg-white dark:bg-brand-primary p-8 rounded-2xl shadow-xl max-w-4xl w-full mx-auto animate-fade-in border-t-4 border-brand-secondary">
          <div className="flex flex-col md:flex-row items-center gap-6">
             <div className="flex-grow">
                 <h1 className="text-2xl md:text-3xl font-bold text-brand-primary dark:text-gray-100 mb-2">
                     Selamat Datang, {user?.displayName || user?.email?.split('@')[0]}!
                  </h1>
                  <p className={`text-base font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </p>
             </div>
             <div>
                 <button onClick={() => setCurrentPage('profile')} className="bg-brand-secondary text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-brand-accent transition-transform transform hover:-translate-y-1">
                     <i className="fas fa-user-circle mr-2"></i>Lihat Profil
                 </button>
             </div>
          </div>
        </div>
      );
    }
    
    // Guest View (Hero Section)
    return (
       <div className="w-full px-4 py-6 md:px-12 lg:px-24 md:py-12">
            {/* Banner Container with Hover Effect */}
            <div className="w-full xl:max-w-7xl mx-auto bg-white dark:bg-brand-primary rounded-3xl shadow-lg overflow-hidden relative animate-fade-in-up transition-transform duration-500 hover:-translate-y-2 hover:shadow-xl">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-50 to-transparent dark:from-brand-dark/30 dark:to-transparent opacity-60 pointer-events-none"></div>
                
                <div className="flex flex-col-reverse md:flex-row items-center relative z-10">
                    {/* Left: Text Content */}
                    <div className="w-full md:w-1/2 p-6 md:p-16 lg:p-20 text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-brand-secondary dark:text-blue-300 rounded-full text-xs font-bold mb-4 tracking-wide uppercase">
                            Official Portal
                        </div>
                        <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-brand-primary dark:text-gray-100 leading-tight mb-6">
                            Purna Paskibra <br/>
                            <span className="text-red-600 drop-shadow-md">Kecamatan Cileles</span>
                        </h1>
                        <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                            Wujudkan semangat nasionalisme dan kepemimpinan. Bergabunglah menjadi bagian dari putra-putri terbaik bangsa melalui seleksi Paskibra.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                             {config?.showRegistrationButton && (
                                <div className="relative w-full sm:w-auto">
                                    {/* Coming Soon Text - Modified Style */}
                                    {!config.registrationActive && config.registrationComingSoonText && (
                                         <div className="absolute -top-5 left-0 w-full text-center text-yellow-700 dark:text-yellow-500 font-medium text-[10px] tracking-wide lowercase opacity-90">
                                             {config.registrationComingSoonText}
                                         </div>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(config.registrationActive ? 'login' : 'home')}
                                        disabled={!config.registrationActive}
                                        className={`px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-sm rounded-xl font-bold shadow-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto
                                            ${config?.registrationActive 
                                                ? 'bg-brand-secondary text-white hover:bg-brand-accent hover:shadow-brand-secondary/50' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`
                                        }
                                    >
                                        {config?.registrationActive ? 'Daftar Sekarang' : 'Pendaftaran Tutup'}
                                    </button>
                                </div>
                            )}
                             {config?.loginActive && (
                                 <button
                                    onClick={() => setCurrentPage('login')}
                                    className="px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-sm rounded-xl font-bold text-brand-primary dark:text-white border-2 border-brand-primary dark:border-white hover:bg-brand-primary hover:text-white dark:hover:bg-white dark:hover:text-brand-primary transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                                >
                                    Masuk Akun
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Illustration/Image */}
                    <div className="w-full md:w-1/2 h-64 md:h-[500px] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
                        <img 
                            src={config?.heroImageUrl || defaultHeroImage}
                            alt="Paskibra Illustration"
                            className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-700 ease-in-out hover:-translate-y-4 filter drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>

            {/* Supported By Section */}
            {(supportersSection && (supportersSection.title || supportersSection.items.length > 0)) && (
                <div className="mt-16 text-center animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-widest">{supportersSection.title || 'Didukung Oleh'}</h3>
                    {supportersSection.items.length > 0 ? (
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 grayscale hover:grayscale-0 transition-all duration-500">
                            {supportersSection.items.map(supporter => (
                                <div key={supporter.id} className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center p-4 hover:shadow-xl hover:scale-110 transition-all duration-300 cursor-pointer" title={supporter.name}>
                                    {supporter.imageUrl ? (
                                        <CachedImage 
                                            id={supporter.id}
                                            src={supporter.imageUrl} 
                                            alt={supporter.name} 
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : supporter.icon ? (
                                        <i className={`${supporter.icon} text-4xl text-brand-secondary`}></i>
                                    ) : (
                                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{supporter.name}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
  }
  
  // Helper to toggle read more
  const toggleReadMore = (id: string) => {
      setExpandedUpdateId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-brand-light dark:bg-brand-dark min-h-screen">
      {user && allStagesPassed && (
        <div className="bg-green-100 dark:bg-green-900/50 p-3 w-full text-center animate-fade-in border-b border-green-200 dark:border-green-800 sticky top-20 z-20">
            <p className="text-green-700 dark:text-green-300 font-semibold text-sm">
                <i className="fas fa-award mr-2"></i>Selamat, Anda Lolos! Cek detail kelulusan di halaman <button onClick={() => setCurrentPage('status')} className="font-bold underline">Status</button>.
            </p>
        </div>
      )}
      <div className={`flex flex-col items-center justify-center ${user ? 'py-12' : 'pt-0 pb-16'} p-0`}>
        <WelcomeSection />
      </div>
      {updates.length > 0 && (
          <div className="py-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                      <span className="text-brand-secondary font-bold tracking-wider uppercase text-sm">Informasi Terkini</span>
                      <h2 className="text-3xl md:text-4xl font-bold text-brand-primary dark:text-gray-100 mt-2">Berita & Pengumuman</h2>
                      <div className="w-24 h-1 bg-brand-secondary mx-auto mt-4 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {updates.slice(0, 3).map(update => (
                          <div key={update.id} className="group bg-white dark:bg-brand-primary rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                              {update.imageUrl && (
                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10"></div>
                                    <CachedImage
                                        id={update.id}
                                        src={update.imageUrl}
                                        alt={update.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-primary dark:text-white shadow-sm z-20">
                                        {update.date}
                                    </div>
                                </div>
                              )}
                              <div className="p-6 flex flex-col flex-grow">
                                  {!update.imageUrl && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{update.date}</p>}
                                  <h3 className="text-xl font-bold text-brand-primary dark:text-white mb-3 group-hover:text-brand-secondary transition-colors">{update.title}</h3>
                                  <p className={`text-sm text-gray-600 dark:text-gray-300 flex-grow transition-all duration-300 ${expandedUpdateId === update.id ? '' : 'line-clamp-3'}`}>
                                      {update.content}
                                  </p>
                                  <button 
                                    onClick={() => toggleReadMore(update.id)}
                                    className="mt-4 text-brand-secondary font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
                                  >
                                      {expandedUpdateId === update.id ? 'Tutup' : 'Baca Selengkapnya'} <i className={`fas ${expandedUpdateId === update.id ? 'fa-chevron-up' : 'fa-arrow-right'}`}></i>
                                  </button>
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
