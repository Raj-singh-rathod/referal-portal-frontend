const db = require('../db/db');

class NotificationService {
  /**
   * Queue-based background notification dispatcher
   */
  async sendNotification({ userId, type, title, message, payload = {} }) {
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);

      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, payload) VALUES ($1, $2, $3, $4, $5, $6)`,
        [notifId, userId, type, title, message, payloadJson]
      );

      // Async dispatch log simulation (Nodemailer email trigger)
      this._simulateEmailDispatch(userId, title, message);
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err);
    }
  }

  async _simulateEmailDispatch(userId, title, message) {
    try {
      const user = await db.getOne('SELECT email, name FROM users WHERE id = $1', [userId]);
      if (user) {
        console.log(`[SMTP Dispatcher] Sending email to <${user.email}>: "${title}" - ${message}`);
      }
    } catch (err) {
      console.error('[NotificationService] Email log error:', err);
    }
  }

  async getUserNotifications(userId) {
    return db.getAll(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
  }

  async markAsRead(notificationId, userId) {
    return db.execute(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
  }
}

module.exports = new NotificationService();
