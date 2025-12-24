
import React, { useState } from 'react';
import { Lock, Download, RefreshCw, Key, FileText, Video, Link as LinkIcon, AlertCircle, Users, CheckCircle, FileCheck, Copy, Check, Clock, LogOut, Award, Briefcase, ChevronRight, PenTool, Search, Loader2 } from 'lucide-react';
import { WHATSAPP_SUPPORT } from '../constants';
import { useStore } from '../context/StoreContext';
import { generateReceipt } from '../utils/exports';
import jsPDF from 'jspdf';

const Resources: React.FC = () => {
  const [code, setCode] = useState('');
  const [unlockedTransaction, setUnlockedTransaction] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  
  const { transactions, currentUser, logoutUser, globalResources } = useStore();

  const handleUnlock = (manualCode?: string) => {
    setError('');
    const codeToTest = manualCode || code;
    
    const transaction = transactions.find(t => t.code === codeToTest && t.status === 'approved');

    if (transaction) {
      // VÉRIFICATION DE L'EXPIRATION
      if (transaction.codeExpiresAt && Date.now() > transaction.codeExpiresAt) {
          setError("Ce code a expiré. Veuillez contacter l'administrateur pour en générer un nouveau.");
          return;
      }
      setUnlockedTransaction(transaction);
    } else {
      setError("Code d'accès invalide. Vérifiez vos SMS/WhatsApp ou contactez le support.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- FONCTION DE TÉLÉCHARGEMENT ROBUSTE ---
  const handleFileDownload = async (url: string | undefined, filename: string, fileKey: string) => {
      if (!url) return;
      
      setDownloadingFile(fileKey);
      
      try {
          // Méthode 1 : Tenter de récupérer le fichier comme un Blob (Force le téléchargement)
          const response = await fetch(url);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          
      } catch (e) {
          console.warn("Téléchargement direct bloqué (CORS probable), ouverture dans un nouvel onglet.", e);
          // Méthode 2 (Fallback) : Ouvrir dans un nouvel onglet
          window.open(url, '_blank');
      } finally {
          setDownloadingFile(null);
      }
  };

  // --- GENERATE CERTIFICATE FUNCTION ---
  const generateCertificate = (name: string, date: string) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Background border
    doc.setDrawColor(0, 119, 182); // Primary Blue
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    
    doc.setDrawColor(255, 107, 53); // Secondary Orange
    doc.setLineWidth(1);
    doc.rect(15, 15, 267, 180);

    // Logos / Header
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 119, 182);
    doc.setFontSize(40);
    doc.text("CERTIFICAT DE FORMATION", 148.5, 50, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("Ce certificat atteste que", 148.5, 75, { align: "center" });

    // Name
    doc.setFontSize(32);
    doc.setTextColor(44, 62, 80);
    doc.setFont("times", "bolditalic");
    doc.text(name, 148.5, 95, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(100);
    doc.line(80, 100, 217, 100);

    // Description
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("a complété avec succès le module de formation professionnelle :", 148.5, 120, { align: "center" });

    doc.setFontSize(22);
    doc.setTextColor(0, 119, 182);
    doc.setFont("helvetica", "bold");
    doc.text("Maîtrise de LaTeX pour la Rédaction Scientifique", 148.5, 135, { align: "center" });

    // Footer / Signatures
    const yFooter = 165;
    
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Délivré le : ${new Date(date).toLocaleDateString()}`, 50, yFooter);
    
    doc.text("Le Directeur Pédagogique", 220, yFooter, { align: "center" });
    
    // Fake Signature
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.text("L'équipe Koblogix", 220, yFooter + 10, { align: "center" });

    doc.save(`Certificat_KOBLOGIX_${name.replace(' ', '_')}.pdf`);
  };

  // Filtrer les transactions de l'utilisateur connecté
  const myTransactions = currentUser 
    ? transactions.filter(t => t.email === currentUser.email).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const renderContent = () => {
    if (!unlockedTransaction) return null;

    const type = unlockedTransaction.type; 
    const isService = type === 'service';
    const isFullAccess = type === 'formation_full'; 
    const isInscriptionOnly = type === 'inscription'; 
    const isReservation = type === 'reservation'; 

    // MODIFICATION ICI : On autorise les docs administratifs pour Inscription ET Réservation ET Full
    const showAdminDocs = isFullAccess || isInscriptionOnly || isReservation;
    const showCourseContent = isFullAccess;

    // --- SERVICE TRACKING UI ---
    if (isService) {
        const progress = unlockedTransaction.serviceProgress || 0;
        const steps = [
            { label: 'Commande Reçue', threshold: 0, icon: <FileText size={16}/> },
            { label: 'En Rédaction', threshold: 20, icon: <PenTool size={16}/> },
            { label: 'Relecture', threshold: 80, icon: <Search size={16}/> },
            { label: 'Livré', threshold: 100, icon: <CheckCircle size={16}/> }
        ];

        return (
            <div className="animate-slideUp w-full max-w-4xl mx-auto text-white">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <button onClick={() => setUnlockedTransaction(null)} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                        ← Retour
                    </button>
                    <button 
                        onClick={() => generateReceipt(unlockedTransaction)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/10"
                    >
                        <FileCheck size={16} /> Reçu Paiement
                    </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                            <Briefcase size={32} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{unlockedTransaction.items[0]?.name || "Service Commandé"}</h3>
                            <p className="text-gray-400 text-sm">Réf Dossier: <span className="text-white font-mono">{unlockedTransaction.paymentRef}</span></p>
                        </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="mb-10">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-blue-300">Progression globale</span>
                            <span className="text-white">{progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute top-0 right-0 h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* STEPS TIMELINE */}
                    <div className="relative flex justify-between">
                         {/* Connecting Line */}
                         <div className="absolute top-4 left-0 w-full h-1 bg-white/10 -z-10"></div>
                         <div 
                            className="absolute top-4 left-0 h-1 bg-blue-500 transition-all duration-1000 -z-10"
                            style={{ width: `${progress}%` }}
                         ></div>

                         {steps.map((step, idx) => {
                             const isCompleted = progress >= step.threshold;
                             const isCurrent = progress >= step.threshold && (idx === steps.length - 1 || progress < steps[idx + 1].threshold);
                             
                             return (
                                 <div key={idx} className="flex flex-col items-center gap-3">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110' : 'bg-slate-800 text-gray-500 border border-white/10'}`}>
                                         {step.icon}
                                     </div>
                                     <span className={`text-xs font-bold text-center ${isCompleted ? 'text-white' : 'text-gray-600'}`}>{step.label}</span>
                                 </div>
                             )
                         })}
                    </div>
                </div>

                {/* DELIVERY SECTION */}
                {unlockedTransaction.deliveredFile ? (
                    <div className="bg-green-600/10 border border-green-500/30 rounded-2xl p-8 text-center animate-[slideUp_0.5s_0.2s_both]">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                            <CheckCircle size={32} />
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">Votre commande est prête !</h4>
                        <p className="text-green-200 mb-6 text-sm">
                            Le fichier <strong>{unlockedTransaction.deliveredFile.name}</strong> a été livré le {new Date(unlockedTransaction.deliveredFile.deliveredAt).toLocaleDateString()}.
                        </p>
                        <button 
                            onClick={() => handleFileDownload(unlockedTransaction.deliveredFile.url, unlockedTransaction.deliveredFile.name, 'delivered')}
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-1"
                            disabled={downloadingFile === 'delivered'}
                        >
                            {downloadingFile === 'delivered' ? <Loader2 className="animate-spin" size={24}/> : <Download size={24}/>} 
                            {downloadingFile === 'delivered' ? 'Téléchargement...' : 'Télécharger mon fichier'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                         <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                            <Clock size={24} />
                        </div>
                        <p className="text-gray-400 text-sm">
                            Votre commande est en cours de traitement. Vous recevrez une notification une fois le fichier disponible ici.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // --- FORMATION / STANDARD UI ---
    return (
        <div className="animate-slideUp w-full max-w-4xl mx-auto">
            {/* En-tête Dashboard */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-white/10 pb-6 gap-4">
                <div>
                    <button 
                        onClick={() => setUnlockedTransaction(null)}
                        className="text-gray-400 hover:text-white text-sm mb-2 flex items-center gap-1 transition-colors"
                    >
                        ← Retour à mes codes
                    </button>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="text-green-400" /> Espace Étudiant
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Dossier : <span className="text-white font-bold">{unlockedTransaction.name}</span>
                    </p>
                </div>
                <button 
                    onClick={() => generateReceipt(unlockedTransaction)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/10"
                >
                    <FileCheck size={16} /> Télécharger mon Reçu
                </button>
            </div>

            {/* MESSAGE RÉSERVATION (Blocage de place) */}
            {isReservation && (
                 <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-2xl text-center mb-8">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-400">
                        <Lock size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-yellow-200 mb-2">Place Réservée avec Succès !</h4>
                    <p className="text-gray-300 mb-4 max-w-lg mx-auto">
                        Votre acompte a bien été reçu. Une des 15 places disponibles est bloquée à votre nom.
                        <br/><span className="text-white font-bold">Le contenu des cours sera débloqué automatiquement après le règlement du solde.</span>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SECTION ADMINISTRATIVE */}
                {showAdminDocs && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Documents Administratifs</h4>
                        
                        <div className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform"><FileText size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-gray-200">Fiche d'Inscription</h4>
                                    <p className="text-xs text-gray-500">
                                        {globalResources.inscriptionFile ? "Disponible pour téléchargement" : "Bientôt disponible"}
                                    </p>
                                </div>
                            </div>
                            {globalResources.inscriptionFile ? (
                                <button 
                                    onClick={() => handleFileDownload(globalResources.inscriptionFile?.url, globalResources.inscriptionFile?.name || 'Fiche_Inscription.pdf', 'inscription')}
                                    className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-blue-600 transition-all disabled:opacity-50"
                                    disabled={downloadingFile === 'inscription'}
                                >
                                    {downloadingFile === 'inscription' ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                                </button>
                            ) : (
                                <button disabled className="p-2 bg-white/5 rounded-full text-gray-600 cursor-not-allowed"><Download size={20}/></button>
                            )}
                        </div>

                        <div className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform"><FileText size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-gray-200">Contrat de Formation</h4>
                                    <p className="text-xs text-gray-500">
                                        {globalResources.contractFile ? "À signer et renvoyer" : "Bientôt disponible"}
                                    </p>
                                </div>
                            </div>
                            {globalResources.contractFile ? (
                                <button 
                                    onClick={() => handleFileDownload(globalResources.contractFile?.url, globalResources.contractFile?.name || 'Contrat.pdf', 'contract')}
                                    className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-blue-600 transition-all disabled:opacity-50"
                                    disabled={downloadingFile === 'contract'}
                                >
                                    {downloadingFile === 'contract' ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                                </button>
                            ) : (
                                <button disabled className="p-2 bg-white/5 rounded-full text-gray-600 cursor-not-allowed"><Download size={20}/></button>
                            )}
                        </div>
                    </div>
                )}

                {/* SECTION PÉDAGOGIQUE */}
                {showCourseContent ? (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Contenu Pédagogique</h4>
                        
                        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500 rounded-lg text-white shadow-lg shadow-purple-500/20"><Video size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-white">Pack Complet Formation</h4>
                                    <p className="text-xs text-purple-200">
                                        {globalResources.courseContentFile ? "Slides, Codes Sources, Exercices" : "En cours de préparation"}
                                    </p>
                                </div>
                            </div>
                            {globalResources.courseContentFile ? (
                                <button 
                                    onClick={() => handleFileDownload(globalResources.courseContentFile?.url, globalResources.courseContentFile?.name || 'Cours.zip', 'course')}
                                    className="px-4 py-2 bg-white text-purple-900 text-xs font-bold rounded-lg hover:bg-gray-200 disabled:opacity-70"
                                    disabled={downloadingFile === 'course'}
                                >
                                    {downloadingFile === 'course' ? 'Téléchargement...' : 'Télécharger'}
                                </button>
                            ) : (
                                <button disabled className="px-4 py-2 bg-white/20 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">Indisponible</button>
                            )}
                        </div>

                        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 p-4 rounded-xl border border-green-500/30 flex items-center justify-between transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500 rounded-lg text-white shadow-lg shadow-green-500/20"><Users size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-white">Groupe WhatsApp VIP</h4>
                                    <p className="text-xs text-green-200">Lien d'intégration directe</p>
                                </div>
                            </div>
                            <a 
                                href={globalResources.whatsappLink || "#"} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`px-4 py-2 bg-white text-green-900 text-xs font-bold rounded-lg hover:bg-gray-200 ${!globalResources.whatsappLink ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                Rejoindre
                            </a>
                        </div>

                        {/* CERTIFICAT NUMÉRIQUE */}
                         <div className="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 p-4 rounded-xl border border-yellow-500/30 flex items-center justify-between transition-transform hover:scale-[1.02] mt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500 rounded-lg text-white shadow-lg shadow-yellow-500/20"><Award size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-white">Certificat de Réussite</h4>
                                    <p className="text-xs text-yellow-200">Document officiel PDF</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => generateCertificate(unlockedTransaction.name, unlockedTransaction.date)}
                                className="px-4 py-2 bg-white text-yellow-900 text-xs font-bold rounded-lg hover:bg-gray-200"
                            >
                                Télécharger
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ZONE VERROUILLÉE */
                    (!isReservation && (
                    <div className="border border-dashed border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-75 h-full">
                        <Lock size={40} className="text-gray-600 mb-3"/>
                        <h4 className="font-bold text-gray-400">Contenu de Cours Verrouillé</h4>
                        <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
                            {isInscriptionOnly 
                                ? "Vous avez réglé uniquement l'inscription. Payez les frais de formation pour débloquer les cours."
                                : "Accès réservé aux membres de la formation complète."}
                        </p>
                    </div>
                    ))
                )}
            </div>
        </div>
    );
  };

  return (
    <section id="ressources" className="py-24 bg-[#0f172a] text-white transition-colors duration-300 relative overflow-hidden min-h-[800px]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-accent font-bold tracking-widest uppercase text-xs mb-2 block">Zone Privée</span>
          <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6 relative inline-block">
            Espace Ressources
          </h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto text-lg font-light">
            Retrouvez vos codes d'accès et vos documents ici.
          </p>
        </div>

        <div className={`transition-all duration-500 ease-out ${unlockedTransaction ? 'max-w-5xl' : 'max-w-4xl'} mx-auto bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl`}>
           
           {/* SCENARIO 1: Transaction déverrouillée (Contenu visible) */}
           {unlockedTransaction ? (
               renderContent()
           ) : (
               /* SCENARIO 2: Liste des codes (Dashboard) OU Login */
               <div className="animate-fadeIn">
                   {currentUser ? (
                       <div className="space-y-8">
                           <div className="flex justify-between items-center border-b border-white/10 pb-4">
                               <div>
                                   <h3 className="text-xl font-bold text-white">Bonjour, {currentUser.name}</h3>
                                   <p className="text-sm text-gray-400">Voici l'historique de vos accès.</p>
                               </div>
                               <button onClick={logoutUser} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                                   <LogOut size={16}/> Déconnexion
                               </button>
                           </div>

                           {myTransactions.length > 0 ? (
                               <div className="grid gap-4">
                                   {myTransactions.map(t => (
                                       <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:bg-white/10 group">
                                           <div className="flex-1 text-center md:text-left">
                                               <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                   <h4 className="font-bold text-white text-lg">{t.items[0]?.name || "Commande"}</h4>
                                                   <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${t.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-400' : t.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                                                       {t.status === 'approved' ? 'Validé' : t.status === 'pending' ? 'En vérification' : 'Rejeté'}
                                                   </span>
                                               </div>
                                               <p className="text-xs text-gray-400">Réf: {t.paymentRef || 'N/A'} • {new Date(t.date).toLocaleDateString()}</p>
                                           </div>

                                           {t.status === 'approved' && t.code ? (
                                               <div className="flex items-center gap-3 bg-black/30 p-2 pr-4 rounded-lg border border-white/10">
                                                   <div className="px-3 py-1 bg-white/10 rounded text-accent font-mono font-bold tracking-widest select-all">
                                                       {t.code}
                                                   </div>
                                                   <button 
                                                        onClick={() => copyToClipboard(t.code || '', t.id)}
                                                        className="text-gray-400 hover:text-white transition-colors relative"
                                                        title="Copier le code"
                                                   >
                                                       {copiedId === t.id ? <Check size={20} className="text-green-400"/> : <Copy size={20}/>}
                                                   </button>
                                               </div>
                                           ) : (
                                               <div className="flex items-center gap-2 text-orange-300 text-xs bg-orange-500/10 px-3 py-2 rounded-lg">
                                                   <Clock size={14}/>
                                                   En attente de l'admin
                                               </div>
                                           )}

                                           <div className="w-full md:w-auto">
                                                {t.status === 'approved' && t.code ? (
                                                    <button 
                                                        onClick={() => handleUnlock(t.code)}
                                                        className="w-full md:w-auto px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                                                    >
                                                        Accéder au contenu <ChevronRight size={16}/>
                                                    </button>
                                                ) : (
                                                    <button disabled className="w-full md:w-auto px-5 py-2.5 bg-white/5 text-gray-500 rounded-xl font-bold text-sm cursor-not-allowed">
                                                        Bientôt disponible
                                                    </button>
                                                )}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                                   <p className="text-gray-400">Aucune commande trouvée pour ce compte.</p>
                                   <a href="#formation" className="text-primary hover:text-white text-sm font-bold mt-2 inline-block">Voir les formations disponibles</a>
                               </div>
                           )}

                           {/* Zone de saisie manuelle (Fallback) */}
                           <div className="border-t border-white/10 pt-6 mt-8">
                               <p className="text-xs text-center text-gray-500 mb-4 cursor-pointer hover:text-gray-300 transition-colors" onClick={() => document.getElementById('manualInput')?.classList.toggle('hidden')}>
                                   Vous avez un code provenant d'un autre compte ? Cliquez ici.
                               </p>
                               <div id="manualInput" className="hidden max-w-sm mx-auto flex gap-2">
                                   <input 
                                     type="text" 
                                     value={code}
                                     onChange={(e) => setCode(e.target.value.toUpperCase())}
                                     placeholder="KOB-XXXX"
                                     className="flex-1 bg-black/20 border border-white/10 text-white text-center p-2 rounded-lg outline-none focus:border-primary placeholder:text-gray-600"
                                   />
                                   <button onClick={() => handleUnlock()} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-lg">Ok</button>
                               </div>
                               {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
                           </div>
                       </div>
                   ) : (
                       /* LOGIN PROMPT (Si non connecté) */
                       <div className="text-center space-y-6 py-8">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock size={32} className="text-gray-400"/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Connectez-vous pour voir vos codes</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                    Si vous avez déjà passé commande, connectez-vous avec l'email utilisé lors de l'achat.
                                </p>
                            </div>

                             <div className="max-w-sm mx-auto space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                                <label className="text-xs font-bold text-gray-500 uppercase block text-left mb-1">Entrer un code manuellement</label>
                                <div className="flex gap-2">
                                   <input 
                                     type="text" 
                                     value={code}
                                     onChange={(e) => setCode(e.target.value.toUpperCase())}
                                     placeholder="KOB-XXXX"
                                     className="flex-1 bg-black/40 border border-white/20 text-white text-center text-lg tracking-widest font-mono p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                   />
                                   <button 
                                     onClick={() => handleUnlock()}
                                     className="bg-primary hover:bg-blue-600 text-white px-6 rounded-xl font-bold transition-colors"
                                   >
                                     <ChevronRight />
                                   </button>
                                </div>
                                {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
                             </div>

                             <p className="text-xs text-gray-600 mt-4">
                                Pour créer un compte, réservez une session dans la section <a href="#formation" className="text-primary hover:underline">Formation</a>.
                             </p>
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
