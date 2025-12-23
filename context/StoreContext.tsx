
// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionInfo, Transaction, Notification, User } from '../types';
import { SESSIONS_DATA as INITIAL_SESSIONS } from '../constants';
import { db } from '../firebase'; // Import Firebase configuration
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

// Interface pour les ressources globales
interface GlobalResources {
  inscriptionFile?: { name: string, url: string };
  contractFile?: { name: string, url: string };
  courseContentFile?: { name: string, url: string };
  whatsappLink?: string;
}

interface StoreContextType {
  sessions: SessionInfo[];
  transactions: Transaction[];
  notifications: Notification[];
  users: User[];
  currentUser: User | null;
  isAdminOpen: boolean;
  adminPassword: string;
  globalResources: GlobalResources; 
  setAdminOpen: (isOpen: boolean) => void;
  updateAdminPassword: (newPass: string) => void;
  updateGlobalResource: (key: keyof GlobalResources, value: any) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'status' | 'date'>) => void;
  updateTransactionStatus: (id: string, status: 'approved' | 'rejected') => void;
  updateServiceProgress: (id: string, progress: number, fileData?: { name: string, url: string }) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
  regenerateCode: (id: string) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  getSession: (id: string) => SessionInfo | undefined;
  registerUser: (user: Omit<User, 'id' | 'registeredAt'>) => void;
  logoutUser: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // 1. Sessions (Local Storage - Configuration statique/semi-dynamique)
  const [sessions, setSessions] = useState<SessionInfo[]>(() => {
    const saved = localStorage.getItem('koblogix_sessions_v3'); 
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  // 2. Transactions (FIREBASE FIRESTORE)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 3. Users (Local Storage pour simulation auth client simple)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('koblogix_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('koblogix_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('koblogix_admin_pass') || 'admin123';
  });

  // 4. Global Resources (Local Storage pour l'instant, pourrait aussi passer sur Firebase)
  const [globalResources, setGlobalResources] = useState<GlobalResources>(() => {
    const saved = localStorage.getItem('koblogix_resources');
    return saved ? JSON.parse(saved) : { whatsappLink: 'https://chat.whatsapp.com/E4IbdUyvrVt6l0xwD7WE3n' };
  });

  const [isAdminOpen, setAdminOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- LISTENER FIREBASE (Lecture Temps Réel) ---
  useEffect(() => {
    // On écoute la collection "orders" (ou transactions)
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTransactions: Transaction[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          method: data.method,
          paymentRef: data.paymentRef,
          amount: data.amount,
          type: data.type,
          status: data.status,
          date: data.date,
          code: data.code,
          codeExpiresAt: data.codeExpiresAt,
          items: data.items || [],
          serviceProgress: data.serviceProgress,
          deliveredFile: data.deliveredFile
        } as Transaction;
      });
      setTransactions(fetchedTransactions);
    }, (error) => {
      console.error("Erreur Firebase:", error);
      addNotification("Erreur de connexion à la base de données", "error");
    });

    return () => unsubscribe();
  }, []);

  // --- PERSISTENCE LOCALE ---
  useEffect(() => localStorage.setItem('koblogix_sessions_v3', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('koblogix_users', JSON.stringify(users)), [users]);
  useEffect(() => {
      if (currentUser) localStorage.setItem('koblogix_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('koblogix_current_user');
  }, [currentUser]);
  useEffect(() => localStorage.setItem('koblogix_admin_pass', adminPassword), [adminPassword]);
  useEffect(() => localStorage.setItem('koblogix_resources', JSON.stringify(globalResources)), [globalResources]);


  // --- LOGIQUE MÉTIER ---

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // AJOUT DANS FIREBASE
  const addTransaction = async (t: Omit<Transaction, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, "orders"), {
        ...t,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(), // Pour le tri
        serviceProgress: 0,
        items: t.items || []
      });
      addNotification('Commande envoyée au serveur !', 'success');
    } catch (e) {
      console.error("Erreur ajout commande:", e);
      addNotification('Erreur lors de l\'envoi de la commande.', 'error');
    }
  };

  const generateSecureCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KOB-${result}`;
  };

  // MISE A JOUR FIREBASE
  const updateTransactionStatus = async (id: string, status: 'approved' | 'rejected') => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx) return;

    if (status === 'approved' && targetTx.status === 'approved') return; 

    // Gestion stock sessions (Local pour l'instant, idéalement à migrer sur Firebase aussi)
    if (status === 'approved') {
        setSessions(prevSessions => {
            return prevSessions.map(session => {
                const isLinkedToSession = targetTx.items.some(item => item.sessionId === session.id);
                if (isLinkedToSession) {
                    const newAvailable = Math.max(0, session.available - 1);
                    return { ...session, available: newAvailable };
                }
                return session;
            });
        });
        addNotification(`Stock mis à jour pour la commande`, 'success');
    }

    try {
      const updates: any = { status: status };
      if (status === 'approved') {
         updates.code = generateSecureCode();
         updates.codeExpiresAt = Date.now() + (3 * 60 * 1000); // 3 minutes
         updates.serviceProgress = 5; 
      }
      
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, updates);
      
      if (status === 'rejected') addNotification(`Transaction rejetée`, 'error');
    } catch (e) {
      console.error("Erreur update status:", e);
      addNotification('Erreur mise à jour.', 'error');
    }
  };

  const updateServiceProgress = async (id: string, progress: number, fileData?: { name: string, url: string }) => {
    try {
      const docRef = doc(db, "orders", id);
      const updates: any = { serviceProgress: progress };
      
      if (fileData) {
        updates.deliveredFile = {
          name: fileData.name,
          url: fileData.url,
          deliveredAt: new Date().toISOString()
        };
        updates.serviceProgress = 100;
      }
      
      await updateDoc(docRef, updates);
      
      if (fileData) addNotification('Fichier livré au client avec succès !', 'success');
      else addNotification('Avancement mis à jour', 'info');
    } catch (e) {
      console.error("Erreur update progress:", e);
      addNotification('Erreur mise à jour progression.', 'error');
    }
  };

  const updateGlobalResource = (key: keyof GlobalResources, value: any) => {
      setGlobalResources(prev => ({ ...prev, [key]: value }));
      addNotification('Ressource mise à jour avec succès', 'success');
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
      addNotification(`Transaction supprimée`, 'info');
    } catch (e) {
      console.error("Erreur suppression:", e);
      addNotification('Erreur suppression.', 'error');
    }
  };

  const clearTransactions = async () => {
    // Attention : Firestore ne permet pas de supprimer une collection d'un coup côté client facilement
    // On supprime un par un pour l'instant (déconseillé pour gros volumes, mais ok ici)
    const promises = transactions.map(t => deleteDoc(doc(db, "orders", t.id)));
    await Promise.all(promises);
    addNotification('Historique vidé.', 'success');
  };

  const regenerateCode = async (id: string) => {
    try {
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, {
        code: generateSecureCode(),
        codeExpiresAt: Date.now() + (3 * 60 * 1000)
      });
      addNotification('Nouveau code généré (Valide 3 min)', 'info');
    } catch (e) {
      console.error("Erreur regen code:", e);
      addNotification('Erreur génération code.', 'error');
    }
  };

  const updateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    addNotification('Mot de passe mis à jour', 'success');
  };

  const getSession = (id: string) => sessions.find(s => s.id === id);

  const registerUser = (userData: Omit<User, 'id' | 'registeredAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      registeredAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    addNotification(`Bienvenue ${newUser.name} !`, 'success');
  };

  const logoutUser = () => {
    setCurrentUser(null);
    addNotification('À bientôt !', 'info');
  };

  return (
    <StoreContext.Provider value={{ 
      sessions, transactions, notifications, users, currentUser,
      isAdminOpen, adminPassword, globalResources, setAdminOpen, updateAdminPassword, updateGlobalResource,
      addTransaction, updateTransactionStatus, updateServiceProgress, deleteTransaction, clearTransactions, regenerateCode,
      addNotification, removeNotification, getSession, registerUser, logoutUser
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
