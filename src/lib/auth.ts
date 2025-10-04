import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { EmailService } from "./email";

const emailService = new EmailService();

export const auth = betterAuth({
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await emailService.sendEmail({
                to: user.email,
                subject: "Reset your password",
                html: emailService.generatePasswordResetHTML(user.name, url),
                text: `Hi ${user.name},\n\nClick the link below to reset your password:\n${url}\n\nIf you didn't request this, please ignore this email.\n\nThis link will expire in 1 hour.`,
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await emailService.sendEmail({
                to: user.email,
                subject: "Verify your email address",
                html: emailService.generateVerificationHTML(user.name, url),
                text: `Hi ${user.name},\n\nPlease verify your email address by clicking the link below:\n${url}\n\nIf you didn't create an account, please ignore this email.`,
            });
        },
        async afterEmailVerification(user: { email: string }) {
            console.log(`Email verified for user: ${user.email}`);
            // You can add custom logic here, like granting access to premium features
        },
    },
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            ...schema,
        },
    }),
});
