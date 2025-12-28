
import React, { useState, useMemo, useEffect } from 'react';
import { Lock, LayoutDashboard, LogOut, Check, X, Eye, EyeOff, FileText, Search, RotateCcw, AlertTriangle, Clock, RefreshCw, Save, Shield, TrendingUp, Users, DollarSign, ChevronRight, Trash2, Calendar, Link as LinkIcon, Award } from 'lucide-react';
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
  
  const { transactions, sessions, updateTransactionStatus, toggleCompletion, deleteTransaction, clearTransactions, regenerateCode, isAdminOpen, setAdminOpen, adminPassword, globalResources, updateGlobalResource } = useStore();

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const term = searchTerm.toLowerCase();
      return (t.name.toLowerCase().includes(term) || t.phone.includes(term) || t.paymentRef?.toLowerCase().includes(term)) &&
             (statusFilter === 'all' || t.status === statusFilter);
    });
  }, [transactions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const revenue = filteredData.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);
    return { revenue, pending: filteredData.filter(t => t.status === 'pending').length, count: filteredData.length };
  }, [filteredData]);

  if (!isAdminOpen) return null;

  return (
    <Modal isOpen={isAdminOpen} onClose={() => setAdminOpen(false)} title="Admin KOBLOGIX" maxWidth="max-w-[95vw] h-[95vh]" headerColor="bg-slate-900">
      <div className="min-h-full pb-12 text-slate-800 font-sans">
        {!isAuth ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
             <Lock size={40} className="mb-6 text-slate-400" />
             <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (password === adminPassword ? setIsAuth(true) : setLoginError("Erreur"))}
                className="w-full max-w-sm p-4 border rounded-xl mb-4 text-center text-lg"
                placeholder="Mot de passe admin..."
             />
             {loginError && <p className="text-red-500 mb-4">{loginError}</p>}
             <button onClick={() => password === adminPassword ? setIsAuth(true) : setLoginError("Erreur")} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Connexion</button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-gray-100 p-2 rounded-xl">
                 <div className="flex gap-2">
                     <button onClick={() => setCurrentTab('dashboard')} className={`px-4 py-2 rounded-lg font-bold ${currentTab === 'dashboard' ? 'bg-white shadow' : ''}`}>Opérations</button>
                     <button onClick={() => setCurrentTab('sessions')} className={`px-4 py-2 rounded-lg font-bold ${currentTab === 'sessions' ? 'bg-white shadow' : ''}`}>Sessions</button>
                     <button onClick={() => setCurrentTab('settings')} className={`px-4 py-2 rounded-lg font-bold ${currentTab === 'settings' ? 'bg-white shadow' : ''}`}>Drive & Liens</button>
                 </div>
                 <button onClick={() => setIsAuth(false)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={20}/></button>
             </div>

             {currentTab === 'settings' && (
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><LinkIcon size={20}/> Liens Google Drive</h3>
                        {[
                            { label: "Fiche d'Inscription", key: "inscriptionUrl", current: globalResources.inscriptionUrl },
                            { label: "Contrat de Formation", key: "contractUrl", current: globalResources.contractUrl },
                            { label: "Contenu Pédagogique (Pack)", key: "courseContentUrl", current: globalResources.courseContentUrl },
                            { label: "Lien WhatsApp VIP", key: "whatsappLink", current: globalResources.whatsappLink },
                        ].map(item => (
                            <div key={item.key}>
                                <label className="text-xs font-bold text-gray-500 uppercase">{item.label}</label>
                                <div className="flex gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        defaultValue={item.current || ''}
                                        onBlur={(e) => updateGlobalResource(item.key as any, e.target.value)}
                                        className="flex-1 p-2 border rounded-lg text-sm font-mono"
                                        placeholder="Coller le lien Google Drive ici..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {currentTab === 'dashboard' && (
                 <div className="space-y-4">
                    <div className="flex gap-4">
                        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 p-3 border rounded-xl" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-3 border rounded-xl">
                            <option value="all">Tout</option>
                            <option value="pending">En attente</option>
                            <option value="approved">Validé</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto border rounded-2xl bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4">Client</th>
                                    <th className="p-4">Montant / Ref</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Certificat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-bold">{t.name}</div>
                                            <div className="text-xs text-gray-500">{t.type}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold">{formatPrice(t.amount)}</div>
                                            <div className="text-[10px] font-mono text-blue-600">{t.paymentRef}</div>
                                        </td>
                                        <td className="p-4">
                                            {t.status === 'pending' ? (
                                                <button onClick={() => updateTransactionStatus(t.id, 'approved')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Valider</button>
                                            ) : (
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-green-600 font-bold text-xs">Validé</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-1 rounded">{t.code}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {(t.type.includes('formation') || t.type === 'reservation') && (
                                                <button 
                                                    onClick={() => toggleCompletion(t.id)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${t.isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                                >
                                                    <Award size={14}/> {t.isCompleted ? 'Certifié' : 'Diplômer'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
