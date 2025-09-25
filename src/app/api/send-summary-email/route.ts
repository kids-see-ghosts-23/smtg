import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, meetingName, summary, agentName, date, duration } = body;

        // Validate required fields
        if (!to || !meetingName || !summary) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const emailService = new EmailService();

        const htmlContent = emailService.generateSummaryHTML(
            meetingName,
            summary,
            agentName,
            date,
            duration
        );

        const result = await emailService.sendEmail({
            to,
            subject: `Meeting Summary: ${meetingName}`,
            html: htmlContent,
            text: `Meeting Summary for ${meetingName}\n\nAgent: ${agentName}\nDate: ${date}\nDuration: ${duration}\n\nSummary:\n${summary}`,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
