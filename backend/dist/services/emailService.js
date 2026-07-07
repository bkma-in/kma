"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTransactionalEmail = void 0;
const brevo_1 = require("@getbrevo/brevo");
const env_1 = require("../config/env");
// In v5 SDK, use BrevoClient
const client = new brevo_1.BrevoClient({
    apiKey: env_1.config.brevo.apiKey,
});
const sendTransactionalEmail = async (toEmail, toName, subject, htmlContent) => {
    // Always log to console for auditing and local development
    console.log('==================================================');
    console.log(`[EMAIL-SERVICE] Outgoing Email to: ${toName} <${toEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Content Snippet:\n${htmlContent.replace(/<[^>]*>/g, '').trim()}`);
    console.log('==================================================');
    try {
        if (!env_1.config.brevo.apiKey || env_1.config.brevo.apiKey === '') {
            throw new Error('BREVO_API_KEY is not set in environment variables');
        }
        const response = await client.transactionalEmails.sendTransacEmail({
            sender: { name: "KMA Platform", email: env_1.config.brevo.senderEmail },
            to: [{ email: toEmail, name: toName }],
            subject: subject,
            htmlContent: htmlContent,
        });
        console.log('[EMAIL-SERVICE] Email sent successfully via Brevo API:', response);
        return response;
    }
    catch (error) {
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
exports.sendTransactionalEmail = sendTransactionalEmail;
