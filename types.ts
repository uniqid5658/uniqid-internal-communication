
export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  DRIVER = 'DRIVER',
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
  CHECK = 'CHECK', // Added for snapshot updates
}

export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  password?: string; // Added for auth
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
  brand?: string; // Added
  location?: string; // Added (e.g. Warehouse Rack)
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
  deliveryStatus?: DeliveryStatus; // Added for Delivery module
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

export type MeetingType = 'STAFF' | 'CLIENT' | 'TRADE' | 'SUPPLY';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  meetingType: MeetingType; 
  participantIds: string[]; // Changed from isClientMeeting to specific list
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