import nodemailer from 'nodemailer';

const isSecureConnection = value => /^(1|true|yes)$/i.test(String(value || '').trim());
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const displayValue = value => {
  if (value == null || value === '') return 'Not provided';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number.parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: isSecureConnection(process.env.EMAIL_SECURE),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendSubmissionNotifications({ formName, recipientEmail, fields, attachments = [] }) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const from = process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim();
    const missing = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'].filter(key => !process.env[key]?.trim());
    if (!adminEmail) missing.push('ADMIN_EMAIL');
    if (!from) missing.push('EMAIL_FROM or EMAIL_USER');
    if (missing.length) {
      console.error(`Email notification skipped for ${formName}: missing ${missing.join(', ')}.`);
      return { userSent: false, adminSent: false };
    }

    const rows = Object.entries(fields).map(([label, value]) => [label, displayValue(value)]);
    const textDetails = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
    const htmlDetails = rows.map(([label, value]) => `<tr><th style="text-align:left;padding:6px 12px 6px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('');
    const send = async (kind, mailOptions) => {
      try {
        await this.transporter.sendMail({ from, ...mailOptions });
        return true;
      } catch (error) {
        console.error(`Failed to send ${kind} ${formName} email:`, error.message);
        return false;
      }
    };

    const adminMail = send('admin', {
      to: adminEmail,
      subject: `New ${formName} submission: ${displayValue(fields.Name)}`,
      text: `New ${formName} submission\n\n${textDetails}`,
      html: `<h2>New ${escapeHtml(formName)} submission</h2><table>${htmlDetails}</table>`,
      attachments,
    });
    const userMail = recipientEmail
      ? send('confirmation', {
          to: recipientEmail,
          subject: `We received your ${formName.toLowerCase()}`,
          text: `Hello ${displayValue(fields.Name)},\n\nThank you for contacting Visa For Nation. We received your ${formName.toLowerCase()} and will be in touch.\n\n${textDetails}`,
          html: `<p>Hello ${escapeHtml(fields.Name)},</p><p>Thank you for contacting Visa For Nation. We received your ${escapeHtml(formName.toLowerCase())} and will be in touch.</p><table>${htmlDetails}</table>`,
        })
      : Promise.resolve(false);

    const [adminSent, userSent] = await Promise.all([adminMail, userMail]);
    if (!recipientEmail) console.warn(`No confirmation email sent for ${formName}: submission has no email address.`);
    return { userSent, adminSent };
  }
}

export default new EmailService();