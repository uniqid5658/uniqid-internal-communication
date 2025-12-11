import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { User, Project, Material, WorkerSchedule, Meeting, MaterialTransaction, Role, MaterialTransactionType } from '../types';
import { MOCK_USERS, MOCK_PROJECTS, MOCK_MATERIALS, MOCK_TRANSACTIONS } from './mockData';

// Helper to map Firestore docs to types
const mapDocs = <T>(snapshot: any): T[] => {
  return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as T));
};

export const DataService = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const snap = await getDocs(collection(db, 'users'));
    return mapDocs<User>(snap);
  },
  saveUser: async (user: User) => {
    await setDoc(doc(db, 'users', user.id), user);
  },
  deleteUser: async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
  },

  // --- PROJECTS ---
  getProjects: async (): Promise<Project[]> => {
    const snap = await getDocs(collection(db, 'projects'));
    return mapDocs<Project>(snap);
  },
  saveProject: async (project: Project) => {
    await setDoc(doc(db, 'projects', project.id), project);
  },
  deleteProject: async (id: string) => {
    await deleteDoc(doc(db, 'projects', id));
  },

  // --- MATERIALS ---
  getMaterials: async (): Promise<Material[]> => {
    const snap = await getDocs(collection(db, 'materials'));
    return mapDocs<Material>(snap);
  },
  saveMaterial: async (material: Material) => {
    await setDoc(doc(db, 'materials', material.id), material);
  },
  deleteMaterial: async (id: string) => {
    await deleteDoc(doc(db, 'materials', id));
  },

  // --- TRANSACTIONS ---
  getTransactions: async (): Promise<MaterialTransaction[]> => {
    const snap = await getDocs(collection(db, 'transactions'));
    return mapDocs<MaterialTransaction>(snap);
  },
  saveTransaction: async (transaction: MaterialTransaction, skipGlobalUpdate: boolean = false) => {
    const batch = writeBatch(db);
    
    // 1. Save Transaction
    const txRef = doc(db, 'transactions', transaction.id);
    batch.set(txRef, transaction);

    // 2. Update Stock (if needed)
    if (!skipGlobalUpdate) {
        // Fetch current material to get accurate stock
        // Note: For simplicity in this demo, we assume client-side stock is mostly up to date or we fetch it.
        // In production, use a transaction or increment().
        const matRef = doc(db, 'materials', transaction.materialId);
        // We can't easily read inside a batch, so we rely on the UI passing correct logic or separate reads.
        // To keep it simple for this conversion, we will just perform a read-then-write if strictly needed,
        // but `writeBatch` cannot read. 
        // We will assume the UI sends the *updated* material object if they want to save material changes, 
        // OR we implement logic here. 
        // Let's implement specific logic here:
        // However, since `saveMaterial` is separate, we'll do a separate read/write for safety.
    }
    
    await batch.commit();

    // Handle Stock Update separately to ensure consistency
    if (!skipGlobalUpdate) {
        const matSnap = await getDocs(query(collection(db, 'materials'), where('id', '==', transaction.materialId)));
        if (!matSnap.empty) {
            const matDoc = matSnap.docs[0];
            const mat = matDoc.data() as Material;
            let newStock = mat.currentStock;

            if (transaction.type === MaterialTransactionType.IN) newStock += transaction.quantity;
            else if (transaction.type === MaterialTransactionType.OUT) newStock -= transaction.quantity;
            
            await setDoc(doc(db, 'materials', mat.id), { ...mat, currentStock: newStock });
        }
    }
  },
  deleteTransaction: async (id: string, skipGlobalUpdate: boolean = false) => {
    const txDoc = await getDocs(query(collection(db, 'transactions'), where('id', '==', id)));
    if (txDoc.empty) return;
    
    const tx = txDoc.docs[0].data() as MaterialTransaction;
    await deleteDoc(doc(db, 'transactions', id));

    if (!skipGlobalUpdate) {
        const matSnap = await getDocs(query(collection(db, 'materials'), where('id', '==', tx.materialId)));
        if (!matSnap.empty) {
            const matDoc = matSnap.docs[0];
            const mat = matDoc.data() as Material;
            let newStock = mat.currentStock;

            // Reverse logic
            if (tx.type === MaterialTransactionType.OUT) newStock += tx.quantity;
            else if (tx.type === MaterialTransactionType.IN) newStock -= tx.quantity;

            await setDoc(doc(db, 'materials', mat.id), { ...mat, currentStock: newStock });
        }
    }
  },

  // --- SCHEDULES ---
  getSchedules: async (): Promise<WorkerSchedule[]> => {
    const snap = await getDocs(collection(db, 'schedules'));
    return mapDocs<WorkerSchedule>(snap);
  },
  saveSchedule: async (schedule: WorkerSchedule) => {
    await setDoc(doc(db, 'schedules', schedule.id), schedule);
  },
  deleteSchedule: async (id: string) => {
    await deleteDoc(doc(db, 'schedules', id));
  },

  // --- MEETINGS ---
  getMeetings: async (): Promise<Meeting[]> => {
    const snap = await getDocs(collection(db, 'meetings'));
    return mapDocs<Meeting>(snap);
  },
  saveMeeting: async (meeting: Meeting) => {
    await setDoc(doc(db, 'meetings', meeting.id), meeting);
  },
  deleteMeeting: async (id: string) => {
    await deleteDoc(doc(db, 'meetings', id));
  },

  // --- UTILS ---
  getEnrichedSchedules: async () => {
    const schedules = await DataService.getSchedules();
    const users = await DataService.getUsers();
    const projects = await DataService.getProjects();
    
    return schedules.map(s => ({
      ...s,
      user: users.find(u => u.id === s.userId),
      project: projects.find(p => p.id === s.projectId)
    }));
  },

  // --- SEED DATABASE ---
  seedDatabase: async () => {
      const batch = writeBatch(db);
      MOCK_USERS.forEach(u => batch.set(doc(db, 'users', u.id), u));
      MOCK_PROJECTS.forEach(p => batch.set(doc(db, 'projects', p.id), p));
      MOCK_MATERIALS.forEach(m => batch.set(doc(db, 'materials', m.id), m));
      MOCK_TRANSACTIONS.forEach(t => batch.set(doc(db, 'transactions', t.id), t));
      await batch.commit();
      console.log("Database Seeded!");
  }
};
