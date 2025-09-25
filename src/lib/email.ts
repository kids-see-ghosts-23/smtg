import nodemailer from "nodemailer";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail", // or your preferred email service
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASSWORD, // Your app password
            },
        });
    }

    async sendEmail({ to, subject, html, text }: EmailOptions) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Meeting Summary" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html,
            });

            console.log("Message sent: %s", info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error("Error sending email:", error);
            throw new Error(
                `Failed to send email: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    // Generate HTML template for meeting summary
    generateSummaryHTML(
        meetingName: string,
        summary: string,
        agentName: string,
        date: string,
        duration: string
    ) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Meeting Summary</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #374151; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 30px; 
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              border: 1px solid #e5e7eb;
            }
            .header { 
              background: #16a34a;
              color: white;
              padding: 35px 40px; 
              position: relative;
              clear: both;
            }
            .header-content {
              width: 100%;
              max-width: none;
              margin: 0;
              position: relative;
              z-index: 1;
            }
            .meeting-title { 
              margin: 0 0 25px 0; 
              font-size: 28px;
              font-weight: 600;
              letter-spacing: -0.02em;
              line-height: 1.3;
              color: white;
              display: block;
              width: 100%;
            }
            .meta-info { 
              display: flex;
              flex-wrap: wrap;
              gap: 30px;
              margin: 0;
              width: 100%;
              align-items: flex-start;
            }
            .meta-item {
              display: block;
              min-width: 140px;
              flex: 0 1 auto;
            }
            .meta-label {
              color: rgba(255, 255, 255, 0.85);
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin: 0 0 8px 0;
              line-height: 1.2;
              display: block;
            }
            .meta-value {
              color: white;
              font-weight: 600;
              font-size: 16px;
              margin: 0;
              line-height: 1.4;
              display: block;
            }
            .content-section {
              padding: 45px 40px;
            }
            .section-title {
              color: #16a34a;
              margin: 0 0 30px 0;
              font-size: 22px;
              font-weight: 600;
              padding-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
            }
            .summary-content { 
              background: #f9fafb;
              border-radius: 8px;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .summary-content h1 { 
              color: #1f2937; 
              font-size: 24px; 
              margin: 25px 0 18px 0; 
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .summary-content h2 { 
              color: #1f2937; 
              font-size: 20px; 
              margin: 22px 0 15px 0; 
              font-weight: 600;
            }
            .summary-content h3 { 
              color: #374151; 
              font-size: 18px; 
              margin: 20px 0 12px 0; 
              font-weight: 600;
            }
            .summary-content h4 { 
              color: #374151; 
              font-size: 16px; 
              margin: 18px 0 10px 0; 
              font-weight: 600;
            }
            .summary-content h5, 
            .summary-content h6 { 
              color: #4b5563; 
              font-size: 15px; 
              margin: 16px 0 8px 0; 
              font-weight: 600;
            }
            .summary-content p { 
              margin: 0 0 18px 0; 
              line-height: 1.7;
              color: #374151;
              font-size: 16px;
            }
            .summary-content ul, .summary-content ol { 
              margin: 18px 0;
              padding-left: 25px;
            }
            .summary-content ul {
              list-style-type: disc;
            }
            .summary-content ol {
              list-style-type: decimal;
            }
            .summary-content li { 
              margin-bottom: 8px; 
              line-height: 1.7;
              color: #374151;
              font-size: 16px;
            }
            .summary-content strong { 
              font-weight: 600; 
              color: #1f2937;
            }
            .summary-content em { 
              font-style: italic; 
              color: #4b5563;
            }
            .summary-content del {
              text-decoration: line-through;
              color: #6b7280;
            }
            .summary-content code { 
              background: #f3f4f6; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
              font-size: 14px;
              color: #16a34a;
              border: 1px solid #e5e7eb;
            }
            .summary-content pre {
              background: #1f2937;
              color: #f9fafb;
              padding: 20px;
              border-radius: 6px;
              overflow-x: auto;
              margin: 20px 0;
              border: 1px solid #374151;
            }
            .summary-content pre code {
              background: transparent;
              color: #f9fafb;
              padding: 0;
              border: none;
              font-size: 14px;
            }
            .summary-content blockquote { 
              border-left: 4px solid #16a34a; 
              padding: 15px 20px; 
              margin: 20px 0; 
              background: #f0fdf4;
              border-radius: 0 4px 4px 0;
              color: #374151;
            }
            .summary-content a {
              color: #16a34a;
              text-decoration: underline;
            }
            .summary-content a:hover {
              color: #15803d;
            }
            .summary-content hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 30px 0;
            }
            .footer { 
              background: #f9fafb;
              padding: 30px 40px; 
              border-top: 1px solid #e5e7eb; 
              font-size: 13px; 
              color: #6b7280;
              text-align: center;
            }
            .footer p {
              margin: 0 0 8px 0;
            }
            .footer p:last-child {
              margin: 0;
              font-weight: 500;
              color: #4b5563;
            }
            @media (max-width: 768px) {
              body { padding: 15px; }
              .header { padding: 25px; }
              .content-section { padding: 30px 25px; }
              .summary-content { padding: 20px; }
              .footer { padding: 25px; }
              .meeting-title { font-size: 24px; }
              .meta-info { 
                flex-direction: column;
                gap: 20px; 
              }
              .meta-item {
                min-width: auto;
                margin-bottom: 5px;
              }
            }
            @media (max-width: 480px) {
              .meeting-title { font-size: 22px; }
              .content-section { padding: 25px 20px; }
              .summary-content { padding: 15px; }
              .header { padding: 20px; }
              .meta-info {
                gap: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-content">
                <h1 class="meeting-title">${meetingName}</h1>
                <div class="meta-info">
                  <div class="meta-item">
                    <div class="meta-label">Facilitator</div>
                    <div class="meta-value">${agentName}</div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-label">Date</div>
                    <div class="meta-value">${date}</div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-label">Duration</div>
                    <div class="meta-value">${duration}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="content-section">
              <h2 class="section-title">Meeting Summary</h2>
              <div class="summary-content">
                ${this.convertMarkdownToHTML(summary)}
              </div>
            </div>
            
            <div class="footer">
              <p>This meeting summary was automatically generated by our AI-powered meeting intelligence platform.</p>
              <p>For support or questions, please contact your system administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    // Convert markdown to HTML (basic conversion)
    private convertMarkdownToHTML(markdown: string): string {
        let html = markdown.trim();

        // --- Headings ---
        html = html.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
        html = html.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
        html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
        html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

        // --- Bold + Italic ---
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
        html = html.replace(/_(.*?)_/g, "<em>$1</em>");

        // --- Unordered lists ---
        html = html.replace(/^(\s*[-+*] .+(?:\n\s*[-+*] .+)*)/gm, (match) => {
            const items = match
                .trim()
                .split(/\n/)
                .map((line) => line.replace(/^[-+*] (.+)/, "<li>$1</li>"))
                .join("");
            return `<ul>${items}</ul>`;
        });

        // --- Ordered lists ---
        html = html.replace(/^(\s*\d+\. .+(?:\n\s*\d+\. .+)*)/gm, (match) => {
            const items = match
                .trim()
                .split(/\n/)
                .map((line) => line.replace(/^\d+\. (.+)/, "<li>$1</li>"))
                .join("");
            return `<ol>${items}</ol>`;
        });

        // --- Paragraphs ---
        html = html
            .split(/\n{2,}/) // break into blocks on blank lines
            .map((block) => {
                // Skip if already wrapped (list, heading, etc.)
                if (/^<\/?(h\d|ul|ol|li)/.test(block.trim())) {
                    return block;
                }
                return `<p>${block.trim()}</p>`;
            })
            .join("\n");

        return html;
    }
}