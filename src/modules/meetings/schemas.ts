import { z } from "zod";

export const meetingsInsertSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    agentId: z.string().min(1, { message: "Agent is required" }),
});

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
    id: z.string().min(1, { message: "Id is required" }),
});

export const sendInvitationSchema = z.object({
    meetingId: z.string().min(1, { message: "Meeting ID is required" }),
    recipientEmails: z
        .array(z.string().email({ message: "Invalid email address" }))
        .min(1, { message: "At least one recipient email is required" }),
    scheduledDate: z.string().min(1, { message: "Scheduled date is required" }),
    scheduledTime: z.string().min(1, { message: "Scheduled time is required" }),
    message: z.string().optional(),
});
