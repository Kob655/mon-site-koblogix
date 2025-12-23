import React, { useState } from 'react';
import { Calendar, Check, Loader2, Video, GraduationCap, Briefcase, Zap, ArrowRight, ShieldCheck, Ticket, UserPlus, Mail, Lock, User, Wifi, Eye, EyeOff, Star } from 'lucide-react';
import { SESSIONS_DATA, USD_RATE } from '../constants';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils';
import Modal from './ui/Modal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { sendEmail, formatRegistrationForEmail } from '../utils/emailService';

const Formation: React.FC = () => {
  const { addToCart } = useCart();
  const { sessions, currentUser, registerUser } = useStore(); 
  const [userType, setUserType] = useState<'pro' | 'student'>('pro'); 
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState('jan');

  // Registration State
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isPrivacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{session: typeof SESSIONS_DATA[0], action: 'full' | 'inscription' | 'reservation'} | null>(null);
  
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [regError, setRegError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing Logic
  const FULL_PRICE = 15000;
  const INSCRIPTION_FEE = 2000;
  const RESERVATION_FEE = 3500;

  const months = [
    { id: 'jan', label: 'Janvier' },
    { id: 'feb', label: 'Février' },
    { id: 'mar', label: 'Mars' },
    { id: 'apr', label: 'Avril' },
  ];

  const filteredSessions = sessions.filter(s => s.id.startsWith(activeMonth));

  // --- NOUVELLE LOGIQUE DE PARSING DES DATES (ROBUSTE) ---
  const getBadgeInfo = (dateString: string) => {
    const cleanDate = dateString.replace(' 2026', '').trim();
    const complexMatch = cleanDate.match(/^(\d+)\s+([a-zA-Zéû]+)\s*-\s*(\d+)\s+([a-zA-Zéû]+)$/);
    if (complexMatch) {
        const d1 = complexMatch[1];
        const m1 = complexMatch[2].substring(0, 3).toUpperCase();
        const d2 = complexMatch[3];
        const m2 = complexMatch[4].substring(0, 3).toUpperCase();
        return { day: `${d1}-${d2}`, month: `${m1}-${m2}` };
    }
    const simpleMatch = cleanDate.match(/^(\d+-\d+)\s+([a-zA-Zéû]+)$/);
    if (simpleMatch) {
        return { day: simpleMatch[1], month: simpleMatch[2].substring(0, 3).toUpperCase() + '.' };
    }
    return { day: '??', month: '???' };
  };

  const getMonthName = (id: string) => {
    if (id.startsWith('jan')) return 'Janvier';
    if (id.startsWith('feb')) return 'Février';
    if (id.startsWith('mar')) return 'Mars';
    if (id.startsWith('apr')) return 'Avril';
    return 'Session';
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegistrationSubmit = async () => {
    setRegError('');
    setIsSubmitting(true);

    // 1. Validation de base
    if (!regForm.name || !regForm.email || !regForm.password) {
      setRegError('Tous les champs sont obligatoires');
      setIsSubmitting(false);
      return;
    }

    // 2. Validation Format Email
    if (!validateEmail(regForm.email)) {
      setRegError('Format d\'email invalide.');
      setIsSubmitting(false);
      return;
    }

    // 3. Validation Mot de passe (Min 8 caractères)
    if (regForm.password.length < 8) {
      setRegError('Le mot de passe doit contenir au moins 8 caractères.');
      setIsSubmitting(false);
      return;
    }

    // 4. Validation RGPD
    if (!isPolicyAccepted) {
        setRegError('Vous devez accepter la politique de confidentialité.');
        setIsSubmitting(false);
        return;
    }
    
    // 5. Enregistrement local
    registerUser({
      name: regForm.name,
      email: regForm.email,
      password: regForm.password
    });

    // 6. Envoi Notification Email (Admin)
    try {
        await sendEmail(formatRegistrationForEmail({ name: regForm.name, email: regForm.email }));
    } catch (e) {
        console.error("Erreur envoi email", e);
        // On ne bloque pas l'inscription si l'email échoue
    }

    setRegisterModalOpen(false);
    setIsSubmitting(false);
    
    if (pendingAction) {
      executeAddToCart(pendingAction.session, pendingAction.action);
    }
  };

  const handleActionClick = (session: typeof SESSIONS_DATA[0], action: 'full' | 'inscription' | 'reservation') => {
    if (!currentUser) {
      setPendingAction({ session, action });
      setRegisterModalOpen(true);
    } else {
      executeAddToCart(session, action);
    }
  };

  const executeAddToCart = async (session: typeof SESSIONS_DATA[0], action: 'full' | 'inscription' | 'reservation') => {
    const currentSession = sessions.find(s => s.id === session.id);
    if (!currentSession || currentSession.available <= 0) {
      alert("Désolé, cette session est complète.");
      return;
    }

    const loadingKey = `${session.id}-${action}`;
    setLoadingId(loadingKey);
    await new Promise(resolve => setTimeout(resolve, 600)); 

    let price = 0;
    let name = `Formation ${session.title}`;
    let detail = '';

    const isStudent = userType === 'student';

    if (action === 'full') {
      const inscriptionCost = isStudent ? 0 : INSCRIPTION_FEE;
      price = FULL_PRICE + inscriptionCost; 
      name = `Pack Complet ${session.title} (${isStudent ? 'Étudiant' : 'Pro'})`;
      detail = isStudent ? 'Formation + Replay (Inscription Offerte)' : 'Formation + Replay + Inscription';
    } else if (action === 'inscription') {
      price = INSCRIPTION_FEE;
      name = `Frais Inscription ${session.title}`;
      detail = 'Documents administratifs uniquement';
    } else if (action === 'reservation') {
      price = RESERVATION_FEE;
      name = `Réservation Place ${session.title}`;
      detail = 'Acompte (déductible du total)';
    }

    addToCart({
      name,
      price,
      type: action === 'full' ? 'formation_full' : action,
      details: `${detail} - ${session.dates}`,
      sessionId: session.id
    });
    setLoadingId(null);
    setPendingAction(null);
  };

  return (
    <section id="formation" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Blobs for Atmosphere */}
      <div className="absolute top-1/2 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 dark:opacity-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <span className="text-blue-600 dark:text-blue-400 font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Calendrier Officiel 2026</span>
          <h2 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white mb-6">
            Choisissez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Session</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            Nous limitons les places à 15 participants par session pour garantir un suivi personnalisé de qualité.
          </p>

          {/* User Type Toggle */}
          <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-gray-200 dark:border-slate-700">
             <button 
               onClick={() => setUserType('pro')}
               className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userType === 'pro' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
             >
               <Briefcase size={18}/> Professionnel
             </button>
             <button 
               onClick={() => setUserType('student')}
               className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userType === 'student' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
             >
               <GraduationCap size={18}/> Étudiant
             </button>
          </div>
          {userType === 'student' && (
             <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 px-4 py-1.5 rounded-full animate-fadeIn">
                <Zap size={14}/> Frais d'inscription offerts (-2000 FCFA)
             </div>
          )}
        </div>

        {/* MONTH TABS */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-16">
            {months.map((m) => (
                <button
                    key={m.id}
                    onClick={() => setActiveMonth(m.id)}
                    className={`relative px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 ${
                        activeMonth === m.id 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-blue-500/20 scale-105 ring-2 ring-offset-2 ring-slate-900 dark:ring-white ring-offset-white dark:ring-offset-slate-900' 
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                    }`}
                >
                    {m.label}
                    {activeMonth === m.id && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    )}
                </button>
            ))}
        </div>

        {/* CARDS */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fadeIn key={activeMonth}">
          {filteredSessions.map((session, index) => {
             const isPro = userType === 'pro';
             const displayPrice = FULL_PRICE + (isPro ? INSCRIPTION_FEE : 0);
             const isLowStock = session.available > 0 && session.available < 5;
             const isFull = session.available === 0;
             const gradient = index === 0 ? 'from-blue-600 to-indigo-600' : 'from-purple-600 to-pink-600';
             const badgeInfo = getBadgeInfo(session.dates);

             return (
            <div key={session.id} className={`group relative rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 ${isFull ? 'opacity-60 grayscale' : 'hover:shadow-2xl hover:shadow-blue-900/10'}`}>
              
              <div className="h-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-0">
                 
                 <div className={`h-32 bg-gradient-to-br ${gradient} p-8 relative overflow-hidden flex flex-col justify-center`}>
                     <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                     
                     <div className="relative z-10 flex justify-between items-start">
                         <div>
                            <span className="text-white/80 font-bold text-xs uppercase tracking-widest block mb-2">
                                {session.title}
                            </span>
                            <h3 className="text-white font-black text-3xl">
                                {getMonthName(session.id)}
                            </h3>
                         </div>
                         <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2 flex flex-col items-center shadow-lg min-w-[80px]">
                            <span className="text-white font-black text-xl leading-none whitespace-nowrap">{badgeInfo.day}</span>
                            <span className="text-white/80 text-[10px] uppercase font-bold">{badgeInfo.month}</span>
                         </div>
                     </div>
                 </div>

                 <div className="p-8 flex-1 flex flex-col bg-gradient-to-b dark:from-slate-900 dark:to-slate-950">
                     
                     <div className="mb-8">
                         <div className="flex justify-between items-end mb-2">
                             <span className="text-xs font-bold text-gray-500 uppercase">Places restantes</span>
                             <span className={`text-sm font-black ${isFull ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-green-500'}`}>
                                 {session.available} / {session.total}
                             </span>
                         </div>
                         <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                             <div 
                                className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${(session.available / session.total) * 100}%` }}
                             ></div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Wifi size={18}/></div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">100% Zoom</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Video size={18}/></div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Replay 24/7</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><Check size={18}/></div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Support PDF</span>
                        </div>
                         <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg"><Star size={18}/></div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Certifié</span>
                        </div>
                     </div>

                     <div className="mt-auto">
                        <div className="flex items-end justify-between mb-6">
                            <div>
                                <div className="text-sm text-gray-400 font-medium mb-1">Total {isPro ? 'Pro' : 'Étudiant'}</div>
                                <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {displayPrice.toLocaleString('fr-FR')} <span className="text-lg text-gray-400 font-normal">F</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold mb-1">
                                    ≈ {Math.ceil(displayPrice / USD_RATE)}$
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={() => handleActionClick(session, 'full')}
                                disabled={isFull || loadingId === `${session.id}-full`}
                                className={`w-full py-4 rounded-xl font-bold text-base text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} hover:brightness-110`}
                            >
                                {loadingId === `${session.id}-full` ? <Loader2 className="animate-spin" size={20}/> : (isFull ? 'Session Complète' : 'Réserver ma place')}
                                {!isFull && <ArrowRight size={20}/>}
                            </button>
                            
                            {!isFull && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleActionClick(session, 'reservation')}
                                        className="flex-1 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors bg-transparent"
                                    >
                                        Bloquer (3500F)
                                    </button>
                                    <button 
                                        onClick={() => handleActionClick(session, 'inscription')}
                                        className="flex-1 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors bg-transparent"
                                    >
                                        Juste Inscription (2000F)
                                    </button>
                                </div>
                            )}
                        </div>
                     </div>
                 </div>
              </div>
            </div>
          );})}
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Création de Compte"
        headerColor="bg-slate-900"
        maxWidth="max-w-md"
      >
        <div className="text-gray-800 dark:text-white">
          <div className="text-center mb-6">
             <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                <UserPlus size={32} />
             </div>
             <h3 className="text-xl font-bold">Dernière étape</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Créez votre compte pour valider votre place.</p>
          </div>

          {regError && (
             <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-lg mb-4 text-center border border-red-100">
               {regError}
             </div>
          )}

          <div className="space-y-4">
             <div className="relative">
                <User className="absolute top-3.5 left-3.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Nom Complet"
                  value={regForm.name}
                  onChange={e => setRegForm({...regForm, name: e.target.value})}
                  className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
             </div>
             <div className="relative">
                <Mail className="absolute top-3.5 left-3.5 text-gray-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Adresse Email"
                  value={regForm.email}
                  onChange={e => setRegForm({...regForm, email: e.target.value})}
                  className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
             </div>
             <div className="relative">
                <Lock className="absolute top-3.5 left-3.5 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mot de passe (8+ caractères)"
                  value={regForm.password}
                  onChange={e => setRegForm({...regForm, password: e.target.value})}
                  className="w-full pl-10 pr-10 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 right-3.5 text-gray-400 hover:text-blue-500 transition-colors"
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
             </div>

             {/* GDPR CHECKBOX */}
             <div className="flex items-start gap-3 mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <input 
                    type="checkbox" 
                    id="privacy-check"
                    checked={isPolicyAccepted}
                    onChange={(e) => setIsPolicyAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="privacy-check" className="text-xs text-gray-600 dark:text-gray-300">
                    J'accepte la <span className="text-primary font-bold cursor-pointer hover:underline" onClick={(e) => { e.preventDefault(); setPrivacyModalOpen(true); }}>politique de confidentialité</span> et le traitement de mes données pour la formation.
                </label>
             </div>

             <button 
               onClick={handleRegistrationSubmit}
               disabled={isSubmitting}
               className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><UserPlus size={18}/> Créer mon compte</>}
             </button>
          </div>
        </div>
      </Modal>

      {/* PRIVACY MODAL */}
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
    </section>
  );
};

export default Formation;
