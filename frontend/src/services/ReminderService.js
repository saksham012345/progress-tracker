import { API_URL } from '../config';

class ReminderService {
    constructor() {
        this.checkInterval = null;
    }

    start(token, onTrigger) {
        if (this.checkInterval) return;
        
        console.log('🚀 Reminder Service Started');
        this.checkInterval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/reminders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const reminders = await res.json();
                
                const now = new Date();
                const dueReminders = reminders.filter(r => !r.isTriggered && new Date(r.reminderTime) <= now);
                
                for (const r of dueReminders) {
                    onTrigger(r);
                    // Mark as triggered in backend
                    await fetch(`${API_URL}/api/reminders/${r._id}/trigger`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
            } catch (err) {
                console.error('Reminder Check Error:', err);
            }
        }, 30000); // Check every 30 seconds
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

export default new ReminderService();
