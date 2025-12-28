

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
  sessionId?: string; 
  quantity?: number;
  option?: 'simple' | 'accompagnement'; // Pour le pack IA
}

export interface Transaction {
  id: string;
  name: string;
  phone: string;
  email: string;
  method: 'tmoney' | 'flooz';
  paymentRef?: string;
  amount: number;
  type: string; // 'formation_full', 'inscription', 'reservation', 'service', 'ai_pack'
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  isCompleted?: boolean; // NOUVEAU : Pour débloquer le certificat
  date: string;
  code?: string;
  codeExpiresAt?: number;
  items: CartItem[];
  serviceProgress?: number;
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

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  registeredAt: string;
}

// Added missing CustomerInfo interface for checkout processing
export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  paymentMethod: 'tmoney' | 'flooz';
  paymentRef: string;
}
