import sgMail from '@sendgrid/mail';

// Make SendGrid optional for local development
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️  SENDGRID_API_KEY not set. Email functionality will be mocked.");
}

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mobiletoolsbox.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mobiletoolsbox.com';

interface EmailTemplate {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] Email would be sent to ${template.to}: ${template.subject}`);
      return true;
    }
    try {
      await sgMail.send(template);
      console.log(`Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  // Send confirmation email to user who submitted feedback
  static async sendFeedbackConfirmation(userEmail: string, feedbackType: string, feedbackTitle: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      from: FROM_EMAIL,
      subject: 'Your MobileToolsBox Feedback Has Been Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Thank you for your feedback!</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">Feedback Details:</h3>
            <p><strong>Type:</strong> ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}</p>
            <p><strong>Title:</strong> ${feedbackTitle}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          
          <p>We've received your feedback and our team will review it shortly. Here's what happens next:</p>
          
          <ul>
            <li><strong>Bug reports:</strong> We'll investigate within 1-2 business days</li>
            <li><strong>Feature requests:</strong> Review and consideration within 1-2 weeks</li>
            <li><strong>General feedback:</strong> Response within 3-5 business days</li>
          </ul>
          
          <p>If you provided your email address, we'll keep you updated on the progress of your feedback.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b;">
              Thanks for helping us improve MobileToolsBox!<br>
              The MobileToolsBox Team
            </p>
          </div>
        </div>
      `,
      text: `Thank you for your feedback!
      
Feedback Type: ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}
Title: ${feedbackTitle}
Status: Pending Review

We've received your feedback and our team will review it shortly. We'll keep you updated on the progress.

Thanks for helping us improve MobileToolsBox!
The MobileToolsBox Team`
    };

    return this.sendEmail(template);
  }

  // Send notification to admin about new feedback
  static async sendAdminNotification(feedback: any): Promise<boolean> {
    const urgencyLevel = feedback.type === 'bug' ? 'HIGH' : feedback.rating <= 2 ? 'MEDIUM' : 'LOW';
    
    const template: EmailTemplate = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `[${urgencyLevel}] New MobileToolsBox Feedback: ${feedback.type.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">New Feedback Received</h2>
          
          <div style="background-color: ${urgencyLevel === 'HIGH' ? '#fee2e2' : urgencyLevel === 'MEDIUM' ? '#fef3c7' : '#f0fdf4'}; 
                      padding: 20px; border-radius: 8px; margin: 20px 0;
                      border-left: 4px solid ${urgencyLevel === 'HIGH' ? '#dc2626' : urgencyLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'};">
            <h3 style="margin-top: 0; color: #334155;">Feedback Details</h3>
            <p><strong>Type:</strong> ${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}</p>
            <p><strong>Priority:</strong> ${urgencyLevel}</p>
            <p><strong>Rating:</strong> ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)} (${feedback.rating}/5)</p>
            <p><strong>Title:</strong> ${feedback.title}</p>
            <p><strong>User Email:</strong> ${feedback.email || 'Not provided'}</p>
            <p><strong>User ID:</strong> ${feedback.userId}</p>
            <p><strong>Submitted:</strong> ${new Date(feedback.createdAt).toLocaleString()}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
            <h4 style="margin-top: 0;">Description:</h4>
            <p style="white-space: pre-wrap;">${feedback.description}</p>
          </div>
          
          <div style="margin-top: 20px;">
            <h4>Recommended Actions:</h4>
            ${urgencyLevel === 'HIGH' ? 
              '<p style="color: #dc2626;"><strong>⚠️ High Priority:</strong> This appears to be a bug report. Please investigate immediately.</p>' :
              urgencyLevel === 'MEDIUM' ?
              '<p style="color: #f59e0b;"><strong>⚡ Medium Priority:</strong> Low rating or important feedback. Review within 24 hours.</p>' :
              '<p style="color: #10b981;"><strong>✓ Low Priority:</strong> General feedback. Review within 3-5 business days.</p>'
            }
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #e0f2fe; border-radius: 8px;">
            <h4 style="margin-top: 0;">Quick Actions:</h4>
            <p>Log into the MobileToolsBox admin panel to:</p>
            <ul>
              <li>Update feedback status</li>
              <li>Respond to the user</li>
              <li>Mark as resolved</li>
            </ul>
          </div>
        </div>
      `,
      text: `New Feedback Received - Priority: ${urgencyLevel}

Type: ${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
Rating: ${feedback.rating}/5
Title: ${feedback.title}
User Email: ${feedback.email || 'Not provided'}
User ID: ${feedback.userId}
Submitted: ${new Date(feedback.createdAt).toLocaleString()}

Description:
${feedback.description}

Please log into the admin panel to review and respond to this feedback.`
    };

    return this.sendEmail(template);
  }

  // Send status update to user when feedback status changes
  static async sendStatusUpdate(userEmail: string, feedbackTitle: string, oldStatus: string, newStatus: string, adminResponse?: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      from: FROM_EMAIL,
      subject: `MobileToolsBox Feedback Update: ${feedbackTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Feedback Status Update</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">Update for: ${feedbackTitle}</h3>
            <p><strong>Status changed from:</strong> ${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}</p>
            <p><strong>New status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          </div>
          
          ${adminResponse ? `
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #0369a1;">Response from our team:</h4>
              <p style="white-space: pre-wrap;">${adminResponse}</p>
            </div>
          ` : ''}
          
          <p>Thank you for helping us improve MobileToolsBox. If you have any questions about this update, feel free to submit additional feedback.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b;">
              Best regards,<br>
              The MobileToolsBox Team
            </p>
          </div>
        </div>
      `,
      text: `Feedback Status Update

Feedback: ${feedbackTitle}
Status changed from: ${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}
New status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

${adminResponse ? `Response from our team:\n${adminResponse}\n\n` : ''}

Thank you for helping us improve MobileToolsBox.

Best regards,
The MobileToolsBox Team`
    };

    return this.sendEmail(template);
  }

  // Send follow-up email for resolved feedback
  static async sendResolutionFollowUp(userEmail: string, feedbackTitle: string, feedbackType: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      from: FROM_EMAIL,
      subject: `MobileToolsBox: We've addressed your ${feedbackType} feedback`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Feedback Resolved!</h2>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #334155;">Great news!</h3>
            <p>We've successfully addressed your feedback: <strong>${feedbackTitle}</strong></p>
            <p>Your ${feedbackType} has been marked as resolved in our system.</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">What's next?</h4>
            <ul>
              <li>If this was a bug report, the fix should now be live</li>
              <li>If this was a feature request, you can now find it in the app</li>
              <li>Check out the latest updates in MobileToolsBox</li>
            </ul>
          </div>
          
          <p>We'd love to hear if our solution meets your needs. Feel free to submit additional feedback anytime!</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.APP_URL || 'https://mobiletoolsbox.com'}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open MobileToolsBox
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #64748b;">
              Thank you for helping us build a better product!<br>
              The MobileToolsBox Team
            </p>
          </div>
        </div>
      `,
      text: `Feedback Resolved!

Great news! We've successfully addressed your feedback: ${feedbackTitle}

Your ${feedbackType} has been marked as resolved in our system.

What's next?
- If this was a bug report, the fix should now be live
- If this was a feature request, you can now find it in the app
- Check out the latest updates in MobileToolsBox

We'd love to hear if our solution meets your needs. Feel free to submit additional feedback anytime!

Thank you for helping us build a better product!
The MobileToolsBox Team`
    };

    return this.sendEmail(template);
  }
}