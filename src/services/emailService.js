import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_SECURE) || 0, // 0 for false, 1 for true
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendInquiryNotification(inquiry) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Inquiry: ${inquiry.name} - ${inquiry.category}`,
        text: `
New Inquiry Received:

Name: ${inquiry.name}
Phone: ${inquiry.phone}
Email: ${inquiry.email || 'Not provided'}
Category: ${inquiry.category}
Country: ${inquiry.country || 'Not provided'}
Visa Type: ${inquiry.visaType || 'Not provided'}
Age Group: ${inquiry.ageGroup || 'Not provided'}
Qualification: ${inquiry.qualification || 'Not provided'}
Experience: ${inquiry.experience || 'Not provided'}
Language Score: ${inquiry.languageScore || 'Not provided'}
Travel Date: ${inquiry.travelDate || 'Not provided'}
Intake: ${inquiry.intake || 'Not provided'}
Service Needed: ${inquiry.serviceNeeded || 'Not provided'}
Message: ${inquiry.message || 'No message'}
Source Page: ${inquiry.sourcePage || 'Not provided'}
Details: ${JSON.stringify(inquiry.details, null, 2)}

Timestamp: ${new Date(inquiry.createdAt).toISOString()}
        `,
        html: `
          <h2>New Inquiry Received</h2>
          <p><strong>Name:</strong> ${inquiry.name}</p>
          <p><strong>Phone:</strong> ${inquiry.phone}</p>
          <p><strong>Email:</strong> ${inquiry.email || 'Not provided'}</p>
          <p><strong>Category:</strong> ${inquiry.category}</p>
          <p><strong>Country:</strong> ${inquiry.country || 'Not provided'}</p>
          <p><strong>Visa Type:</strong> ${inquiry.visaType || 'Not provided'}</p>
          <p><strong>Age Group:</strong> ${inquiry.ageGroup || 'Not provided'}</p>
          <p><strong>Qualification:</strong> ${inquiry.qualification || 'Not provided'}</p>
          <p><strong>Experience:</strong> ${inquiry.experience || 'Not provided'}</p>
          <p><strong>Language Score:</strong> ${inquiry.languageScore || 'Not provided'}</p>
          <p><strong>Travel Date:</strong> ${inquiry.travelDate || 'Not provided'}</p>
          <p><strong>Intake:</strong> ${inquiry.intake || 'Not provided'}</p>
          <p><strong>Service Needed:</strong> ${inquiry.serviceNeeded || 'Not provided'}</p>
          <p><strong>Message:</strong> ${inquiry.message || 'No message'}</p>
          <p><strong>Source Page:</strong> ${inquiry.sourcePage || 'Not provided'}</p>
          <p><strong>Details:</strong> <pre>${JSON.stringify(inquiry.details, null, 2)}</pre></p>
          <p><strong>Timestamp:</strong> ${new Date(inquiry.createdAt).toISOString()}</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending inquiry email:', error);
      return false;
    }
  }
}

export default new EmailService();
