

import React, { useState, useMemo } from 'react';
import { 
  Lock, LayoutDashboard, LogOut, Check, X, Eye, EyeOff, FileText, FileCheck,
  Search, RotateCcw, AlertTriangle, Clock, RefreshCw, Save, 
  Shield, TrendingUp, Users, DollarSign, ChevronRight, Trash2, 
  Calendar, Link as LinkIcon, Award, Download, ListFilter, Settings as SettingsIcon, UploadCloud, PieChart, Filter
} from 'lucide-react';
import Modal from './ui/Modal';
import { formatPrice } from '../utils';
import { useStore } from '../context/StoreContext';
import { exportToExcel, generateReceipt } from '../utils/exports';

const AdminPanel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'sessions' | 'settings'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { 
    transactions, sessions, updateTransactionStatus, toggleCompletion, 
    deleteTransaction, clearTransactions, regenerateCode, isAdminOpen, 
    setAdminOpen, adminPassword, globalResources, updateGlobalResource,
    updateSession, resetSessionSeats, updateServiceProgress, saveAllGlobalResources
  } = useStore();

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const term = searchTerm.toLowerCase();
      const matchSearch = (t.name.toLowerCase().includes(term) || 
                          t.phone.includes(term) || 
                          t.paymentRef?.toLowerCase().includes(term));
      const matchStatus = (statusFilter === 'all' || t.status === statusFilter);
      const matchType = (typeFilter === 'all' || t.type === typeFilter);
      return matchSearch && matchStatus && matchType;
    });
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const approved = transactions.filter(t => t.status === 'approved');
    const revenue = approved.reduce((acc, t) => acc + t.amount, 0);
    const revenueService = approved.filter(t => t.type === 'service' || t.type === 'custom').reduce((acc, t) => acc + t.amount, 0);
    const revenueFormation = approved.filter(t => ['formation_full', 'reservation', 'inscription'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);
    const revenueAI = approved.filter(t => t.type === 'ai_pack').reduce((acc, t) => acc + t.amount, 0);
    
    return { 
      revenue, 
      revenueService,
      revenueFormation,
      revenueAI,
      pending: transactions.filter(t => t.status === 'pending').length, 
      count: transactions.length,
      certified: approved.filter(t => t.isCompleted).length
    };
  }, [transactions]);

  const handleLogin = () => {
    if (password === adminPassword) {
      setIsAuth(true);
      setLoginError('');
    } else {
      setLoginError("Mot de passe incorrect");
    }
  };

  const confirmClear = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider TOUT l'historique ? Cette action est irréversible.")) {
      clearTransactions();
    }
  };

  const handleDeliverFile = (id: string) => {
    const url = prompt("Entrez l'URL du fichier à livrer (Google Drive, etc.) :");
    if (url) {
      updateServiceProgress(id, 100, { name: "Document Finalisé", url });
    }
  };

  const exportSessionParticipants = (sessionId: string) => {
    const participants = transactions.filter(t => 
      t.status === 'approved' && 
      t.items.some(item => item.sessionId === sessionId)
    );
    
    if (participants.length === 0) {
      alert("Aucun participant validé pour cette session.");
      return;
    }
    
    // Simuler l'export Excel spécifique à la session
    const data = participants.map(p => ({
      Nom: p.name,
      Telephone: p.phone,
      Email: p.email || 'N/A',
      Date: p.date,
      Type: p.type.toUpperCase(),
      Contrat: p.uploadedContractUrl ? 'OUI' : 'NON'
    }));
    
    console.log("Exporting session data:", data);
    alert(`Exportation de ${participants.length} participants pour la session.`);
    // Logique réelle avec ExcelJS possible ici
  };

  if (!isAdminOpen) return null;

  return (
    <Modal 
      isOpen={isAdminOpen} 
      onClose={() => setAdminOpen(false)} 
      title="Console d'Administration KOBLOGIX" 
      maxWidth="max-w-6xl" 
      headerColor="bg-slate-900"
    >
      <div className="min-h-[60vh] text-slate-800 dark:text-gray-100 font-sans pb-8">
        {!isAuth ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <Shield size={40} />
             </div>
             <h3 className="text-2xl font-bold mb-6">Accès Sécurisé Admin</h3>
             <div className="w-full max-w-sm relative mb-4">
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full p-4 border dark:border-slate-700 rounded-2xl text-center text-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Entrez le mot de passe..."
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
             </div>
             {loginError && <p className="text-red-500 text-sm font-bold mb-4">{loginError}</p>}
             <button onClick={handleLogin} className="w-full max-w-sm bg-primary text-white py-4 rounded-2xl font-bold shadow-lg">Connexion</button>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
             {/* Navigation Bar */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-700">
                 <div className="flex flex-wrap gap-2">
                     <button onClick={() => setCurrentTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentTab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        <LayoutDashboard size={18}/> Dashboard
                     </button>
                     <button onClick={() => setCurrentTab('sessions')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentTab === 'sessions' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        <Calendar size={18}/> Sessions & Participants
                     </button>
                     <button onClick={() => setCurrentTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentTab === 'settings' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        <SettingsIcon size={18}/> Paramètres du site
                     </button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => window.location.reload()} className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-primary rounded-xl transition-colors"><RefreshCw size={20}/></button>
                    <button onClick={() => setIsAuth(false)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"><LogOut size={18}/> Quitter</button>
                 </div>
             </div>

             {/* DASHBOARD TAB */}
             {currentTab === 'dashboard' && (
                 <div className="space-y-8">
                    {/* Visual Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-3xl text-white shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <DollarSign size={24} className="opacity-50"/>
                                <TrendingUp size={20} className="text-green-300"/>
                            </div>
                            <div className="text-2xl font-black">{formatPrice(stats.revenue)}</div>
                            <div className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Revenu Total Validé</div>
                            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-[8px] uppercase font-bold">
                                <div><span className="opacity-50">Svc:</span> {formatPrice(stats.revenueService)}</div>
                                <div><span className="opacity-50">Form:</span> {formatPrice(stats.revenueFormation)}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                            <Clock size={24} className="text-orange-500 mb-4"/>
                            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.pending}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Commandes en attente</div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                            <Users size={24} className="text-blue-500 mb-4"/>
                            <div className="text-3xl font-black text-slate-800 dark:text-white">{transactions.length}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Total Clients</div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                            <Award size={24} className="text-purple-500 mb-4"/>
                            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.certified}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Certificats Délivrés</div>
                        </div>
                    </div>

                    {/* Filters & Actions */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <input 
                              type="text" 
                              placeholder="Rechercher un client..." 
                              value={searchTerm} 
                              onChange={e => setSearchTerm(e.target.value)} 
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-100 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none">
                                <option value="all">Statuts</option>
                                <option value="pending">En attente</option>
                                <option value="approved">Validés</option>
                            </select>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-gray-100 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold outline-none">
                                <option value="all">Types</option>
                                <option value="service">Services</option>
                                <option value="formation_full">Formations</option>
                                <option value="ai_pack">Pack IA</option>
                            </select>
                            <button onClick={() => exportToExcel(transactions)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                <Download size={16}/> Export Excel
                            </button>
                            <button onClick={confirmClear} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                <Trash2 size={16}/> Tout vider
                            </button>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-4">
                        {filteredData.length === 0 ? (
                            <div className="text-center py-20 text-gray-500 italic">Aucune transaction trouvée avec ces filtres.</div>
                        ) : (
                            filteredData.map(t => (
                                <div key={t.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all">
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`w-3 h-3 rounded-full ${t.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                            <h4 className="font-black text-lg">{t.name}</h4>
                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full uppercase font-bold">{t.type}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-500">
                                            <div><span className="font-bold">Contact:</span> {t.phone}</div>
                                            <div><span className="font-bold">Ref:</span> {t.paymentRef || 'N/A'}</div>
                                            <div><span className="font-bold">Date:</span> {t.date}</div>
                                        </div>
                                        {t.uploadedContractUrl && (
                                            <div className="mt-3">
                                                <a href={t.uploadedContractUrl} target="_blank" className="text-[10px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full flex items-center w-fit gap-2">
                                                    <FileCheck size={12}/> Contrat Signé Disponible
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right w-full md:w-auto">
                                        <div className="text-xl font-black text-slate-900 dark:text-white mb-2">{formatPrice(t.amount)}</div>
                                        <div className="flex gap-2 justify-end">
                                            {t.status === 'pending' ? (
                                                <button onClick={() => updateTransactionStatus(t.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl transition-all"><Check size={20}/></button>
                                            ) : (
                                                <>
                                                    <button onClick={() => toggleCompletion(t.id)} className={`p-2 rounded-xl transition-all ${t.isCompleted ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`} title="Délivrer diplôme"><Award size={20}/></button>
                                                    <button onClick={() => handleDeliverFile(t.id)} className={`p-2 rounded-xl transition-all ${t.deliveredFile ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`} title="Livrer travail"><UploadCloud size={20}/></button>
                                                    <button onClick={() => regenerateCode(t.id)} className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-primary rounded-xl" title="Régénérer code"><RefreshCw size={20}/></button>
                                                </>
                                            )}
                                            <button onClick={() => deleteTransaction(t.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 size={20}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
             )}

             {/* SESSIONS TAB */}
             {currentTab === 'sessions' && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(session => {
                            const participants = transactions.filter(t => t.status === 'approved' && t.items.some(i => i.sessionId === session.id));
                            return (
                                <div key={session.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="font-black text-lg">{session.title}</h4>
                                            <p className="text-xs text-gray-500">{session.dates}</p>
                                        </div>
                                        <button onClick={() => exportSessionParticipants(session.id)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl" title="Exporter participants">
                                            <Download size={20}/>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-400">Remplissage</span>
                                            <span className={session.available === 0 ? 'text-red-500' : 'text-green-500'}>{session.total - session.available} / {session.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full transition-all" style={{width: `${((session.total - session.available) / session.total) * 100}%`}}></div>
                                        </div>
                                        
                                        {/* List of participants */}
                                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Users size={12}/> Participants Validés ({participants.length})</h5>
                                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                {participants.length === 0 ? <p className="text-[10px] italic text-gray-500">Aucun participant pour le moment.</p> : 
                                                    participants.map(p => (
                                                        <div key={p.id} className="text-[11px] font-bold p-2 bg-gray-50 dark:bg-slate-800 rounded-lg flex justify-between items-center">
                                                            <span>{p.name}</span>
                                                            {p.uploadedContractUrl && <Check size={12} className="text-green-500"/>}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => resetSessionSeats(session.id)} className="flex-1 bg-gray-100 dark:bg-slate-800 py-2 rounded-xl text-[10px] font-bold text-gray-500">Réinitialiser</button>
                                            <input 
                                                type="number" 
                                                value={session.available} 
                                                onChange={(e) => updateSession(session.id, { available: parseInt(e.target.value) || 0 })}
                                                className="w-16 bg-white dark:bg-slate-700 text-center rounded-xl font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
             )}

             {/* SETTINGS TAB */}
             {currentTab === 'settings' && (
                 <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 text-primary rounded-2xl"><SettingsIcon size={24}/></div>
                                <h3 className="text-2xl font-black">Configuration Globale</h3>
                            </div>
                            <button 
                                onClick={() => saveAllGlobalResources(globalResources)} 
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                            >
                                <Save size={20}/> Sauvegarder tout
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                { label: "Lien Fiche d'Inscription", key: "inscriptionUrl" },
                                { label: "Lien Contrat de Formation", key: "contractUrl" },
                                { label: "Lien Pack Drive (Cours)", key: "courseContentUrl" },
                                { label: "Lien Canal WhatsApp VIP", key: "whatsappLink" },
                                { label: "Lien Guide Overleaf", key: "overleafGuideUrl" }
                            ].map(res => (
                                <div key={res.key} className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{res.label}</label>
                                    <input 
                                        type="text" 
                                        value={(globalResources as any)[res.key] || ''} 
                                        onChange={(e) => updateGlobalResource(res.key as any, e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                        placeholder="https://..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </Modal>
  );
};

export default AdminPanel;
