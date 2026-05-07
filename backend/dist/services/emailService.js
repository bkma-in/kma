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
    try {
        const response = await client.transactionalEmails.sendTransacEmail({
            sender: { name: "KMA Platform", email: "noreply@kma.example.com" },
            to: [{ email: toEmail, name: toName }],
            subject: subject,
            htmlContent: htmlContent,
        });
        console.log('Email sent successfully:', response);
        return response;
    }
    catch (error) {
        console.error('Brevo API error', error);
        throw error;
    }
};
exports.sendTransactionalEmail = sendTransactionalEmail;
