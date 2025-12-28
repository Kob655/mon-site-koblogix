
// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionInfo, Transaction, Notification, User } from '../types';
import { SESSIONS_DATA as INITIAL_SESSIONS } from '../constants';
import { db } from '../firebase'; 
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, query, orderBy, increment, Timestamp 
} from 'firebase/firestore';

interface GlobalResources {
  inscriptionUrl?: string; // Changé de file object à string (URL Drive)
  contractUrl?: string;
  courseContentUrl?: string;
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
  updateGlobalResource: (key: keyof GlobalResources, value: string) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'status' | 'date'>) => void;
  updateTransactionStatus: (id: string, status: 'approved' | 'rejected') => void;
  toggleCompletion: (id: string) => void; // NOUVEAU
  updateServiceProgress: (id: string, progress: number, fileData?: { name: string, url: string }) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
  regenerateCode: (id: string) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  getSession: (id: string) => SessionInfo | undefined;
  updateSession: (id: string, data: Partial<SessionInfo>) => void;
  resetSessionSeats: (id: string) => void;
  registerUser: (user: Omit<User, 'id' | 'registeredAt'>) => void;
  logoutUser: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<SessionInfo[]>(INITIAL_SESSIONS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('koblogix_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('koblogix_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('koblogix_admin_pass') || 'admin123');
  const [globalResources, setGlobalResources] = useState<GlobalResources>({});
  const [isAdminOpen, setAdminOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const sessionsRef = collection(db, "sessions");
    return onSnapshot(sessionsRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_SESSIONS.forEach(s => setDoc(doc(db, "sessions", s.id), s));
      } else {
        const fetched = snapshot.docs.map(doc => doc.data() as SessionInfo);
        setSessions(fetched.sort((a,b) => a.id.localeCompare(b.id)));
      }
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });
  }, []);

  useEffect(() => {
    const docRef = doc(db, "settings", "global");
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setGlobalResources(docSnap.data() as GlobalResources);
    });
  }, []);

  useEffect(() => localStorage.setItem('koblogix_users', JSON.stringify(users)), [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('koblogix_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('koblogix_current_user');
  }, [currentUser]);
  useEffect(() => localStorage.setItem('koblogix_admin_pass', adminPassword), [adminPassword]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const addTransaction = async (t: Omit<Transaction, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, "orders"), {
        ...t,
        status: 'pending',
        isCompleted: false,
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        serviceProgress: 0,
      });
      addNotification('Commande envoyée !', 'success');
    } catch (e) {
      addNotification('Erreur de connexion Firebase.', 'error');
    }
  };

  const updateTransactionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const target = transactions.find(t => t.id === id);
      if (!target) return;
      const updates: any = { status };
      if (status === 'approved') {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'KOB-';
        for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        updates.code = code;
        updates.codeExpiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48h par défaut
      }
      await updateDoc(doc(db, "orders", id), updates);
      addNotification(`Statut mis à jour : ${status}`, 'success');
    } catch (e) {
      addNotification('Erreur mise à jour.', 'error');
    }
  };

  const toggleCompletion = async (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;
    try {
      const newState = !target.isCompleted;
      await updateDoc(doc(db, "orders", id), { isCompleted: newState });
      addNotification(newState ? "Formation marquée comme terminée ! Certificat débloqué." : "Statut de complétion retiré.", "info");
    } catch (e) {
      addNotification("Erreur lors du changement de statut.", "error");
    }
  };

  const updateServiceProgress = async (id: string, progress: number, fileData?: { name: string, url: string }) => {
    const updates: any = { serviceProgress: progress };
    if (fileData) {
      updates.deliveredFile = { ...fileData, deliveredAt: new Date().toISOString() };
      updates.serviceProgress = 100;
    }
    await updateDoc(doc(db, "orders", id), updates);
    addNotification('Avancement mis à jour.', 'success');
  };

  const updateGlobalResource = async (key: keyof GlobalResources, value: string) => {
    await updateDoc(doc(db, "settings", "global"), { [key]: value });
    addNotification('Lien mis à jour.', 'success');
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, "orders", id));
    addNotification('Transaction supprimée.', 'info');
  };

  const clearTransactions = async () => {
    transactions.forEach(t => deleteDoc(doc(db, "orders", t.id)));
    addNotification('Historique vidé.', 'success');
  };

  const regenerateCode = async (id: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'KOB-';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    await updateDoc(doc(db, "orders", id), { code, codeExpiresAt: Date.now() + (48 * 60 * 60 * 1000) });
    addNotification('Nouveau code généré.', 'info');
  };

  const updateSession = async (id: string, data: Partial<SessionInfo>) => {
    await updateDoc(doc(db, "sessions", id), data);
    addNotification('Session mise à jour.', 'success');
  };

  const resetSessionSeats = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if(session) await updateDoc(doc(db, "sessions", id), { available: session.total });
  };

  const updateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    addNotification('Mot de passe admin mis à jour.', 'success');
  };

  const getSession = (id: string) => sessions.find(s => s.id === id);

  const registerUser = (userData: Omit<User, 'id' | 'registeredAt'>) => {
    const newUser: User = { ...userData, id: Math.random().toString(36).substr(2, 9), registeredAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    addNotification(`Bienvenue ${newUser.name} !`, 'success');
  };

  const logoutUser = () => {
    setCurrentUser(null);
    addNotification('Déconnecté.', 'info');
  };

  return (
    <StoreContext.Provider value={{ 
      sessions, transactions, notifications, users, currentUser, isAdminOpen, adminPassword, globalResources, 
      setAdminOpen, updateAdminPassword, updateGlobalResource, addTransaction, updateTransactionStatus, toggleCompletion,
      updateServiceProgress, deleteTransaction, clearTransactions, regenerateCode, addNotification, removeNotification, 
      getSession, updateSession, resetSessionSeats, registerUser, logoutUser
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
