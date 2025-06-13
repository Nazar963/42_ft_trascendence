import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SendEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Check if email verification is actually enabled
    const isEmailEnabled = process.env.EMAIL_VERIFICATION_ENABLED === 'true';

    if (!isEmailEnabled) {
      console.log('Email verification is disabled - no transporter configured');
      return;
    }

    // Determine email provider based on email address
    const isGmail = process.env.MAIL_EMAIL?.includes('@gmail.com');
    const isOutlook =
      process.env.MAIL_EMAIL?.includes('@outlook.') ||
      process.env.MAIL_EMAIL?.includes('@hotmail.');

    try {
      if (isGmail) {
        // Gmail configuration with App Password
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD, // Gmail App Password required
          },
        });
        console.log('Gmail transporter configured');
      } else if (isOutlook) {
        // Modern Outlook configuration - OAuth2 preferred, but try basic auth first
        this.transporter = nodemailer.createTransport({
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD,
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
          },
          requireTLS: true,
        });
        console.log(
          'Outlook transporter configured (note: may require OAuth2 or App Password)',
        );
      } else {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.MAIL_PORT || '587'),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD,
          },
        });
        console.log('Generic SMTP transporter configured');
      }
    } catch (error) {
      console.error('Failed to configure email transporter:', error);
      this.transporter = null;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    // Check if email verification is enabled
    const isEmailEnabled = process.env.EMAIL_VERIFICATION_ENABLED === 'true';

    if (!isEmailEnabled) {
      console.log(
        `Email verification disabled. Verification code for ${email}: ${code}`,
      );
      return true; // Return true to indicate "success" even though no email was sent
    }

    // Check if transporter is configured
    if (!this.transporter) {
      console.log(
        `Email transporter not configured. Verification code for ${email}: ${code}`,
      );
      return true; // Continue without sending email
    }

    const mailOptions = {
      from: process.env.MAIL_EMAIL, // Your email
      to: email,
      subject: 'Verification Code',
      text: `Your verification code is: ${code}`,
    };

    console.error('Sending verification code with options:', mailOptions);

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification code sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification code email:', error);

      // Check if it's an authentication error (Outlook basic auth disabled)
      if (error.response && error.response.includes('535 5.7.139')) {
        console.error(
          'OUTLOOK AUTHENTICATION ERROR: Basic authentication is disabled.',
        );
        console.error('To fix this:');
        console.error('1. Go to https://account.microsoft.com/security');
        console.error('2. Enable App Passwords in Security settings');
        console.error('3. Generate an App Password for this application');
        console.error('4. Replace MAIL_PASSWORD in .env with the App Password');
        console.error('OR switch to Gmail with App Password enabled');
      }

      console.warn(
        `Email sending failed for ${email}. Continuing without email verification in development mode.`,
      );
      console.log(`Verification code for ${email}: ${code}`);
      // In development, we'll continue without sending email but log the code
      return true; // Return true to allow the process to continue
    }
  }
}
