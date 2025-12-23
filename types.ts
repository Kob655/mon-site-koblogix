
export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  iconName: string;
  minPriceLabel: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  type: string;
  details?: string;
  sessionId?: string; // Link to specific session for inventory
  quantity?: number;
}

export interface Transaction {
  id: number;
  name: string;
  phone: string;
  email: string;
  method: 'tmoney' | 'flooz';
  paymentRef?: string; // The SMS Reference ID from the user
  amount: number;
  type: string; // 'formation_full', 'inscription', 'reservation', 'service'
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  code?: string; // The access code generated
  codeExpiresAt?: number; // Timestamp for expiry
  items: CartItem[];
  // NOUVEAUX CHAMPS POUR LES SERVICES
  serviceProgress?: number; // 0 à 100
  deliveredFile?: {
    name: string;
    url: string;
    deliveredAt: string;
  };
}

export interface SessionInfo {
  id: string;
  title: string;
  dates: string;
  available: number;
  total: number;
}

export enum ServiceType {
  CV = 'cv',
  RAPPORT = 'rapport',
  POSTER = 'poster',
  MEMOIRE = 'memoire',
  PRESENTATION = 'presentation',
  PROJET = 'projet'
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  paymentMethod: 'tmoney' | 'flooz';
  paymentRef: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Stored locally for simulation
  registeredAt: string;
}
