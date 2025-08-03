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
  async sendTeacherFollowUpNotification(data: {
    walkthrough: Walkthrough;
    teacher: Teacher;
    observer: User;
    reportUrl: string;
  }): Promise<boolean> {
    if (!this.isEnabled) {
      console.log("Email service disabled - SENDGRID_API_KEY not configured");
      return false;
    }

    if (!data.teacher.email) {
      console.log("Teacher email not provided - cannot send notification");
      return false;
    }

    try {
      const { walkthrough, teacher, observer, reportUrl } = data;
      
      const subject = `Follow-up Required: Your Recent Classroom Observation`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Classroom Observation Follow-up</h2>
          
          <p>Hello ${teacher.firstName},</p>
          
          <p>Your recent classroom observation has been completed and requires follow-up action. Here are the details:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Observation Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Subject:</strong> ${walkthrough.subject}</li>
              <li><strong>Grade Level:</strong> ${walkthrough.gradeLevel || 'Not specified'}</li>
              <li><strong>Date:</strong> ${new Date(walkthrough.dateTime).toLocaleDateString()}</li>
              <li><strong>Observer:</strong> ${observer.firstName} ${observer.lastName}</li>
              ${walkthrough.followUpDate ? `<li><strong>Follow-up Due:</strong> ${new Date(walkthrough.followUpDate).toLocaleDateString()}</li>` : ''}
            </ul>
          </div>
          
          <p>Please review the observation report and feedback. You can access the full report using the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reportUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Observation Report
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            To address the follow-up items, please log into your teacher dashboard in the Classroom Walkthrough Tool.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated notification from the Classroom Walkthrough Tool. Please do not reply to this email.
          </p>
        </div>
      `;

      const text = `
Classroom Observation Follow-up

Hello ${teacher.firstName},

Your recent classroom observation has been completed and requires follow-up action.

Observation Details:
- Subject: ${walkthrough.subject}
- Grade Level: ${walkthrough.gradeLevel || 'Not specified'}
- Date: ${new Date(walkthrough.dateTime).toLocaleDateString()}
- Observer: ${observer.firstName} ${observer.lastName}
${walkthrough.followUpDate ? `- Follow-up Due: ${new Date(walkthrough.followUpDate).toLocaleDateString()}` : ''}

Please review the observation report and feedback.
View the full report at: ${reportUrl}

To address the follow-up items, please log into your teacher dashboard in the Classroom Walkthrough Tool.
      `;

      await mailService.send({
        to: teacher.email,
        from: process.env.FROM_EMAIL || 'noreply@classroom-walkthrough.com',
        subject,
        text,
        html,
      });

      console.log(`Teacher follow-up notification sent to ${teacher.email}`);
      return true;

    } catch (error) {
      console.error('Failed to send teacher follow-up notification:', error);
      return false;
    }
  }

  async sendLessonPlanSubmissionNotification(data: {
    lessonPlan: any;
    teacher: Teacher;
    coach: User;
    isLate: boolean;
    weekNumber: number;
  }): Promise<boolean> {
    if (!this.isEnabled) {
      console.log("Email service disabled - SENDGRID_API_KEY not configured");
      return false;
    }

    if (!data.coach.email) {
      console.log("Coach email not provided - cannot send notification");
      return false;
    }

    try {
      const { lessonPlan, teacher, coach, isLate, weekNumber } = data;
      
      const subject = `Lesson Plan ${isLate ? 'Late ' : ''}Submission - Week ${weekNumber}: ${teacher.firstName} ${teacher.lastName}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isLate ? '#dc2626' : '#2563eb'};">
            Lesson Plan ${isLate ? 'Late ' : ''}Submission Notification
          </h2>
          
          <p>Hello ${coach.firstName},</p>
          
          <p>${teacher.firstName} ${teacher.lastName} has submitted their lesson plan for Week ${weekNumber}${isLate ? ' (LATE SUBMISSION)' : ''}.</p>
          
          ${isLate ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; font-weight: bold; margin: 0;">⚠️ Late Submission Alert</p>
            <p style="color: #991b1b; margin: 5px 0 0 0;">This lesson plan was submitted after the Friday deadline.</p>
          </div>
          ` : `
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="color: #16a34a; font-weight: bold; margin: 0;">✓ On-Time Submission</p>
            <p style="color: #15803d; margin: 5px 0 0 0;">This lesson plan was submitted on time.</p>
          </div>
          `}
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Lesson Plan Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Teacher:</strong> ${teacher.firstName} ${teacher.lastName}</li>
              <li><strong>Title:</strong> ${lessonPlan.title}</li>
              <li><strong>Subject:</strong> ${lessonPlan.subject}</li>
              <li><strong>Grade Level:</strong> ${lessonPlan.gradeLevel || 'Not specified'}</li>
              <li><strong>Week:</strong> ${weekNumber}</li>
              <li><strong>Submitted:</strong> ${new Date(lessonPlan.submittedAt).toLocaleString()}</li>
              ${lessonPlan.dateScheduled ? `<li><strong>Scheduled Date:</strong> ${new Date(lessonPlan.dateScheduled).toLocaleDateString()}</li>` : ''}
            </ul>
          </div>
          
          <p>You can review the lesson plan details by logging into the Classroom Walkthrough Tool and navigating to the lesson plans section.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated notification from the Classroom Walkthrough Tool. Please do not reply to this email.
          </p>
        </div>
      `;

      const text = `
Lesson Plan ${isLate ? 'Late ' : ''}Submission Notification

${teacher.firstName} ${teacher.lastName} has submitted their lesson plan for Week ${weekNumber}${isLate ? ' (LATE SUBMISSION)' : ''}.

Lesson Plan Details:
- Teacher: ${teacher.firstName} ${teacher.lastName}
- Title: ${lessonPlan.title}
- Subject: ${lessonPlan.subject}
- Grade Level: ${lessonPlan.gradeLevel || 'Not specified'}
- Week: ${weekNumber}
- Submitted: ${new Date(lessonPlan.submittedAt).toLocaleString()}
${lessonPlan.dateScheduled ? `- Scheduled Date: ${new Date(lessonPlan.dateScheduled).toLocaleDateString()}` : ''}

${isLate ? 'This lesson plan was submitted after the Friday deadline.' : 'This lesson plan was submitted on time.'}
      `;

      await mailService.send({
        to: coach.email,
        from: process.env.FROM_EMAIL || 'noreply@classroom-walkthrough.com',
        subject,
        text,
        html,
      });

      console.log(`Lesson plan submission notification sent to coach ${coach.email}`);
      return true;

    } catch (error) {
      console.error('Failed to send lesson plan submission notification:', error);
      return false;
    }
  }
}

// Utility functions for deadline tracking
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

export function getFridayDeadline(weekNumber: number, year?: number): Date {
  const currentYear = year || new Date().getFullYear();
  const jan1 = new Date(currentYear, 0, 1);
  const daysToFirstFriday = (5 - jan1.getDay() + 7) % 7;
  const firstFriday = new Date(currentYear, 0, 1 + daysToFirstFriday);
  
  // Calculate the Friday of the specified week
  const targetFriday = new Date(firstFriday);
  targetFriday.setDate(firstFriday.getDate() + (weekNumber - 1) * 7);
  
  // Set to end of day (11:59 PM)
  targetFriday.setHours(23, 59, 59, 999);
  
  return targetFriday;
}

export function isSubmissionLate(submissionDate: Date, weekNumber: number): boolean {
  const deadline = getFridayDeadline(weekNumber);
  return submissionDate > deadline;
}

export const emailService = new EmailService();