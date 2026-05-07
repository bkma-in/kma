import { BrevoClient } from '@getbrevo/brevo';
import { config } from '../config/env';

// In v5 SDK, use BrevoClient
const client = new BrevoClient({
  apiKey: config.brevo.apiKey,
});

export const sendTransactionalEmail = async (toEmail: string, toName: string, subject: string, htmlContent: string) => {
  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: { name: "KMA Platform", email: "noreply@kma.example.com" },
      to: [{ email: toEmail, name: toName }],
      subject: subject,
      htmlContent: htmlContent,
    });
    
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Brevo API error', error);
    throw error;
  }
};
