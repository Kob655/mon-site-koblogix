// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionInfo, Transaction, Notification, User } from '../types';
import { SESSIONS_DATA as INITIAL_SESSIONS } from '../constants';

// --- UTILS INDEXEDDB (Base de données locale gros volume) ---
const DB_NAME = 'KOBLOGIX_DB_V5'; 
const STORE_NAME = 'koblogix_store';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 5);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbSave = async (key: string, data: any) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (err) {
    console.error("Erreur sauvegarde DB", err);
  }
};

const dbGet = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error("Erreur lecture DB", err);
    return null;
  }
};
// -------------------------------------------------------------

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
  updateTransactionStatus: (id: number, status: 'approved' | 'rejected') => void;
  updateServiceProgress: (id: number, progress: number, fileData?: { name: string, url: string }) => void;
  deleteTransaction: (id: number) => void;
  clearTransactions: () => void;
  regenerateCode: (id: number) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  getSession: (id: string) => SessionInfo | undefined;
  registerUser: (user: Omit<User, 'id' | 'registeredAt'>) => void;
  logoutUser: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 1. Sessions (Léger -> LocalStorage OK)
  const [sessions, setSessions] = useState<SessionInfo[]>(() => {
    const saved = localStorage.getItem('koblogix_sessions_v3'); 
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  // 2. Transactions (LOURD -> IndexedDB)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 3. Users (Léger -> LocalStorage OK)
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

  // 4. Global Resources (LOURD -> IndexedDB)
  const [globalResources, setGlobalResources] = useState<GlobalResources>({ whatsappLink: 'https://chat.whatsapp.com/E4IbdUyvrVt6l0xwD7WE3n' });

  const [isAdminOpen, setAdminOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- CHARGEMENT INITIAL (IndexedDB) ---
  useEffect(() => {
    const loadData = async () => {
      const savedTx = await dbGet('transactions');
      if (savedTx) setTransactions(savedTx);

      const savedRes = await dbGet('globalResources');
      if (savedRes) setGlobalResources(savedRes);

      setIsDataLoaded(true);
    };
    loadData();
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('koblogix_sessions_v3', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('koblogix_users', JSON.stringify(users)), [users]);
  useEffect(() => {
      if (currentUser) localStorage.setItem('koblogix_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('koblogix_current_user');
  }, [currentUser]);
  useEffect(() => localStorage.setItem('koblogix_admin_pass', adminPassword), [adminPassword]);

  useEffect(() => {
    if (isDataLoaded) {
       dbSave('transactions', transactions);
    }
  }, [transactions, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
       dbSave('globalResources', globalResources);
    }
  }, [globalResources, isDataLoaded]);


  // --- LOGIQUE MÉTIER ---

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addTransaction = (t: Omit<Transaction, 'id' | 'status' | 'date'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: Math.floor(Math.random() * 1000000) + 1000,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      serviceProgress: 0 
    };
    setTransactions(prev => [newTransaction, ...prev]);
    addNotification('Commande enregistrée avec succès !', 'success');
  };

  const generateSecureCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KOB-${result}`;
  };

  const updateTransactionStatus = (id: number, status: 'approved' | 'rejected') => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx) return;

    if (status === 'approved' && targetTx.status === 'approved') return; 

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
        addNotification(`Stock mis à jour pour la commande #${id}`, 'success');
    }

    setTransactions(prevTransactions => prevTransactions.map(t => {
        if (t.id === id) {
             const updates: Partial<Transaction> = { status: status };
             if (status === 'approved') {
                 updates.code = generateSecureCode();
                 // CHANGE: Validité de 3 minutes (3 * 60 * 1000 ms)
                 updates.codeExpiresAt = Date.now() + (3 * 60 * 1000); 
                 updates.serviceProgress = 5; 
             }
             return { ...t, ...updates };
        }
        return t;
    }));

    if (status === 'rejected') addNotification(`Transaction #${id} rejetée`, 'error');
  };

  const updateServiceProgress = (id: number, progress: number, fileData?: { name: string, url: string }) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updates: Partial<Transaction> = { serviceProgress: progress };
        if (fileData) {
          updates.deliveredFile = {
            name: fileData.name,
            url: fileData.url,
            deliveredAt: new Date().toISOString()
          };
          updates.serviceProgress = 100;
        }
        return { ...t, ...updates };
      }
      return t;
    }));
    
    if (fileData) addNotification('Fichier livré au client avec succès !', 'success');
    else addNotification('Avancement mis à jour', 'info');
  };

  const updateGlobalResource = (key: keyof GlobalResources, value: any) => {
      setGlobalResources(prev => ({ ...prev, [key]: value }));
      addNotification('Ressource mise à jour avec succès', 'success');
  };

  const deleteTransaction = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    addNotification(`Transaction #${id} supprimée`, 'info');
  };

  const clearTransactions = () => {
    setTransactions([]);
    addNotification('Historique vidé.', 'success');
  };

  const regenerateCode = (id: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          code: generateSecureCode(),
          // CHANGE: Validité de 3 minutes lors de la régénération aussi
          codeExpiresAt: Date.now() + (3 * 60 * 1000)
        };
      }
      return t;
    }));
    addNotification('Nouveau code généré (Valide 3 min)', 'info');
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