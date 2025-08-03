import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

export interface SMSNotification {
  to: string;
  message: string;
}

export class SMSService {
  static async sendSMS(notification: SMSNotification): Promise<boolean> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.error('Twilio credentials not configured');
        return false;
      }

      const message = await twilioClient.messages.create({
        body: notification.message,
        from: TWILIO_PHONE_NUMBER,
        to: notification.to
      });

      console.log(`SMS sent successfully. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  static async sendLessonPlanSubmissionNotification({
    teacherName,
    lessonPlanTitle,
    subject,
    gradeLevel,
    isLate,
    recipientPhone
  }: {
    teacherName: string;
    lessonPlanTitle: string;
    subject: string;
    gradeLevel?: string;
    isLate: boolean;
    recipientPhone: string;
  }): Promise<boolean> {
    const statusText = isLate ? "LATE" : "ON TIME";
    const gradeText = gradeLevel ? ` (Grade ${gradeLevel})` : '';
    
    const message = `📚 Lesson Plan Submitted ${statusText}
Teacher: ${teacherName}
Subject: ${subject}${gradeText}
Title: ${lessonPlanTitle}

Status: ${statusText} submission
Time: ${new Date().toLocaleString()}

- Classroom Walkthrough Tool`;

    return this.sendSMS({
      to: recipientPhone,
      message
    });
  }

  static async sendWeeklySubmissionReminder({
    teacherName,
    weekNumber,
    recipientPhone
  }: {
    teacherName: string;
    weekNumber: number;
    recipientPhone: string;
  }): Promise<boolean> {
    const message = `⏰ Weekly Lesson Plan Reminder
Week ${weekNumber} deadline is Friday at 11:59 PM

Teacher: ${teacherName}
Please submit your lesson plan before the deadline to avoid late status.

- Classroom Walkthrough Tool`;

    return this.sendSMS({
      to: recipientPhone,
      message
    });
  }
}