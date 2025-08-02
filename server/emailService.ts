import { MailService } from '@sendgrid/mail';
import type { Walkthrough, Teacher, User } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email notifications will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface NotificationData {
  walkthrough: Walkthrough;
  teacher: Teacher;
  reviewer: User;
  observer: User;
  reportUrl: string;
}

class EmailService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!process.env.SENDGRID_API_KEY;
  }

  async sendReviewAssignmentNotification(data: NotificationData): Promise<boolean> {
    if (!this.isEnabled) {
      console.log("Email service disabled - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      const { walkthrough, teacher, reviewer, observer, reportUrl } = data;
      
      const subject = `Review Assignment: Classroom Walkthrough for ${teacher.firstName} ${teacher.lastName}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Classroom Walkthrough Review Assignment</h2>
          
          <p>Hello ${reviewer.firstName},</p>
          
          <p>You have been assigned to review a classroom walkthrough observation. Here are the details:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Walkthrough Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Teacher:</strong> ${teacher.firstName} ${teacher.lastName}</li>
              <li><strong>Subject:</strong> ${walkthrough.subject}</li>
              <li><strong>Grade Level:</strong> ${walkthrough.gradeLevel || 'Not specified'}</li>
              <li><strong>Date:</strong> ${new Date(walkthrough.dateTime).toLocaleDateString()}</li>
              <li><strong>Observer:</strong> ${observer.firstName} ${observer.lastName}</li>
              ${walkthrough.priority ? `<li><strong>Priority:</strong> ${walkthrough.priority.toUpperCase()}</li>` : ''}
            </ul>
          </div>
          
          <p>Please review the walkthrough report and provide your feedback. You can access the full report using the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reportUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Walkthrough Report
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            To complete your review, log into the Classroom Walkthrough Tool and navigate to the Review Dashboard.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated notification from the Classroom Walkthrough Tool. Please do not reply to this email.
          </p>
        </div>
      `;

      const text = `
Classroom Walkthrough Review Assignment

Hello ${reviewer.firstName},

You have been assigned to review a classroom walkthrough observation.

Walkthrough Details:
- Teacher: ${teacher.firstName} ${teacher.lastName}
- Subject: ${walkthrough.subject}
- Grade Level: ${walkthrough.gradeLevel || 'Not specified'}
- Date: ${new Date(walkthrough.dateTime).toLocaleDateString()}
- Observer: ${observer.firstName} ${observer.lastName}
${walkthrough.priority ? `- Priority: ${walkthrough.priority.toUpperCase()}` : ''}

Please review the walkthrough report and provide your feedback.
View the full report at: ${reportUrl}

To complete your review, log into the Classroom Walkthrough Tool and navigate to the Review Dashboard.
      `;

      await mailService.send({
        to: reviewer.email,
        from: process.env.FROM_EMAIL || 'noreply@classroom-walkthrough.com',
        subject,
        text,
        html,
      });

      console.log(`Review assignment notification sent to ${reviewer.email}`);
      return true;

    } catch (error) {
      console.error('Failed to send review assignment notification:', error);
      return false;
    }
  }

  async sendReviewCompletionNotification(data: NotificationData): Promise<boolean> {
    if (!this.isEnabled) {
      console.log("Email service disabled - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      const { walkthrough, teacher, reviewer, observer, reportUrl } = data;
      
      const subject = `Review Completed: Classroom Walkthrough for ${teacher.firstName} ${teacher.lastName}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Classroom Walkthrough Review Completed</h2>
          
          <p>Hello ${observer.firstName},</p>
          
          <p>The review for your classroom walkthrough observation has been completed by ${reviewer.firstName} ${reviewer.lastName}.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">Walkthrough Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Teacher:</strong> ${teacher.firstName} ${teacher.lastName}</li>
              <li><strong>Subject:</strong> ${walkthrough.subject}</li>
              <li><strong>Grade Level:</strong> ${walkthrough.gradeLevel || 'Not specified'}</li>
              <li><strong>Date:</strong> ${new Date(walkthrough.dateTime).toLocaleDateString()}</li>
              <li><strong>Reviewer:</strong> ${reviewer.firstName} ${reviewer.lastName}</li>
            </ul>
          </div>
          
          ${walkthrough.reviewerFeedback ? `
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h4 style="color: #047857; margin-top: 0;">Reviewer Feedback</h4>
            <p style="white-space: pre-wrap; margin: 0;">${walkthrough.reviewerFeedback}</p>
          </div>
          ` : ''}
          
          <p>You can view the complete walkthrough report with reviewer feedback using the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reportUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Updated Report
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated notification from the Classroom Walkthrough Tool. Please do not reply to this email.
          </p>
        </div>
      `;

      const text = `
Classroom Walkthrough Review Completed

Hello ${observer.firstName},

The review for your classroom walkthrough observation has been completed by ${reviewer.firstName} ${reviewer.lastName}.

Walkthrough Details:
- Teacher: ${teacher.firstName} ${teacher.lastName}
- Subject: ${walkthrough.subject}
- Grade Level: ${walkthrough.gradeLevel || 'Not specified'}
- Date: ${new Date(walkthrough.dateTime).toLocaleDateString()}
- Reviewer: ${reviewer.firstName} ${reviewer.lastName}

${walkthrough.reviewerFeedback ? `
Reviewer Feedback:
${walkthrough.reviewerFeedback}
` : ''}

View the complete walkthrough report at: ${reportUrl}
      `;

      await mailService.send({
        to: observer.email,
        from: process.env.FROM_EMAIL || 'noreply@classroom-walkthrough.com',
        subject,
        text,
        html,
      });

      console.log(`Review completion notification sent to ${observer.email}`);
      return true;

    } catch (error) {
      console.error('Failed to send review completion notification:', error);
      return false;
    }
  }

  // Legacy method for backward compatibility
  async sendReviewNotification(data: NotificationData): Promise<boolean> {
    return this.sendReviewAssignmentNotification(data);
  }
}

export const emailService = new EmailService();