import { API_URL } from '../config';

class ReminderService {
    constructor() {
        this.checkInterval = null;
        this.token = null;
        this.onTrigger = null;
    }

    start(token, onTrigger) {
        if (this.checkInterval) return;
        this.token = token;
        this.onTrigger = onTrigger;
        this.isConnected = true;
        this.failureCount = 0;
        this.maxRetries = 3;

        console.log('🔔 Reminder Service Started');

        // Check immediately, then every 60 seconds (reduced from 10s to prevent overload)
        this._check();
        this.checkInterval = setInterval(() => this._check(), 60000);
    }

    async _check() {
        if (!this.token || !this.isConnected) return;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per request

        try {
            const res = await fetch(`${API_URL}/api/reminders`, {
                headers: { 'Authorization': `Bearer ${this.token}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) return;
            
            const reminders = await res.json();
            if (!Array.isArray(reminders)) return;

            this.failureCount = 0; // Reset on success
            const now = new Date();
            const due = reminders.filter(r => !r.isTriggered && new Date(r.reminderTime) <= now);

            for (const r of due) {
                this.onTrigger?.(r);
                // Mark triggered so it doesn't fire again
                fetch(`${API_URL}/api/reminders/${r._id}/trigger`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }).catch(() => {});
            }
        } catch (err) {
            clearTimeout(timeoutId);
            // Silently ignore network errors — will retry on next interval
            this.failureCount++;
            if (this.failureCount >= this.maxRetries) {
                console.warn('⚠️ Reminder service disconnected. Will retry later.');
                this.isConnected = false;
            }
        }
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.token = null;
        this.onTrigger = null;
    }
}

export default new ReminderService();
