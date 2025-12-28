
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Rocket, Check, ShoppingCart, Zap, Star, ShieldCheck, FileCode, Search, BookOpen, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';

const AIPack: React.FC = () => {
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
      details: option === 'simple' ? 'Outils + Prompts + Guides' : 'Pack complet + 1h de Coaching privé',
      option: option
    });
  };

  return (
    <section id="ai-pack" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-4">
              <Sparkles size={14}/> Révolution Scientifique
            </div>
            <h2 className="text-4xl md:text-6xl font-black font-serif mb-6 dark:text-white">
              Le Pack IA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Ultime</span>
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
              Gagnez des mois de travail. Nous avons réuni les meilleurs outils et techniques pour booster votre productivité académique.
            </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          
          {/* Content Preview */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                {[
                    { icon: <Search className="text-blue-500"/>, title: "Moteurs de Recherche", desc: "Trouvez des sources fiables en 10 secondes." },
                    { icon: <FileCode className="text-purple-500"/>, title: "Bibliothèque de Prompts", desc: "Prompts optimisés pour thèses et articles." },
                    { icon: <BookOpen className="text-green-500"/>, title: "Guides Stratégiques", desc: "Comment utiliser l'IA sans plagier." },
                    { icon: <Layers className="text-orange-500"/>, title: "Analyse de PDF", desc: "Discutez avec vos articles de recherche." }
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="mb-3">{item.icon}</div>
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-blue-600 rounded-3xl text-white">
                <h4 className="font-bold mb-2 flex items-center gap-2"><Star size={18}/> Inclus dans le pack :</h4>
                <ul className="space-y-2 text-sm opacity-90">
                    <li className="flex items-center gap-2"><Check size={14}/> Liste de 15+ IA spécialisées</li>
                    <li className="flex items-center gap-2"><Check size={14}/> 10 Prompts "Copier-Coller" pour rédaction</li>
                    <li className="flex items-center gap-2"><Check size={14}/> Tutoriel d'installation Overleaf/LaTeX</li>
                    {option === 'accompagnement' && <li className="font-black text-yellow-300 flex items-center gap-2"><Zap size={14}/> + 1H de Coaching Privé via Zoom</li>}
                </ul>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="h-full">
            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl h-full flex flex-col justify-between border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-3xl"></div>
              
              <div>
                <div className="flex justify-between items-center mb-10">
                  <div className="p-4 bg-white/10 rounded-2xl text-blue-400"><BrainCircuit size={40}/></div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-1">Prix de Lancement</div>
                    <div className="text-5xl font-black text-white">{currentPrice.toLocaleString()} F</div>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                   <button 
                    onClick={() => setOption('simple')}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${option === 'simple' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                   >
                     <div>
                         <div className="font-bold">Pack Essentiel</div>
                         <div className="text-xs opacity-60">Accès à toutes les ressources numériques</div>
                     </div>
                     {option === 'simple' && <Check className="text-blue-500"/>}
                   </button>
                   <button 
                    onClick={() => setOption('accompagnement')}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${option === 'accompagnement' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                   >
                     <div>
                         <div className="font-bold">Pack + Accompagnement</div>
                         <div className="text-xs opacity-60">Ressources + 1h de Coaching Direct</div>
                     </div>
                     {option === 'accompagnement' && <Check className="text-purple-500"/>}
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleAdd}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24}/> Commander le Pack
                </button>
                <div className="flex items-center justify-center gap-6 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                   <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500"/> Accès Immédiat</div>
                   <div className="flex items-center gap-1"><Star size={14} className="text-yellow-500"/> Recommandé</div>
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
