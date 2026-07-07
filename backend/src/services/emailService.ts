import { BrevoClient } from '@getbrevo/brevo';
import { config } from '../config/env';

// In v5 SDK, use BrevoClient
const client = new BrevoClient({
  apiKey: config.brevo.apiKey,
});

export const sendTransactionalEmail = async (toEmail: string, toName: string, subject: string, htmlContent: string) => {
  // Always log to console for auditing and local development
  console.log('==================================================');
  console.log(`[EMAIL-SERVICE] Outgoing Email to: ${toName} <${toEmail}>`);
  console.log(`Subject: ${subject}`);
  console.log(`HTML Content Snippet:\n${htmlContent.replace(/<[^>]*>/g, '').trim()}`);
  console.log('==================================================');

  try {
    if (!config.brevo.apiKey || config.brevo.apiKey === '') {
      throw new Error('BREVO_API_KEY is not set in environment variables');
    }
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: { name: "KMA Platform", email: config.brevo.senderEmail },
      to: [{ email: toEmail, name: toName }],
      subject: subject,
      htmlContent: htmlContent,
    });
    
    console.log('[EMAIL-SERVICE] Email sent successfully via Brevo API:', response);
    return response;
  } catch (error: any) {
    console.error('[EMAIL-SERVICE] Brevo API transmission failed:', error.message || error);
    
    // In local development or testing, do not let email failures block the core onboarding / status flow.
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      console.warn('[EMAIL-SERVICE] non-prod environment: Suppressing email failure to avoid breaking local app flows.');
      return { message: "Simulated success in development fallback mode" };
    }
    throw error;
  }
};
