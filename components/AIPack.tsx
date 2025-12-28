

import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Rocket, Check, ShoppingCart, Zap, Star, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const AIPack: React.FC = () => {
  // Fix: Removed the redundant and incorrect useState(useCart()) call
  const cart = useCart();
  const [option, setOption] = useState<'simple' | 'accompagnement'>('simple');

  const PRICE_SIMPLE = 5000;
  const PRICE_FULL = 15000;
  const currentPrice = option === 'simple' ? PRICE_SIMPLE : PRICE_FULL;

  const handleAdd = () => {
    cart.addToCart({
      name: `Pack IA Premium (${option === 'simple' ? 'Essentiel' : 'Accompagné'})`,
      price: currentPrice,
      type: 'ai_pack',
      details: option === 'simple' ? 'Recensement IA + Conseils' : 'Recensement IA + Coaching personnalisé',
      option: option
    });
  };

  return (
    <section id="ai-pack" className="py-24 bg-white dark:bg-slate-900 transition-colors relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-6">
              <Sparkles size={14}/> Nouveau : Spécial Productivité
            </div>
            <h2 className="text-4xl md:text-5xl font-black font-serif mb-6 leading-tight dark:text-white">
              Pack IA pour la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Recherche</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
              Ne perdez plus de temps. Nous avons sélectionné et testé les meilleures IA pour chaque étape de votre travail académique : rédaction, analyse de données, recherche de sources et correction.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "Catalogue d'IA classées par domaine (Rédaction, Traduction, Data)",
                "Guides d'utilisation & Prompts optimisés",
                "Mises à jour gratuites des nouveaux outils",
                option === 'accompagnement' ? "Coaching privé (1h) pour installer et configurer vos outils" : "Supports PDF détaillés"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <div className="mt-1 bg-green-500 text-white p-0.5 rounded-full"><Check size={12}/></div>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div className="p-4 bg-white/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><BrainCircuit size={32}/></div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold uppercase text-xs tracking-widest">Offre Lancement</div>
                    <div className="text-4xl font-black text-white">{currentPrice.toLocaleString()} F</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <button 
                    onClick={() => setOption('simple')}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${option === 'simple' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500'}`}
                   >
                     <Zap size={18} className="mx-auto mb-2"/> Pack Seul
                   </button>
                   <button 
                    onClick={() => setOption('accompagnement')}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${option === 'accompagnement' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500'}`}
                   >
                     <Rocket size={18} className="mx-auto mb-2"/> Pack + Coaching
                   </button>
                </div>

                <button 
                  onClick={handleAdd}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24}/> Ajouter au Panier
                </button>

                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium">
                   <div className="flex items-center gap-1"><ShieldCheck size={14}/> Accès Immédiat</div>
                   <div className="flex items-center gap-1"><Star size={14}/> Support 24/7</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AIPack;
