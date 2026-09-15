export interface UserUsage {
  documentsCount: number;
  aiQueriesUsed: number;
  storageBytes: number;
  maxStorageBytes: number;
}

export interface UserPreferences {
  defaultFont?: string;
  signatureDataUrl?: string;
  theme?: 'light' | 'dark' | 'system';
  autoSaveInterval?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: number;
  lastLoginAt: number;
  usage: UserUsage;
  preferences?: UserPreferences;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}
