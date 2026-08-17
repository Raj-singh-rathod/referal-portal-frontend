const db = require('../db/db');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = null;
    this._initTransporter();
  }

  _initTransporter() {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: { user, pass }
      });
      console.log(`[NotificationService] Real SMTP Transporter initialized for ${user}`);
    }
  }

  /**
   * Queue-based background notification dispatcher & email sender
   */
  async sendNotification({ userId, type, title, message, payload = {} }) {
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const payloadJson = typeof payload === 'string' ? payload : JSON.stringify(payload);

      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, payload) VALUES ($1, $2, $3, $4, $5, $6)`,
        [notifId, userId, type, title, message, payloadJson]
      );

      // Trigger Email Dispatch (Nodemailer or Console fallback)
      await this.dispatchEmail(userId, title, message);
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err);
    }
  }

  async dispatchEmail(userId, title, message) {
    try {
      const user = await db.getOne('SELECT email, name FROM users WHERE id = $1', [userId]);
      if (!user || !user.email) return;

      console.log(`[SMTP Dispatcher] Sending notification to <${user.email}>: "${title}"`);

      // Re-check transporter in case env vars were set dynamically
      if (!this.transporter && (process.env.SMTP_USER || process.env.GMAIL_USER)) {
        this._initTransporter();
      }

      if (this.transporter) {
        const mailOptions = {
          from: `"ReferralConnect Portal" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: user.email,
          subject: title,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 10px;">
              <h2 style="color: #6366f1;">ReferralConnect</h2>
              <h3>${title}</h3>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">${message}</p>
              <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
              <p style="font-size: 11px; color: #94a3b8;">This is an automated notification from ReferralConnect Matching Platform.</p>
            </div>
          `
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`[SMTP Dispatcher] ✅ Real Email sent successfully to ${user.email}`);
      } else {
        console.log(`[SMTP Dispatcher] Real SMTP credentials (SMTP_USER & SMTP_PASS) not set in .env. Logged simulated email.`);
      }
    } catch (err) {
      console.error('[NotificationService] Real Email Dispatch Error:', err.message);
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

