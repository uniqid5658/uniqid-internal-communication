import { User, Role, Project, ProjectStatus, Material, MaterialTransaction, MaterialTransactionType } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@uniqid.com',
    phone: '+15550001',
    role: Role.ADMIN,
    avatarUrl: 'https://picsum.photos/100/100?random=1',
    password: 'admin123'
  },
  {
    id: 'u2',
    name: 'John Carpenter',
    email: 'staff@uniqid.com',
    phone: '+15550002',
    role: Role.STAFF,
    avatarUrl: 'https://picsum.photos/100/100?random=2',
    password: 'staff123'
  },
  {
    id: 'u3',
    name: 'Sarah Electric',
    email: 'sarah@uniqid.com',
    phone: '+15550003',
    role: Role.STAFF,
    avatarUrl: 'https://picsum.photos/100/100?random=3',
    password: 'staff123'
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Skyline Penthouse Reno',
    clientName: 'Alice Morgan',
    clientEmail: 'alice@example.com',
    clientPhone: '555-1234',
    address: '101 Skyline Dr, Apt 4B',
    status: ProjectStatus.ACTIVE
  },
  {
    id: 'p2',
    name: 'Downtown Office Fitout',
    clientName: 'Tech Corp',
    clientEmail: 'contact@techcorp.com',
    clientPhone: '555-5678',
    address: '500 Market St, Floor 12',
    status: ProjectStatus.PLANNED
  },
  {
    id: 'p3',
    name: 'Lakeside Villa',
    clientName: 'Bob Smith',
    clientEmail: 'bob@example.com',
    clientPhone: '555-9999',
    address: '88 Lakeview Rd',
    status: ProjectStatus.COMPLETED
  }
];

export const MOCK_MATERIALS: Material[] = [
  {
    id: 'm1',
    name: 'Oak Flooring',
    category: 'Wood',
    brand: 'TimberKing',
    location: 'Rack A-01',
    unit: 'sqft',
    currentStock: 1500,
    minStockLevel: 500,
    notes: 'Premium grade'
  },
  {
    id: 'm2',
    name: 'White Paint (Matte)',
    category: 'Paint',
    brand: 'Dulux',
    location: 'Cabinet B',
    unit: 'gal',
    currentStock: 5,
    minStockLevel: 20,
    notes: 'Low VOC'
  },
  {
    id: 'm3',
    name: 'Ceramic Tiles (Gray)',
    category: 'Tiles',
    brand: 'Marazzi',
    location: 'Zone C',
    unit: 'box',
    currentStock: 40,
    minStockLevel: 50,
    notes: 'Kitchen backsplash'
  }
];

export const MOCK_TRANSACTIONS: MaterialTransaction[] = [
  {
    id: 't1',
    materialId: 'm1',
    projectId: 'p1',
    type: MaterialTransactionType.OUT,
    quantity: 200,
    performedBy: 'u2',
    memo: 'Living room flooring',
    createdAt: new Date().toISOString(),
    deliveryStatus: 'DELIVERED'
  },
  {
    id: 't2',
    materialId: 'm2',
    projectId: 'p1',
    type: MaterialTransactionType.OUT,
    quantity: 2,
    performedBy: 'u2',
    memo: 'First coat',
    createdAt: new Date().toISOString(),
    deliveryStatus: 'IN_TRANSIT'
  }
];