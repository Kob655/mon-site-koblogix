import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Formation from './components/Formation';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import Testimonials from './components/Testimonials';
import Calculator from './components/Calculator';
import Resources from './components/Resources';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import AdminPanel from './components/AdminPanel';
import CheckoutModal from './components/CheckoutModal';
import Notifications from './components/Notifications';
import SocialProof from './components/SocialProof';
import BibtexGenerator from './components/BibtexGenerator';
import Ambassador from './components/Ambassador';
import RevealOnScroll from './components/ui/RevealOnScroll';
import ScrollProgress from './components/ui/ScrollProgress';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { StoreProvider } from './context/StoreContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StoreProvider>
        <CartProvider>
          <div className="font-sans text-[#2c3e50] dark:text-gray-100 antialiased scroll-smooth transition-colors duration-300 bg-[#fdfbf7] dark:bg-slate-900">
            <ScrollProgress />
            <Navbar />
            <Notifications />
            <SocialProof /> {/* Innovation: FOMO */}
            <main>
              {/* 1. L'ACCROCHE */}
              <Hero />
              
              {/* 2. LA PREUVE VISUELLE */}
              <RevealOnScroll>
                <Portfolio />
              </RevealOnScroll>

              {/* 3. L'OFFRE PHARE */}
              <RevealOnScroll>
                <Formation />
              </RevealOnScroll>
              
              {/* INNOVATION : PROGRAMME AMBASSADEUR */}
              <RevealOnScroll>
                <Ambassador />
              </RevealOnScroll>
              
              {/* 4. LE SERVICE */}
              <RevealOnScroll>
                <Services />
              </RevealOnScroll>

              {/* INNOVATION : LEAD MAGNET (Outil Gratuit) */}
              <RevealOnScroll>
                <BibtexGenerator />
              </RevealOnScroll>

              {/* 5. L'OUTIL D'ENGAGEMENT */}
              <RevealOnScroll>
                <Calculator />
              </RevealOnScroll>
              
              {/* 6. LA RÉASSURANCE */}
              <RevealOnScroll>
                <Testimonials />
              </RevealOnScroll>

              <RevealOnScroll>
                 <FAQ />
              </RevealOnScroll>
              
              {/* 7. L'ESPACE CLIENT (Avec Certificat) */}
              <RevealOnScroll>
                <Resources />
              </RevealOnScroll>
            </main>
            <Footer />
            
            {/* Overlays */}
            <CartSidebar />
            <CheckoutModal />
            <AdminPanel />
          </div>
        </CartProvider>
      </StoreProvider>
    </ThemeProvider>
  );
};

export default App;