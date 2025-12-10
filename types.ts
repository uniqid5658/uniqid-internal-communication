export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum ProjectStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum MaterialTransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  status: ProjectStatus;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  notes: string;
}

export interface MaterialTransaction {
  id: string;
  materialId: string;
  projectId?: string;
  type: MaterialTransactionType;
  quantity: number;
  performedBy: string; // User ID
  memo: string;
  createdAt: string;
}

export interface WorkerSchedule {
  id: string;
  userId: string;
  projectId: string;
  roleOnSite: string;
  startDatetime: string;
  endDatetime: string;
  notes: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  isClientMeeting: boolean;
  meetingType: 'INTERNAL' | 'CLIENT' | 'SUPPLIER';
  startDatetime: string;
  endDatetime: string;
  location: string;
  createdBy: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId?: string;
  externalName?: string;
  externalEmail?: string;
  role: string;
}

// For UI State
export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}
