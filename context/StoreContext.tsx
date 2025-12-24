
// @refresh reset
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionInfo, Transaction, Notification, User } from '../types';
import { SESSIONS_DATA as INITIAL_SESSIONS } from '../constants';
import { db, storage } from '../firebase'; 
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  increment,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

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
  updateSession: (id: string, data: Partial<SessionInfo>) => void;
  resetSessionSeats: (id: string) => void;
  registerUser: (user: Omit<User, 'id' | 'registeredAt'>) => void;
  logoutUser: () => void;
  uploadFileToStorage: (file: File, path: string) => Promise<string>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // 1. Sessions
  const [sessions, setSessions] = useState<SessionInfo[]>(INITIAL_SESSIONS);

  // 2. Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 3. Users
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

  // 4. Global Resources
  const [globalResources, setGlobalResources] = useState<GlobalResources>({ whatsappLink: 'https://chat.whatsapp.com/E4IbdUyvrVt6l0xwD7WE3n' });

  const [isAdminOpen, setAdminOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- INITIALISATION SESSIONS DANS FIRESTORE ---
  useEffect(() => {
    const initSessions = async () => {
       try {
           const sessionsRef = collection(db, "sessions");
           const unsubscribe = onSnapshot(sessionsRef, (snapshot) => {
             if (snapshot.empty) {
                INITIAL_SESSIONS.forEach(async (s) => {
                    await setDoc(doc(db, "sessions", s.id), s);
                });
             } else {
                const fetchedSessions = snapshot.docs.map(doc => doc.data() as SessionInfo);
                setSessions(fetchedSessions.sort((a,b) => a.id.localeCompare(b.id)));
             }
           }, (error) => {
               console.error("Erreur connexion Firestore (Sessions):", error);
           });
           return () => unsubscribe();
       } catch (e) {
           console.error("Erreur init sessions:", e);
       }
    };
    initSessions();
  }, []);

  // --- LISTENER TRANSACTIONS ---
  useEffect(() => {
    try {
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
            console.error("Erreur connexion Firestore (Orders):", error);
        });
        return () => unsubscribe();
    } catch (e) {
        console.error("Erreur init transactions:", e);
    }
  }, []);

  // --- LISTENER GLOBAL RESOURCES ---
  useEffect(() => {
      try {
          const docRef = doc(db, "settings", "global");
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
              if (docSnap.exists()) {
                  setGlobalResources(docSnap.data() as GlobalResources);
              } else {
                  setDoc(docRef, { whatsappLink: 'https://chat.whatsapp.com/E4IbdUyvrVt6l0xwD7WE3n' });
              }
          }, (error) => {
               console.error("Erreur connexion Firestore (Settings):", error);
          });
          return () => unsubscribe();
      } catch (e) {
          console.error("Erreur init resources:", e);
      }
  }, []);

  // --- PERSISTENCE LOCALE ---
  useEffect(() => localStorage.setItem('koblogix_users', JSON.stringify(users)), [users]);
  useEffect(() => {
      if (currentUser) localStorage.setItem('koblogix_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('koblogix_current_user');
  }, [currentUser]);
  useEffect(() => localStorage.setItem('koblogix_admin_pass', adminPassword), [adminPassword]);


  // --- LOGIQUE MÉTIER ---

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
      try {
          // Check config presence
          if (!storage || !storage.app.options.projectId || storage.app.options.projectId.includes("VOTRE_")) {
               throw new Error("Configuration Firebase invalide dans firebase.ts");
          }

          const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          return url;
      } catch (error: any) {
          console.error("Erreur upload détaillée:", error);
          if (error.code === 'storage/unauthorized') {
              throw new Error("Permission refusée. Vérifiez les Règles Storage dans la console Firebase.");
          } else if (error.message && error.message.includes("Configuration Firebase invalide")) {
              throw new Error("Veuillez configurer firebase.ts avec vos vraies clés.");
          }
          throw new Error("Échec upload: " + (error.message || "Erreur inconnue"));
      }
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, "orders"), {
        ...t,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        serviceProgress: 0,
        items: t.items || []
      });
      addNotification('Commande envoyée au serveur !', 'success');
    } catch (e) {
      console.error("Erreur ajout commande:", e);
      addNotification('Erreur lors de l\'envoi. Vérifiez la config Firebase.', 'error');
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

  const manageSessionSeat = async (items: any[], action: 'block' | 'release') => {
     items.forEach(async (item) => {
        if (item.sessionId) {
            const sessionRef = doc(db, "sessions", item.sessionId);
            try {
                const incrementValue = action === 'release' ? 1 : -1;
                await updateDoc(sessionRef, {
                    available: increment(incrementValue)
                });
            } catch (e) {
                console.error(`Erreur mise à jour place session ${item.sessionId}`, e);
            }
        }
     });
  };

  const updateTransactionStatus = async (id: string, status: 'approved' | 'rejected') => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx) return;

    if (status === 'approved' && targetTx.status === 'approved') return;

    try {
      const updates: any = { status: status };
      
      if (status === 'approved') {
         updates.code = generateSecureCode();
         updates.codeExpiresAt = Date.now() + (3 * 60 * 1000); 
         updates.serviceProgress = 5; 
         
         await manageSessionSeat(targetTx.items, 'block');
         addNotification(`Transaction validée et place réservée.`, 'success');
      } else if (status === 'rejected') {
          addNotification(`Transaction rejetée`, 'info');
      }
      
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, updates);
      
    } catch (e) {
      console.error("Erreur update status:", e);
      addNotification('Erreur mise à jour. Vérifiez Firebase.', 'error');
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

  const updateGlobalResource = async (key: keyof GlobalResources, value: any) => {
      try {
          const docRef = doc(db, "settings", "global");
          await updateDoc(docRef, { [key]: value });
          addNotification('Ressource mise à jour (Synchronisé)', 'success');
      } catch (e) {
          console.error("Erreur update resource", e);
          await setDoc(doc(db, "settings", "global"), { [key]: value }, { merge: true });
      }
  };

  const deleteTransaction = async (id: string) => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx) return;

    try {
      if (targetTx.status === 'approved') {
          await manageSessionSeat(targetTx.items, 'release');
          addNotification('Place libérée suite à la suppression.', 'info');
      }

      await deleteDoc(doc(db, "orders", id));
      addNotification(`Transaction supprimée`, 'info');
    } catch (e) {
      console.error("Erreur suppression:", e);
      addNotification('Erreur suppression.', 'error');
    }
  };

  const clearTransactions = async () => {
    for (const t of transactions) {
        await deleteTransaction(t.id);
    }
    addNotification('Historique vidé et places libérées.', 'success');
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

  const updateSession = async (id: string, data: Partial<SessionInfo>) => {
      try {
          const docRef = doc(db, "sessions", id);
          await updateDoc(docRef, data);
          addNotification('Session mise à jour', 'success');
      } catch(e) {
          addNotification('Erreur mise à jour session', 'error');
      }
  };

  const resetSessionSeats = async (id: string) => {
      const session = sessions.find(s => s.id === id);
      if(session) {
          updateSession(id, { available: session.total });
          addNotification(`Places réinitialisées pour ${session.title}`, 'success');
      }
  };

  const updateAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    addNotification('Mot de passe admin mis à jour', 'success');
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
      addNotification, removeNotification, getSession, updateSession, resetSessionSeats, registerUser, logoutUser,
      uploadFileToStorage
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
