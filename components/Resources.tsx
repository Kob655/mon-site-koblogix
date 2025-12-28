
import React, { useState } from 'react';
import { Lock, Download, FileText, Video, CheckCircle, FileCheck, Copy, Check, Clock, LogOut, Award, ChevronRight, Briefcase, ExternalLink, AlertCircle, Laptop } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateReceipt } from '../utils/exports';
import jsPDF from 'jspdf';

const Resources: React.FC = () => {
  const [code, setCode] = useState('');
  const [unlockedTransaction, setUnlockedTransaction] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const { transactions, currentUser, logoutUser, globalResources } = useStore();

  const handleUnlock = (manualCode?: string) => {
    setError('');
    const codeToTest = (manualCode || code).trim().toUpperCase();
    const transaction = transactions.find(t => t.code === codeToTest && t.status === 'approved');

    if (transaction) {
      if (transaction.codeExpiresAt && Date.now() > transaction.codeExpiresAt) {
          setError("Ce code a expiré. Contactez l'administrateur.");
          return;
      }
      setUnlockedTransaction(transaction);
    } else {
      setError("Code invalide ou expiré.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCertificate = (name: string, date: string) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setDrawColor(0, 119, 182); doc.setLineWidth(2); doc.rect(10, 10, 277, 190);
    doc.setDrawColor(255, 107, 53); doc.setLineWidth(1); doc.rect(15, 15, 267, 180);
    doc.setFont("helvetica", "bold"); doc.setTextColor(0, 119, 182); doc.setFontSize(40);
    doc.text("CERTIFICAT DE RÉUSSITE", 148.5, 50, { align: "center" });
    doc.setFontSize(16); doc.setTextColor(100); doc.text("Décerné à", 148.5, 75, { align: "center" });
    doc.setFontSize(32); doc.setTextColor(44, 62, 80); doc.setFont("times", "bolditalic");
    doc.text(name, 148.5, 95, { align: "center" });
    doc.setFontSize(16); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text("Pour avoir complété avec succès le cycle de formation :", 148.5, 120, { align: "center" });
    doc.setFontSize(22); doc.setTextColor(0, 119, 182); doc.setFont("helvetica", "bold");
    doc.text("MAÎTRISE DE LATEX POUR LA RÉDACTION SCIENTIFIQUE", 148.5, 135, { align: "center" });
    doc.setFontSize(12); doc.setTextColor(50); doc.text(`Fait le : ${new Date(date).toLocaleDateString()}`, 50, 170);
    doc.text("La Direction KOBLOGIX", 220, 170, { align: "center" });
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
                <div>
                    <button onClick={() => setUnlockedTransaction(null)} className="text-gray-400 hover:text-white text-sm mb-2">← Retour</button>
                    <h3 className="text-2xl font-bold text-white">Espace de Travail</h3>
                </div>
                <button onClick={() => generateReceipt(unlockedTransaction)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <FileCheck size={16} /> Reçu de Paiement
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Documents Administratifs */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Documents Administratifs</h4>
                    <div className="grid gap-3">
                        <a href={globalResources.inscriptionUrl} target="_blank" rel="noreferrer" className={`p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors ${globalResources.inscriptionUrl ? 'bg-white/5 hover:bg-white/10' : 'opacity-50 pointer-events-none'}`}>
                            <div className="flex items-center gap-3"><FileText size={20} className="text-blue-400"/> <span className="text-sm font-bold">Fiche d'Inscription</span></div>
                            <ExternalLink size={16} className="text-gray-500"/>
                        </a>
                        <a href={globalResources.contractUrl} target="_blank" rel="noreferrer" className={`p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors ${globalResources.contractUrl ? 'bg-white/5 hover:bg-white/10' : 'opacity-50 pointer-events-none'}`}>
                            <div className="flex items-center gap-3"><FileText size={20} className="text-blue-400"/> <span className="text-sm font-bold">Contrat de Formation</span></div>
                            <ExternalLink size={16} className="text-gray-500"/>
                        </a>
                        {(globalResources as any).overleafGuideUrl && (
                          <a href={(globalResources as any).overleafGuideUrl} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-between transition-colors">
                            <div className="flex items-center gap-3"><Laptop size={20} className="text-blue-400"/> <span className="text-sm font-bold">Guide Installation Overleaf</span></div>
                            <ExternalLink size={16} className="text-gray-400"/>
                          </a>
                        )}
                    </div>
                </div>

                {/* Contenu Pédagogique */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Formation & Supports</h4>
                    <div className="grid gap-3">
                        <a href={globalResources.courseContentUrl} target="_blank" rel="noreferrer" className={`p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors ${isFull && globalResources.courseContentUrl ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20' : 'opacity-50 pointer-events-none'}`}>
                            <div className="flex items-center gap-3"><Video size={20} className="text-purple-400"/> <span className="text-sm font-bold">Pack Complet Cours (Drive)</span></div>
                            <ExternalLink size={16} className="text-gray-500"/>
                        </a>
                        <a href={globalResources.whatsappLink} target="_blank" rel="noreferrer" className={`p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors ${isFull && globalResources.whatsappLink ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20' : 'opacity-50 pointer-events-none'}`}>
                            <div className="flex items-center gap-3"><CheckCircle size={20} className="text-green-400"/> <span className="text-sm font-bold">Groupe WhatsApp VIP</span></div>
                            <ExternalLink size={16} className="text-gray-500"/>
                        </a>
                    </div>
                </div>
            </div>

            {/* Zone de Graduation */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-white/10 text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-gray-500'}`}>
                    <Award size={32} />
                </div>
                <h4 className="text-xl font-bold">Certification Officielle</h4>
                {isCompleted ? (
                    <>
                        <p className="text-gray-300 text-sm max-w-sm mx-auto">Félicitations ! Vous avez complété votre formation. Votre certificat est prêt.</p>
                        <button onClick={() => generateCertificate(unlockedTransaction.name, unlockedTransaction.date)} className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mx-auto">
                            <Download size={20}/> Télécharger mon Certificat
                        </button>
                    </>
                ) : (
                    <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-bold bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                        <AlertCircle size={14}/> Disponible après validation finale par l'instructeur.
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <section id="ressources" className="py-24 bg-slate-950 text-white min-h-[700px] relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">Espace Ressources</h2>
          <p className="text-gray-400">Accédez à vos supports et gérez votre certification.</p>
        </div>

        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
           {unlockedTransaction ? renderContent() : (
               <div className="text-center space-y-8 py-10">
                   {currentUser ? (
                       <div className="grid gap-4">
                           {myTransactions.map(t => (
                               <div key={t.id} className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center justify-between">
                                   <div className="text-left">
                                       <div className="font-bold">{t.items[0]?.name}</div>
                                       <div className="text-xs text-gray-500">{t.date} • {t.status === 'approved' ? 'Validé' : 'En attente'}</div>
                                   </div>
                                   {t.status === 'approved' ? (
                                       <button onClick={() => handleUnlock(t.code)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm">Accéder</button>
                                   ) : <span className="text-orange-400 text-xs">Vérification en cours...</span>}
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="max-w-sm mx-auto space-y-6">
                           <Lock size={48} className="mx-auto text-gray-600" />
                           <p className="text-gray-400 text-sm">Entrez votre code d'accès pour déverrouiller vos ressources.</p>
                           <div className="flex gap-2">
                               <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="KOB-XXXX" className="flex-1 bg-black/40 border border-white/20 p-3 rounded-xl text-center font-mono tracking-widest outline-none focus:border-blue-500"/>
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
