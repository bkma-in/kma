import * as brevo from '@getbrevo/brevo';
import { config } from '../config/env';

const apiInstance = new brevo.TransactionalEmailsApi();

// Type casting the authentication mechanism to handle library types correctly
const auth = apiInstance.authentications['apiKey'] as brevo.ApiKeyAuth;
auth.apiKey = config.brevo.apiKey;

export const sendTransactionalEmail = async (toEmail: string, toName: string, subject: string, htmlContent: string) => {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: "KMA Platform", email: "noreply@kma.example.com" };
  sendSmtpEmail.to = [{ email: toEmail, name: toName }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ', data);
    return data;
  } catch (error) {
    console.error('Brevo API error', error);
    throw error;
  }
};
