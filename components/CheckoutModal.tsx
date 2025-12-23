import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils';
import { X, Check, ArrowRight, User, CreditCard, Smartphone } from 'lucide-react';
import { CustomerInfo } from '../types';
import { WHATSAPP_SUPPORT, USD_RATE } from '../constants';
import { sendEmail, formatOrderForEmail } from '../utils/emailService';

const CheckoutModal: React.FC = () => {
  const { checkoutModalOpen, setCheckoutModalOpen, items, total, clearCart } = useCart();
  const { addTransaction } = useStore();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    paymentMethod: 'tmoney',
    paymentRef: ''
  });

  if (!checkoutModalOpen) return null;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!customer.name || !customer.phone) {
        setError('Veuillez remplir les champs obligatoires');
        return;
      }
      if (customer.email && !validateEmail(customer.email)) {
        setError('Format d\'email invalide');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validation reference paiement
      if (customer.paymentRef.length < 3) {
        setError("Veuillez entrer la référence du paiement (ID de transaction SMS)");
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // 1. Determine Transaction Type Correctly
    const formationTypes = ['formation_full', 'inscription', 'reservation'];
    const hasFormationItem = items.some(i => formationTypes.includes(i.type));
    
    let transactionType = 'service'; // Default to service

    if (hasFormationItem) {
        // Priority logic: Full > Reservation > Inscription
        if (items.some(i => i.type === 'formation_full')) {
            transactionType = 'formation_full';
        } else if (items.some(i => i.type === 'reservation')) {
            transactionType = 'reservation';
        } else {
            transactionType = 'inscription';
        }
    }

    // 2. Create Transaction in Store
    addTransaction({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        method: customer.paymentMethod,
        paymentRef: customer.paymentRef,
        amount: total,
        type: transactionType,
        items: items
    });

    // 3. Send Email Notification to Admin
    try {
        await sendEmail(formatOrderForEmail(customer, items, total));
    } catch (e) {
        console.error("Erreur envoi email commande", e);
    }

    // 4. Send WhatsApp Message
    let message = `*NOUVELLE COMMANDE KOBLOGIX*\n\n`;
    message += `👤 *Client:* ${customer.name}\n`;
    message += `📱 *Tel:* ${customer.phone}\n`;
    message += `💳 *Ref Paiement:* ${customer.paymentRef} (${customer.paymentMethod.toUpperCase()})\n`;
    
    message += `\n*ARTICLES :*\n`;
    items.forEach(item => {
      message += `- ${item.name} : ${formatPrice(item.price)}\n`;
      if(item.details) message += `  (${item.details})\n`;
    });
    
    message += `\n*TOTAL : ${formatPrice(total)} (approx. ${Math.ceil(total/USD_RATE)}$)*\n`;
    message += `Je confirme avoir effectué le paiement ${customer.paymentRef}.`;

    const url = `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    // 5. Clear & Close
    clearCart();
    setStep(3);
  };

  const close = () => {
    setCheckoutModalOpen(false);
    setStep(1);
    setError('');
    setCustomer(prev => ({...prev, paymentRef: ''}));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative transition-colors">
        {/* Header */}
        <div className="bg-primary dark:bg-blue-900 p-6 flex justify-between items-center text-white">
          <h3 className="font-serif text-xl font-bold">Validation de commande</h3>
          <button onClick={close} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
        </div>

        {/* Progress Bar */}
        <div className="flex bg-gray-100 dark:bg-slate-700 h-1.5">
          <div className={`h-full bg-secondary transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4 animate-[slideIn_0.3s]">
              <div className="flex items-center gap-3 mb-4 text-primary dark:text-blue-400">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><User size={24}/></div>
                <h4 className="font-bold text-lg">Vos Coordonnées</h4>
              </div>
              
              {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold">{error}</div>}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nom Complet *</label>
                <input 
                  type="text" 
                  className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Téléphone (WhatsApp) *</label>
                <input 
                  type="tel" 
                  className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  value={customer.phone}
                  onChange={e => setCustomer({...customer, phone: e.target.value})}
                  placeholder="Ex: 90123456"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  value={customer.email}
                  onChange={e => setCustomer({...customer, email: e.target.value})}
                  placeholder="Ex: jean@gmail.com"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-[slideIn_0.3s]">
              <div className="flex items-center gap-3 mb-2 text-primary dark:text-blue-400">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><CreditCard size={24}/></div>
                <h4 className="font-bold text-lg">Paiement & Validation</h4>
              </div>
              
              {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold">{error}</div>}

              {/* Total Card */}
              <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-200 dark:border-slate-600 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Montant à payer</span>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">≈ {Math.ceil(total / USD_RATE)} $ USD</span>
                 </div>
                 <span className="text-2xl font-black text-primary dark:text-blue-400">{formatPrice(total)}</span>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCustomer({...customer, paymentMethod: 'tmoney'})}
                    className={`p-4 rounded-xl border-2 font-bold transition-all relative ${customer.paymentMethod === 'tmoney' ? 'border-primary bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-800' : 'border-gray-200 dark:border-slate-600 text-gray-500 opacity-70'}`}
                  >
                    <div className="text-sm mb-1">T-Money</div>
                    <div className="text-lg font-black">*145#</div>
                    {customer.paymentMethod === 'tmoney' && <div className="absolute top-2 right-2 text-primary"><Check size={16}/></div>}
                  </button>
                  <button 
                    onClick={() => setCustomer({...customer, paymentMethod: 'flooz'})}
                    className={`p-4 rounded-xl border-2 font-bold transition-all relative ${customer.paymentMethod === 'flooz' ? 'border-secondary bg-orange-50 dark:bg-orange-900/20 text-secondary dark:text-orange-400 ring-2 ring-secondary ring-offset-2 dark:ring-offset-slate-800' : 'border-gray-200 dark:border-slate-600 text-gray-500 opacity-70'}`}
                  >
                    <div className="text-sm mb-1">Flooz</div>
                    <div className="text-lg font-black">*155#</div>
                     {customer.paymentMethod === 'flooz' && <div className="absolute top-2 right-2 text-secondary"><Check size={16}/></div>}
                  </button>
              </div>

              {/* Reference Input - Critical for "Ingenious Verification" */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/30">
                 <div className="flex items-start gap-2 mb-3">
                    <Smartphone size={20} className="text-yellow-600 mt-1"/>
                    <div>
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">Référence de Transaction SMS *</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Entrez l'ID reçu par SMS après le paiement (ex: 2948...)</p>
                    </div>
                 </div>
                 <input 
                  type="text" 
                  className="w-full p-3 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg font-mono text-center tracking-widest text-lg uppercase focus:ring-2 focus:ring-yellow-500 outline-none bg-white dark:bg-slate-800 dark:text-white transition-colors"
                  value={customer.paymentRef}
                  onChange={e => setCustomer({...customer, paymentRef: e.target.value.toUpperCase()})}
                  placeholder="ID TRANSACTION"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-[slideIn_0.3s]">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Commande Envoyée !</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Votre paiement <strong>{customer.paymentRef}</strong> est en cours de vérification par notre équipe. 
                <br/>Vous recevrez votre code d'accès par WhatsApp sous peu.
              </p>
              <button onClick={close} className="bg-gray-800 dark:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">
                Fermer
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step < 3 && (
          <div className="p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex justify-between items-center transition-colors">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="text-gray-500 dark:text-gray-400 font-bold hover:text-gray-800 dark:hover:text-gray-200">Retour</button>
            ) : (
              <div></div>
            )}
            <button 
              onClick={handleNext}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              {step === 1 ? 'Suivant' : 'Valider mon paiement'} <ArrowRight size={18}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
