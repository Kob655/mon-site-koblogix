
import React, { useState } from 'react';
import { Lock, Download, FileText, Video, CheckCircle, FileCheck, Copy, Check, Clock, LogOut, Award, ChevronRight, Briefcase, ExternalLink, AlertCircle, Laptop } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateReceipt } from '../utils/exports';
import jsPDF from 'jspdf';

const Resources: React.FC = () => {
  const [code, setCode] = useState('');
  const [unlockedTransaction, setUnlockedTransaction] = useState<any | null>(null);
  const [error, setError] = useState('');
  
  const { transactions, currentUser, globalResources } = useStore();

  const handleUnlock = (manualCode?: string) => {
    setError('');
    const codeToTest = (manualCode || code).trim().toUpperCase();
    const transaction = transactions.find(t => t.code === codeToTest && t.status === 'approved');

    if (transaction) {
      if (transaction.codeExpiresAt && Date.now() > transaction.codeExpiresAt) {
          setError("Ce code a expiré.");
          return;
      }
      setUnlockedTransaction(transaction);
    } else {
      setError("Code invalide ou expiré.");
    }
  };

  const generateCertificate = (name: string, date: string) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setDrawColor(0, 119, 182); doc.setLineWidth(2); doc.rect(10, 10, 277, 190);
    doc.setFont("helvetica", "bold"); doc.setTextColor(0, 119, 182); doc.setFontSize(40);
    doc.text("CERTIFICAT DE RÉUSSITE", 148.5, 50, { align: "center" });
    doc.setFontSize(16); doc.setTextColor(100); doc.text("Décerné à", 148.5, 75, { align: "center" });
    doc.setFontSize(32); doc.setTextColor(44, 62, 80); doc.text(name, 148.5, 95, { align: "center" });
    doc.text("KOBLOGIX", 220, 170, { align: "center" });
    doc.save(`Certificat_KOBLOGIX_${name.replace(' ', '_')}.pdf`);
  };

  const myTransactions = currentUser 
    ? transactions.filter(t => t.email === currentUser.email).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const renderContent = () => {
    if (!unlockedTransaction) return null;

    const isFull = unlockedTransaction.type === 'formation_full';
    const isCompleted = unlockedTransaction.isCompleted;

    return (
        <div className="animate-slideUp w-full max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
                <button onClick={() => setUnlockedTransaction(null)} className="text-gray-400 hover:text-white text-sm">← Retour</button>
                <button onClick={() => generateReceipt(unlockedTransaction)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs flex items-center gap-2">
                    <FileCheck size={16} /> Reçu de Paiement
                </button>
            </div>

            {/* Fichier livré par l'Admin */}
            {unlockedTransaction.deliveredFile && (
                <div className="p-6 rounded-[2rem] border border-green-500/30 bg-green-500/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="p-4 bg-green-500 text-white rounded-2xl"><Download size={24}/></div>
                        <div>
                            <div className="font-black text-lg">Votre commande est prête !</div>
                            <div className="text-xs text-green-400 font-bold uppercase tracking-widest">{unlockedTransaction.deliveredFile.name}</div>
                        </div>
                    </div>
                    <a href={unlockedTransaction.deliveredFile.url} target="_blank" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20">
                        Télécharger maintenant
                    </a>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Liens Ressources */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Supports & Administration</h4>
                    <div className="grid gap-3">
                        <a href={globalResources.inscriptionUrl} target="_blank" className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3"><FileText size={20} className="text-blue-400"/> <span className="text-sm font-bold">Fiche d'Inscription</span></div>
                            <ExternalLink size={16} className="text-gray-500"/>
                        </a>
                        {(globalResources as any).overleafGuideUrl && (
                          <a href={(globalResources as any).overleafGuideUrl} target="_blank" className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-between hover:bg-blue-500/20 transition-colors">
                            <div className="flex items-center gap-3"><Laptop size={20} className="text-blue-400"/> <span className="text-sm font-bold">Guide Installation Overleaf</span></div>
                            <ExternalLink size={16} className="text-gray-400"/>
                          </a>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Formation Premium</h4>
                    <div className="grid gap-3">
                        <a href={globalResources.courseContentUrl} target="_blank" className={`p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors ${isFull ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'opacity-50 pointer-events-none'}`}>
                            <div className="flex items-center gap-3"><Video size={20} className="text-purple-400"/> <span className="text-sm font-bold">Pack Cours (Drive)</span></div>
                            <ExternalLink size={16}/>
                        </a>
                    </div>
                </div>
            </div>

            {/* Certification */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2.5rem] p-8 border border-white/10 text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isCompleted ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-500'}`}><Award size={32} /></div>
                <h4 className="text-xl font-bold">Certification</h4>
                {isCompleted ? (
                    <button onClick={() => generateCertificate(unlockedTransaction.name, unlockedTransaction.date)} className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto">
                        <Download size={20}/> Télécharger Certificat
                    </button>
                ) : <p className="text-xs text-orange-400 font-bold">En attente de validation finale.</p>}
            </div>
        </div>
    );
  };

  return (
    <section id="ressources" className="py-24 bg-slate-950 text-white min-h-[700px] relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-serif mb-4">Espace Ressources</h2>
          <p className="text-gray-400">Accédez à vos outils et travaux finalisés.</p>
        </div>

        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
           {unlockedTransaction ? renderContent() : (
               <div className="text-center space-y-8 py-10">
                   {currentUser ? (
                       <div className="grid gap-4">
                           {myTransactions.map(t => (
                               <div key={t.id} className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center justify-between">
                                   <div className="text-left">
                                       <div className="font-bold">{t.items[0]?.name}</div>
                                       <div className="text-xs text-gray-500">{t.date} • {t.status === 'approved' ? 'Validé' : 'Vérification...'}</div>
                                   </div>
                                   {t.status === 'approved' && <button onClick={() => handleUnlock(t.code)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm">Ouvrir</button>}
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="max-w-sm mx-auto space-y-6">
                           <Lock size={48} className="mx-auto text-gray-400" />
                           <div className="flex gap-2">
                               <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="KOB-XXXX" className="flex-1 bg-black/40 border border-white/20 p-3 rounded-xl text-center outline-none focus:border-blue-500 font-mono"/>
                               <button onClick={() => handleUnlock()} className="bg-blue-600 p-3 rounded-xl"><ChevronRight/></button>
                           </div>
                           {error && <p className="text-red-400 text-xs">{error}</p>}
                       </div>
                   )}
               </div>
           )}
        </div>
      </div>
    </section>
  );
};

export default Resources;
