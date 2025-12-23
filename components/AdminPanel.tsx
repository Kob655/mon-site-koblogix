import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lock, LayoutDashboard, LogOut, Check, X, Eye, EyeOff, FileText, Search, RotateCcw, AlertTriangle, Clock, RefreshCw, Save, Shield, TrendingUp, Users, DollarSign, ChevronRight, Trash2, Trash, Briefcase, UploadCloud } from 'lucide-react';
import Modal from './ui/Modal';
import { formatPrice } from '../utils';
import { useStore } from '../context/StoreContext';
import { exportToExcel, generateReceipt } from '../utils/exports';

const NativeBarChart = ({ data }: { data: { label: string, value: number, height: number }[] }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Pas de données</div>;
  
  return (
    <div className="flex items-end justify-around h-48 gap-1 pt-6 pb-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center justify-end w-full group relative h-full">
           <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
             {formatPrice(item.value)}
           </div>
           <div 
             className="w-full max-w-[24px] bg-blue-500/80 dark:bg-blue-600/80 rounded-t-sm hover:bg-blue-400 transition-all duration-300 relative"
             style={{ height: `${Math.max(item.height, 4)}%` }} // Min height for visibility
           ></div>
           <span className="text-[9px] text-gray-400 mt-2 font-medium truncate w-full text-center uppercase tracking-wider">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// --- COMPOSANT DE GESTION DE LIVRAISON DE SERVICE (UPLOAD) ---
const ServiceManager = ({ transaction }: { transaction: any }) => {
    const { updateServiceProgress } = useStore();
    const [progress, setProgress] = useState(transaction.serviceProgress || 0);
    const [fileData, setFileData] = useState<{name: string, url: string} | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProgress = () => {
        updateServiceProgress(transaction.id, progress);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError('');
        const file = e.target.files?.[0];
        if (file) {
            // Limite de taille augmentée à 50 Mo
            if (file.size > 50 * 1024 * 1024) {
                setUploadError('Fichier trop volumineux (>50Mo).');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFileData({
                        name: file.name,
                        url: event.target.result as string
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeliver = () => {
        if(!fileData) return;
        if(window.confirm(`Confirmer la livraison de "${fileData.name}" au client ?`)) {
            updateServiceProgress(transaction.id, 100, fileData);
            setFileData(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="mt-2 border-t border-gray-100 dark:border-slate-700 pt-2">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
            >
                <Briefcase size={12}/> {isExpanded ? 'Masquer Gestion Projet' : 'Gérer Avancement Projet'}
            </button>
            
            {isExpanded && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg space-y-3">
                    {/* Progress Slider */}
                    <div>
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                            <span>Avancement</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <input 
                                type="range" min="0" max="100" step="5"
                                value={progress}
                                onChange={(e) => setProgress(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <button onClick={handleSaveProgress} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">OK</button>
                        </div>
                    </div>

                    {/* File Delivery */}
                    {!transaction.deliveredFile ? (
                        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Livraison Fichier (Max 50Mo)</p>
                            
                            <div className="flex gap-2 items-center">
                                <label className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                        <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-500">
                                            <UploadCloud size={14}/>
                                        </div>
                                        <span className="text-xs text-gray-500 truncate">
                                            {fileData ? fileData.name : "Cliquez pour choisir un fichier..."}
                                        </span>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.zip,.rar,.doc,.docx,.tex"
                                        className="hidden"
                                    />
                                </label>
                                
                                {fileData && (
                                    <button onClick={handleDeliver} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                        Livrer
                                    </button>
                                )}
                            </div>
                            {uploadError && <p className="text-[10px] text-red-500 font-bold">{uploadError}</p>}
                        </div>
                    ) : (
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                            <Check size={14}/> Fichier livré : <strong>{transaction.deliveredFile.name}</strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- COMPOSANT POUR L'UPLOAD DE RESSOURCES GLOBALES ---
const ResourceUploader = ({ 
    title, 
    currentFile, 
    onSave,
    isLink = false,
    currentLink = '' 
}: { 
    title: string, 
    currentFile?: {name: string, url: string}, 
    onSave: (data: any) => void,
    isLink?: boolean,
    currentLink?: string
}) => {
    const [tempFile, setTempFile] = useState<{name: string, url: string} | null>(null);
    const [tempLink, setTempLink] = useState(currentLink);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                setError('Max 50Mo');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setTempFile({ name: file.name, url: ev.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (isLink) {
            onSave(tempLink);
        } else {
            if (tempFile) {
                onSave(tempFile);
                setTempFile(null);
                if(fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-2">{title}</h4>
            
            {/* Display Current State */}
            {isLink ? (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={tempLink}
                        onChange={e => setTempLink(e.target.value)}
                        className="flex-1 p-2 border rounded bg-white text-xs text-black"
                        placeholder="https://..."
                    />
                    <button onClick={handleSave} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">OK</button>
                </div>
            ) : (
                <div className="space-y-2">
                    {currentFile ? (
                        <div className="flex justify-between items-center text-xs bg-green-50 p-2 rounded text-green-700 border border-green-200">
                            <span className="truncate flex-1 font-medium">{currentFile.name}</span>
                            <Check size={12} className="flex-shrink-0"/>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 italic">Aucun fichier défini</div>
                    )}

                    <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer bg-white border border-gray-300 rounded p-2 flex items-center gap-2 hover:bg-gray-100">
                             <UploadCloud size={14} className="text-gray-500"/>
                             <span className="text-xs text-gray-600 truncate">{tempFile ? tempFile.name : "Choisir..."}</span>
                             <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.zip,.doc,.docx" />
                        </label>
                        {tempFile && (
                            <button onClick={handleSave} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">Valider</button>
                        )}
                    </div>
                    {error && <div className="text-[10px] text-red-500 font-bold">{error}</div>}
                </div>
            )}
        </div>
    );
};

const AdminPanel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'settings'>('dashboard');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [now, setNow] = useState(Date.now());
  const { transactions, sessions, updateTransactionStatus, deleteTransaction, clearTransactions, regenerateCode, addNotification, isAdminOpen, setAdminOpen, adminPassword, updateAdminPassword, globalResources, updateGlobalResource } = useStore();

  useEffect(() => {
    if (!isAdminOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isAdminOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Raccourci : ALT + A
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setAdminOpen]);

  // --- SAFE DATA ---
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const filteredData = useMemo(() => {
    return safeTransactions.filter(t => {
      if (!t) return false;
      const term = (searchTerm || '').toLowerCase();
      const matchesSearch = 
        (t.name || '').toLowerCase().includes(term) ||
        (t.phone || '').includes(term) ||
        (t.paymentRef || '').toLowerCase().includes(term) ||
        String(t.id || '').includes(term);

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeTransactions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    let count = 0;
    
    filteredData.forEach(t => {
        if (t.status === 'approved') revenue += Number(t.amount) || 0;
        if (t.status === 'pending') pending++;
        count++;
    });

    return { revenue, pending, count };
  }, [filteredData]);

  const chartData = useMemo(() => {
    try {
        const months: Record<string, number> = {};
        let maxVal = 0;
        for(let i=5; i>=0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const k = d.toLocaleString('fr-FR', { month: 'short' });
            months[k] = 0;
        }

        safeTransactions.forEach(t => {
            if (t.status === 'approved' && t.date) {
                const d = new Date(t.date);
                if (!isNaN(d.getTime())) {
                    const key = d.toLocaleString('fr-FR', { month: 'short' });
                    if (months[key] !== undefined) {
                        months[key] += (Number(t.amount) || 0);
                        if (months[key] > maxVal) maxVal = months[key];
                    }
                }
            }
        });

        return Object.keys(months).map(key => ({
            label: key,
            value: months[key],
            height: maxVal > 0 ? (months[key] / maxVal) * 100 : 0
        }));
    } catch (e) {
        return [];
    }
  }, [safeTransactions]);

  const handleLogin = () => {
    if (password === adminPassword) {
      setIsAuth(true);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError("Mot de passe incorrect");
      setPassword('');
    }
  };

  const handleUpdatePass = () => {
      if(newPassword !== confirmPassword || newPassword.length < 4) {
          addNotification('Erreur mot de passe', 'error');
          return;
      }
      updateAdminPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
  };

  const copyToClipboard = (txt: string) => {
      navigator.clipboard.writeText(txt);
      addNotification('Copié dans le presse-papier', 'info');
  };

  const handleDeleteAll = () => {
      if (window.confirm("ATTENTION : Cette action va supprimer TOUTES les transactions et l'historique. Êtes-vous sûr de vouloir tout effacer ?")) {
          clearTransactions();
      }
  };

  const handleDeleteOne = (id: number) => {
      if (window.confirm("Voulez-vous vraiment supprimer cette transaction de l'historique ?")) {
          deleteTransaction(id);
      }
  };

  return (
    <Modal 
      isOpen={isAdminOpen} 
      onClose={() => setAdminOpen(false)} 
      title="Administration KOBLOGIX" 
      headerColor="bg-slate-900"
      maxWidth="max-w-[95vw] h-[95vh]" 
    >
      <div className="min-h-full pb-12 text-slate-800 dark:text-slate-100 font-sans">
        {!isAuth ? (
          /* LOGIN SCREEN */
          <div className="flex flex-col items-center justify-center h-[50vh] animate-fadeIn">
             <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 ring-4 ring-slate-50 dark:ring-slate-700">
                 <Lock size={40} className="text-slate-600 dark:text-slate-400" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Espace Administrateur</h3>
             <p className="text-gray-400 text-sm mb-6">Veuillez vous identifier pour accéder au panel.</p>
             
             <div className="w-full max-w-sm space-y-4">
                 <div className="relative group">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="w-full p-4 pl-5 border-2 border-gray-200 rounded-xl bg-white text-black font-medium outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
                        placeholder="Mot de passe..."
                        autoFocus
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-blue-500">
                        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                 </div>
                 {loginError && <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2"><AlertTriangle size={16}/>{loginError}</div>}
                 <button onClick={handleLogin} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95">Connexion</button>
             </div>
          </div>
        ) : (
          /* DASHBOARD SCREEN */
          <div className="space-y-6 animate-slideUp">
             {/* TOP BAR */}
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-4 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-30 py-3 -mx-4 px-4 md:-mx-8 md:px-8">
                 <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30"><LayoutDashboard size={20}/></div>
                     <div>
                         <h2 className="text-lg font-bold leading-tight">Tableau de Bord</h2>
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-wider bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> En ligne
                         </div>
                     </div>
                 </div>
                 
                 <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                     <button onClick={() => setCurrentTab('dashboard')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${currentTab === 'dashboard' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>Opérations</button>
                     <button onClick={() => setCurrentTab('settings')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${currentTab === 'settings' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>Paramètres</button>
                 </div>

                 <div className="flex gap-2">
                     <button 
                        onClick={handleDeleteAll} 
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white border border-red-200 transition-colors shadow-sm" 
                        title="Tout Supprimer"
                     >
                        <Trash size={20}/>
                     </button>
                     <div className="flex gap-1">
                        <button onClick={() => exportToExcel(filteredData, 'week')} className="p-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors text-xs font-bold whitespace-nowrap" title="Exporter Semaine">Excel Semaine</button>
                        <button onClick={() => exportToExcel(filteredData, 'month')} className="p-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 border border-green-200 transition-colors text-xs font-bold whitespace-nowrap" title="Exporter Mois">Excel Mois</button>
                     </div>
                     <button onClick={() => setIsAuth(false)} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 border border-gray-200 transition-colors" title="Déconnexion"><LogOut size={20}/></button>
                 </div>
             </div>

             {currentTab === 'settings' ? (
                 // SETTINGS TAB
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-800 dark:text-slate-800">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-6 flex items-center gap-3 text-lg"><Shield size={24} className="text-blue-500"/> Sécurité</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nouveau mot de passe</label>
                                <input 
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-xl bg-gray-50 text-black outline-none focus:border-blue-500 transition-colors"
                                />
                                <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-8 text-gray-400 hover:text-blue-500">
                                    {showNewPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Confirmer</label>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-xl bg-gray-50 text-black outline-none focus:border-blue-500 transition-colors"
                                />
                                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-8 text-gray-400 hover:text-blue-500">
                                    {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                            <button onClick={handleUpdatePass} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform active:scale-95">
                                <Save size={18}/> Mettre à jour
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-6 flex items-center gap-3 text-lg"><FileText size={24} className="text-green-500"/> Ressources Globales</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <ResourceUploader 
                                title="Fiche d'Inscription (PDF)" 
                                currentFile={globalResources.inscriptionFile}
                                onSave={(data) => updateGlobalResource('inscriptionFile', data)}
                            />
                            <ResourceUploader 
                                title="Contrat de Formation (PDF)" 
                                currentFile={globalResources.contractFile}
                                onSave={(data) => updateGlobalResource('contractFile', data)}
                            />
                            <ResourceUploader 
                                title="Contenu Pédagogique (Pack)" 
                                currentFile={globalResources.courseContentFile}
                                onSave={(data) => updateGlobalResource('courseContentFile', data)}
                            />
                            <ResourceUploader 
                                title="Lien Groupe WhatsApp"
                                isLink={true}
                                currentLink={globalResources.whatsappLink}
                                onSave={(data) => updateGlobalResource('whatsappLink', data)}
                            />
                        </div>
                    </div>
                 </div>
             ) : (
                 <>
                 {/* KPI CARDS */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
                         <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><DollarSign size={24}/></div>
                         <div><div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Revenus Validés</div><div className="text-xl font-black text-slate-800 dark:text-white">{formatPrice(stats.revenue)}</div></div>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
                         <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><TrendingUp size={24}/></div>
                         <div><div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Commandes</div><div className="text-xl font-black text-slate-800 dark:text-white">{stats.count}</div></div>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
                         <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl"><Clock size={24}/></div>
                         <div><div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">En Attente</div><div className="text-xl font-black text-orange-500">{stats.pending}</div></div>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
                         <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><Users size={24}/></div>
                         <div><div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Places Dispo</div><div className="text-xl font-black text-slate-800 dark:text-white">{sessions.reduce((a, b) => a + b.available, 0)}</div></div>
                     </div>
                 </div>

                 {/* MAIN CONTENT SPLIT */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
                     {/* TABLE SECTION */}
                     <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                         {/* Toolbar */}
                         <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex gap-3 items-center bg-gray-50/50 dark:bg-slate-800/50">
                             <div className="relative flex-1 group">
                                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"/>
                                 <input type="text" placeholder="Rechercher (Nom, Réf, Tel)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"/>
                             </div>
                             <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm px-4 py-2.5 outline-none font-medium cursor-pointer hover:border-blue-300">
                                 <option value="all">Tout statut</option>
                                 <option value="pending">En attente</option>
                                 <option value="approved">Validé</option>
                                 <option value="rejected">Rejeté</option>
                             </select>
                             <button onClick={() => {setSearchTerm(''); setStatusFilter('all')}} className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors" title="Réinitialiser"><RotateCcw size={18}/></button>
                         </div>
                         
                         {/* Rows */}
                         <div className="flex-1 overflow-auto">
                             <table className="w-full text-sm text-left border-collapse">
                                 <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0 text-[10px] uppercase text-gray-500 font-bold tracking-wider z-10 shadow-sm">
                                     <tr>
                                         <th className="p-4 border-b dark:border-slate-700">Client</th>
                                         <th className="p-4 border-b dark:border-slate-700">Détails Paiement</th>
                                         <th className="p-4 border-b dark:border-slate-700">Action / Code</th>
                                         <th className="p-4 border-b dark:border-slate-700 text-right">État</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                     {filteredData.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucune transaction trouvée</td></tr>
                                     ) : filteredData.map(t => {
                                         const timeLeft = t.codeExpiresAt ? Math.max(0, t.codeExpiresAt - now) : 0;
                                         const isExpired = timeLeft === 0;
                                         const mins = Math.floor(timeLeft / 60000);
                                         const secs = Math.floor((timeLeft % 60000) / 1000);
                                         const isService = t.type === 'service';

                                         return (
                                             <tr key={t.id} className="group hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                 <td className="p-4 align-top">
                                                     <div className="font-bold text-slate-800 dark:text-white text-base">{t.name}</div>
                                                     <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{t.phone}</div>
                                                     <div className="text-[10px] text-gray-400 mt-1">{t.type}</div>
                                                 </td>
                                                 <td className="p-4 align-top">
                                                     <div className="font-bold text-slate-800 dark:text-white">{formatPrice(t.amount)}</div>
                                                     <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-mono text-[10px] bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300">{t.paymentRef || 'N/A'}</span>
                                                        <span className="text-[10px] uppercase text-gray-400 font-bold">{t.method}</span>
                                                     </div>
                                                 </td>
                                                 <td className="p-4 align-top">
                                                     {t.status === 'approved' ? (
                                                         <div className="flex flex-col gap-2 items-start">
                                                             {t.code && (
                                                                 <div className={`text-xs p-1.5 pl-2 pr-3 rounded-lg border flex items-center gap-3 transition-all ${isExpired ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-50 text-green-700 border-green-200 shadow-sm'}`}>
                                                                     <div onClick={() => !isExpired && copyToClipboard(t.code || '')} className="font-mono font-bold cursor-pointer select-all text-sm tracking-wider hover:scale-105 transition-transform">{t.code}</div>
                                                                     <div className="flex items-center gap-1 text-[10px] font-bold opacity-80"><Clock size={10}/> {isExpired ? 'Expiré' : `${mins}:${secs < 10 ? '0' : ''}${secs}`}</div>
                                                                 </div>
                                                             )}
                                                             <div className="flex gap-2 w-full">
                                                                 {isExpired && (
                                                                    <button onClick={() => regenerateCode(t.id)} className="flex-1 px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1">
                                                                        <RefreshCw size={12}/> Régénérer
                                                                    </button>
                                                                 )}
                                                                 <button onClick={() => generateReceipt(t)} className="flex-1 px-2 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-sm">
                                                                    <FileText size={12}/> Reçu PDF
                                                                 </button>
                                                                 <button onClick={() => handleDeleteOne(t.id)} className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg transition-colors flex items-center justify-center" title="Supprimer"><Trash2 size={12}/></button>
                                                             </div>
                                                             
                                                             {/* SERVICE PROGRESS MANAGEMENT */}
                                                             {isService && <ServiceManager transaction={t} />}
                                                         </div>
                                                     ) : (
                                                         <div className="flex gap-2">
                                                             <button 
                                                                onClick={() => updateTransactionStatus(t.id, 'approved')} 
                                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow hover:shadow-lg text-xs font-bold transition-all flex items-center gap-1 transform active:scale-95"
                                                             >
                                                                <Check size={14}/> Valider
                                                             </button>
                                                             <button onClick={() => updateTransactionStatus(t.id, 'rejected')} className="px-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg transition-colors" title="Rejeter"><X size={16}/></button>
                                                             <button onClick={() => handleDeleteOne(t.id)} className="px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors" title="Supprimer"><Trash2 size={16}/></button>
                                                         </div>
                                                     )}
                                                 </td>
                                                 <td className="p-4 align-top text-right">
                                                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                         t.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                         t.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                                     }`}>
                                                         <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'approved' ? 'bg-green-500' : t.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                                         {t.status === 'approved' ? 'Validé' : t.status === 'pending' ? 'Attente' : 'Rejeté'}
                                                     </span>
                                                 </td>
                                             </tr>
                                         )
                                     })}
                                 </tbody>
                             </table>
                         </div>
                     </div>

                     {/* CHART SECTION */}
                     <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 h-auto flex flex-col">
                         <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Évolution des Revenus</h4>
                            <button className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"><ChevronRight size={16}/></button>
                         </div>
                         <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 p-2">
                             <NativeBarChart data={chartData} />
                         </div>
                         <div className="mt-4 grid grid-cols-2 gap-4">
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                <div className="text-[10px] text-blue-500 font-bold uppercase">Moyenne Panier</div>
                                <div className="text-lg font-black text-slate-800 dark:text-white">
                                    {stats.count > 0 ? formatPrice(Math.round(stats.revenue / stats.count)) : '-'}
                                </div>
                             </div>
                             <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                                <div className="text-[10px] text-green-500 font-bold uppercase">Taux Conversion</div>
                                <div className="text-lg font-black text-slate-800 dark:text-white">
                                    {filteredData.length > 0 ? Math.round((stats.count / filteredData.length) * 100) : 0}%
                                </div>
                             </div>
                         </div>
                     </div>
                 </div>
                 </>
             )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminPanel;