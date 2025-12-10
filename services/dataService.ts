import { MOCK_USERS, MOCK_PROJECTS, MOCK_MATERIALS } from './mockData';
import { User, Project, Material, WorkerSchedule, Meeting, MaterialTransaction } from '../types';

// Helper to simulate local storage persistence
const load = <T,>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const save = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const DataService = {
  getUsers: (): User[] => load('users', MOCK_USERS),
  
  getProjects: (): Project[] => load('projects', MOCK_PROJECTS),
  
  getMaterials: (): Material[] => load('materials', MOCK_MATERIALS),
  saveMaterial: (material: Material) => {
    const materials = DataService.getMaterials();
    const existing = materials.findIndex(m => m.id === material.id);
    if (existing >= 0) {
      materials[existing] = material;
    } else {
      materials.push(material);
    }
    save('materials', materials);
  },
  deleteMaterial: (id: string) => {
    const materials = DataService.getMaterials().filter(m => m.id !== id);
    save('materials', materials);
  },

  getSchedules: (): WorkerSchedule[] => load('schedules', []),
  saveSchedule: (schedule: WorkerSchedule) => {
    const schedules = DataService.getSchedules();
    const existing = schedules.findIndex(s => s.id === schedule.id);
    if (existing >= 0) {
      schedules[existing] = schedule;
    } else {
      schedules.push(schedule);
    }
    save('schedules', schedules);
  },
  deleteSchedule: (id: string) => {
     const schedules = DataService.getSchedules().filter(s => s.id !== id);
     save('schedules', schedules);
  },

  getMeetings: (): Meeting[] => load('meetings', []),
  saveMeeting: (meeting: Meeting) => {
    const meetings = DataService.getMeetings();
    const existing = meetings.findIndex(m => m.id === meeting.id);
    if (existing >= 0) {
      meetings[existing] = meeting;
    } else {
      meetings.push(meeting);
    }
    save('meetings', meetings);
  },

  // Helper to join data for UI
  getEnrichedSchedules: () => {
    const schedules = DataService.getSchedules();
    const users = DataService.getUsers();
    const projects = DataService.getProjects();
    
    return schedules.map(s => ({
      ...s,
      user: users.find(u => u.id === s.userId),
      project: projects.find(p => p.id === s.projectId)
    }));
  }
};
