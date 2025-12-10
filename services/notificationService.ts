import { User, Project } from '../types';

interface NotificationPayload {
  toEmail: string;
  toPhone: string;
  subject: string;
  body: string;
}

export const NotificationService = {
  // Simulate sending an Email and SMS
  send: async (payload: NotificationPayload): Promise<boolean> => {
    console.log('--- NOTIFICATION SYSTEM ---');
    console.log(`[EMAIL] To: ${payload.toEmail} | Subject: ${payload.subject}`);
    console.log(`[BODY] ${payload.body}`);
    console.log(`[SMS] To: ${payload.toPhone} | Msg: ${payload.subject} Check intranet.`);
    console.log('---------------------------');
    
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 800);
    });
  },

  notifyScheduleChange: async (worker: User, project: Project, start: string, isUpdate: boolean) => {
    const action = isUpdate ? 'Updated' : 'Assigned';
    await NotificationService.send({
      toEmail: worker.email,
      toPhone: worker.phone,
      subject: `[UNIQID] Schedule ${action}`,
      body: `Hello ${worker.name},\n\nYou have been ${action.toLowerCase()} to project "${project.name}".\nStart Time: ${new Date(start).toLocaleString()}\n\nPlease log in to the intranet for details.`
    });
  },

  notifyMeeting: async (participants: string[], title: string, time: string) => {
    // In a real app, we'd loop through participants and fetch their details
    console.log(`Notifying ${participants.length} participants about meeting: ${title}`);
    await NotificationService.send({
      toEmail: 'participants@uniqid.com',
      toPhone: '555-ALL-USERS',
      subject: `[UNIQID] Meeting Invitation: ${title}`,
      body: `You are invited to a meeting on ${new Date(time).toLocaleString()}. Location details in intranet.`
    });
  }
};
