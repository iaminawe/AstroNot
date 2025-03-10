export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string;
}

// These are placeholder values that should be replaced with actual SMTP settings
// The actual values should be loaded from environment variables
export const emailConfig: EmailConfig = {
  host: import.meta.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(import.meta.env.SMTP_PORT || '587'),
  secure: import.meta.env.SMTP_SECURE === 'true',
  auth: {
    user: import.meta.env.SMTP_USER || 'user@example.com',
    pass: import.meta.env.SMTP_PASS || 'password',
  },
  from: import.meta.env.EMAIL_FROM || 'website@example.com',
  to: import.meta.env.EMAIL_TO || 'gregg@example.com',
};
