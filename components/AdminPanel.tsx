
import React, { useState, useMemo } from 'react';
import { 
  Lock, LayoutDashboard, LogOut, Check, X, Eye, EyeOff, FileText, 
  Search, RotateCcw, AlertTriangle, Clock, RefreshCw, Save, 
  Shield, TrendingUp, Users, DollarSign, ChevronRight, Trash2, 
  Calendar, Link as LinkIcon, Award, Download, ListFilter
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
  
  const { 
    transactions, sessions, updateTransactionStatus, toggleCompletion, 
    deleteTransaction, clearTransactions, regenerateCode, isAdminOpen, 
    setAdminOpen, adminPassword, globalResources, updateGlobalResource,
    updateSession, resetSessionSeats
  } = useStore();

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const term = searchTerm.toLowerCase();
      const matchSearch = (t.name.toLowerCase().includes(term) || 
                          t.phone.includes(term) || 
                          t.paymentRef?.toLowerCase().includes(term));
      const matchStatus = (statusFilter === 'all' || t.status === statusFilter);
      return matchSearch && matchStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const approved = transactions.filter(t => t.status === 'approved');
    const revenue = approved.reduce((acc, t) => acc + t.amount, 0);
    const certified = approved.filter(t => t.isCompleted).length;
    return { 
      revenue, 
      pending: transactions.filter(t => t.status === 'pending').length, 
      count: transactions.length,
      certified
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

  if (!isAdminOpen) return null;

  return (
    <Modal 
      isOpen={isAdminOpen} 
      onClose={() => setAdminOpen(false)} 
      title="Console d'Administration" 
      maxWidth="max-w-6xl" 
      headerColor="bg-slate-900"
    >
      <div className="min-h-[60vh] text-slate-800 dark:text-gray-100 font-sans pb-8">
        {!isAuth ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <Shield size={40} />
             </div>
             <h3 className="text-2xl font-bold mb-6">Accès Sécurisé</h3>
             <div className="w-full max-w-sm relative mb-4">
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full p-4 border dark:border-slate-700 rounded-2xl text-center text-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Mot de passe..."
                    autoFocus
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
             </div>
             {loginError && <p className="text-red-500 text-sm font-bold mb-4 animate-bounce">{loginError}</p>}
             <button 
               onClick={handleLogin} 
               className="w-full max-w-sm bg-slate-900 dark:bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
             >
               Déverrouiller le Panel
             </button>
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
                        <Calendar size={18}/> Sessions
                     </button>
                     <button onClick={() => setCurrentTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentTab === 'settings' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
                        <LinkIcon size={18}/> Drive & Liens
                     </button>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={confirmClear} className="flex-1 md:flex-none p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Vider l'historique">
                        <Trash2 size={20}/>
                    </button>
                    <button onClick={() => setIsAuth(false)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
                        <LogOut size={18}/> Quitter
                    </button>
                 </div>
             </div>

             {/* DASHBOARD TAB */}
             {currentTab === 'dashboard' && (
                 <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Revenu Total", val: formatPrice(stats.revenue), icon: <DollarSign/>, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                            { label: "En Attente", val: stats.pending, icon: <Clock/>, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
                            { label: "Certifiés", val: stats.certified, icon: <Award/>, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                            { label: "Total Commandes", val: stats.count, icon: <TrendingUp/>, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
                        ].map((s, i) => (
                            <div key={i} className={`${s.bg} p-5 rounded-3xl border border-transparent hover:border-white/20 transition-all`}>
                                <div className={`${s.color} mb-2`}>{s.icon}</div>
                                <div className="text-2xl font-black">{s.val}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Actions & Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <input 
                              type="text" 
                              placeholder="Nom, téléphone, référence..." 
                              value={searchTerm} 
                              onChange={e => setSearchTerm(e.target.value)} 
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select 
                              value={statusFilter} 
                              onChange={e => setStatusFilter(e.target.value)} 
                              className="bg-gray-50 dark:bg-slate-800 border-none p-2.5 rounded-xl text-sm font-bold outline-none"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="pending">En attente</option>
                                <option value="approved">Validés</option>
                            </select>
                            <div className="flex gap-1 bg-gray-50 dark:bg-slate-800 p-1 rounded-xl">
                                <button onClick={() => exportToExcel(transactions, 'week')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-primary" title="Export Semaine"><Download size={18}/></button>
                                <button onClick={() => exportToExcel(transactions, 'month')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-primary" title="Export Mois"><FileText size={18}/></button>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <tr>
                                    <th className="p-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Client / Contact</th>
                                    <th className="p-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Commande / Prix</th>
                                    <th className="p-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Paiement / Code</th>
                                    <th className="p-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">Aucune donnée trouvée.</td></tr>
                                ) : (
                                    filteredData.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-white">{t.name}</div>
                                                <div className="text-xs text-gray-500">{t.phone}</div>
                                                <div className="text-[10px] text-primary truncate max-w-[150px]">{t.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    {t.items.map((item, idx) => (
                                                        <div key={idx} className="text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md inline-block">
                                                            {item.name}
                                                        </div>
                                                    ))}
                                                    <div className="font-black text-slate-900 dark:text-white mt-1">{formatPrice(t.amount)}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${t.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                        <span className="font-mono text-[10px] font-bold uppercase">{t.paymentRef}</span>
                                                    </div>
                                                    {t.code && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-xs font-bold text-primary">{t.code}</span>
                                                            <button onClick={() => regenerateCode(t.id)} className="text-gray-400 hover:text-primary" title="Régénérer"><RefreshCw size={12}/></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {t.status === 'pending' ? (
                                                        <button 
                                                          onClick={() => updateTransactionStatus(t.id, 'approved')} 
                                                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl shadow-md transition-all active:scale-95"
                                                          title="Approuver"
                                                        >
                                                            <Check size={18}/>
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => toggleCompletion(t.id)}
                                                                className={`p-2 rounded-xl shadow-md transition-all active:scale-95 ${t.isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
                                                                title={t.isCompleted ? "Retirer diplôme" : "Délivrer diplôme"}
                                                            >
                                                                <Award size={18}/>
                                                            </button>
                                                            <button 
                                                                onClick={() => generateReceipt(t)}
                                                                className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-200 transition-all"
                                                                title="Imprimer reçu"
                                                            >
                                                                <FileText size={18}/>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                      onClick={() => deleteTransaction(t.id)}
                                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                      title="Supprimer"
                                                    >
                                                        <Trash2 size={18}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
             )}

             {/* SESSIONS TAB */}
             {currentTab === 'sessions' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map(session => (
                        <div key={session.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-black text-lg">{session.title}</h4>
                                    <p className="text-xs text-gray-500">{session.dates}</p>
                                </div>
                                <button 
                                    onClick={() => resetSessionSeats(session.id)}
                                    className="p-2 text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Réinitialiser les places"
                                >
                                    <RotateCcw size={18}/>
                                </button>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Places Disponibles</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="number" 
                                        value={session.available}
                                        onChange={(e) => updateSession(session.id, { available: parseInt(e.target.value) || 0 })}
                                        className="w-20 p-2 bg-white dark:bg-slate-700 rounded-xl font-black text-center border-none shadow-sm"
                                    />
                                    <span className="text-gray-400 font-bold">/ {session.total} Total</span>
                                </div>
                            </div>

                            <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${session.available < 5 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${(session.available / session.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                 </div>
             )}

             {/* SETTINGS TAB */}
             {currentTab === 'settings' && (
                 <div className="max-w-2xl mx-auto space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-2xl"><LinkIcon size={24}/></div>
                            <h3 className="text-xl font-bold">Ressources Google Drive</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { label: "Fiche d'Inscription", key: "inscriptionUrl", current: globalResources.inscriptionUrl },
                                { label: "Contrat de Formation", key: "contractUrl", current: globalResources.contractUrl },
                                { label: "Contenu Pédagogique (Pack Drive)", key: "courseContentUrl", current: globalResources.courseContentUrl },
                                { label: "Lien WhatsApp VIP", key: "whatsappLink", current: globalResources.whatsappLink },
                            ].map(item => (
                                <div key={item.key} className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.label}</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            defaultValue={item.current || ''}
                                            onBlur={(e) => updateGlobalResource(item.key as any, e.target.value)}
                                            className="flex-1 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono border-none focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="https://drive.google.com/..."
                                        />
                                        <div className="bg-green-500/10 text-green-500 p-3 rounded-xl"><Save size={18}/></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 p-6 rounded-3xl flex items-start gap-4">
                        <AlertTriangle className="text-orange-500 mt-1" size={24}/>
                        <div>
                            <h4 className="font-bold text-orange-800 dark:text-orange-300">Note de sécurité</h4>
                            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                                Assurez-vous que les liens Drive sont configurés sur "Tous les utilisateurs disposant du lien peuvent consulter" pour que vos clients puissent y accéder.
                            </p>
                        </div>
                    </div>
                 </div>
             )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminPanel;
