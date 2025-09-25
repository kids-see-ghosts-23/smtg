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
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
              line-height: 1.6; 
              color: #1a1a1a; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #f0fdf4;
            }
            .container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04);
              border: 1px solid #bbf7d0;
            }
            .header { 
              background: linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%);
              color: white;
              padding: 40px 40px 30px 40px; 
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%);
            }
            .header-content {
              position: relative;
              z-index: 2;
            }
            .meeting-title { 
              margin: 0 0 20px 0; 
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -0.025em;
              text-align: center;
            }
            .company-badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.15);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 50px;
              padding: 8px 20px;
              font-size: 13px;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-bottom: 20px;
              text-align: center;
              display: block;
              width: fit-content;
              margin: 0 auto 20px auto;
            }
            .meta-info { 
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.18);
              border-radius: 12px;
              padding: 20px;
              margin-top: 25px;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .meta-item {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              font-size: 14px;
              font-weight: 500;
              opacity: 0.95;
              padding: 8px 12px;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.12);
              transition: all 0.2s ease;
            }
            .meta-item:hover {
              background: rgba(255, 255, 255, 0.15);
              transform: translateY(-1px);
            }
            .meta-icon {
              font-size: 16px;
              opacity: 0.9;
            }
            .meta-label {
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-right: 4px;
            }
            .meta-value {
              color: white;
              font-weight: 600;
            }
            .summary-content { 
              padding: 45px; 
            }
            .summary-title {
              color: #15803d;
              margin-bottom: 30px;
              font-size: 22px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 12px;
              padding-bottom: 15px;
              border-bottom: 3px solid #bbf7d0;
            }
            .summary-content h1 { 
              color: #166534; 
              font-size: 26px; 
              margin: 28px 0 18px 0; 
              font-weight: 700;
              border-bottom: 2px solid #bbf7d0;
              padding-bottom: 10px;
              letter-spacing: -0.025em;
            }
            .summary-content h2 { 
              color: #15803d; 
              font-size: 22px; 
              margin: 24px 0 14px 0; 
              font-weight: 600;
            }
            .summary-content h3 { 
              color: #16a34a; 
              font-size: 18px; 
              margin: 20px 0 12px 0; 
              font-weight: 600;
            }
            .summary-content h4 { 
              color: #22c55e; 
              font-size: 16px; 
              margin: 18px 0 10px 0; 
              font-weight: 600;
            }
            .summary-content h5 { 
              color: #4ade80; 
              font-size: 15px; 
              margin: 16px 0 8px 0; 
              font-weight: 600;
            }
            .summary-content h6 { 
              color: #86efac; 
              font-size: 14px; 
              margin: 14px 0 6px 0; 
              font-weight: 600;
            }
            .summary-content p { 
              margin: 0 0 18px 0; 
              line-height: 1.7;
              color: #334155;
              font-size: 16px;
            }
            .summary-content ul, .summary-content ol { 
              margin: 18px 0;
              padding-left: 28px;
            }
            .summary-content ul {
              list-style-type: none;
            }
            .summary-content ul li::before {
              content: "•";
              color: #22c55e;
              font-weight: bold;
              position: absolute;
              margin-left: -20px;
            }
            .summary-content ol {
              list-style-type: decimal;
              list-style-position: outside;
            }
            .summary-content li { 
              margin-bottom: 10px; 
              line-height: 1.7;
              color: #334155;
              font-size: 16px;
              position: relative;
            }
            .summary-content strong { 
              font-weight: 700; 
              color: #166534;
            }
            .summary-content em { 
              font-style: italic; 
              color: #15803d;
            }
            .summary-content del {
              text-decoration: line-through;
              color: #64748b;
            }
            .summary-content code { 
              background: #dcfce7; 
              padding: 3px 8px; 
              border-radius: 6px; 
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
              font-size: 14px;
              color: #166534;
              border: 1px solid #bbf7d0;
              font-weight: 500;
            }
            .summary-content pre {
              background: #166534;
              color: #f0fdf4;
              padding: 20px;
              border-radius: 12px;
              overflow-x: auto;
              margin: 20px 0;
              border: 1px solid #15803d;
            }
            .summary-content pre code {
              background: transparent;
              color: #f0fdf4;
              padding: 0;
              border: none;
              font-size: 14px;
            }
            .summary-content blockquote { 
              border-left: 4px solid #22c55e; 
              padding: 18px 24px; 
              margin: 24px 0; 
              background: #f0fdf4;
              border-radius: 0 12px 12px 0;
              font-style: italic;
              color: #15803d;
              position: relative;
            }
            .summary-content a {
              color: #22c55e;
              text-decoration: underline;
              font-weight: 500;
            }
            .summary-content a:hover {
              color: #166534;
            }
            .summary-content hr {
              border: none;
              border-top: 2px solid #bbf7d0;
              margin: 32px 0;
            }
            .footer { 
              background: #f0fdf4;
              padding: 30px 45px; 
              border-top: 1px solid #bbf7d0; 
              font-size: 13px; 
              color: #15803d;
              text-align: center;
            }
            .footer p {
              margin: 0 0 8px 0;
            }
            .footer p:last-child {
              margin: 0;
              font-weight: 600;
              color: #166534;
            }
            .sparkle { 
              color: #f59e0b; 
              filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.3));
            }
            @media (max-width: 768px) {
              .header { padding: 30px 25px 25px 25px; }
              .summary-content { padding: 30px 25px; }
              .footer { padding: 25px; }
              .meeting-title { font-size: 28px; }
              .meta-info { 
                grid-template-columns: 1fr; 
                gap: 12px; 
                padding: 16px;
              }
              .meta-item {
                justify-content: flex-start;
              }
            }
            @media (max-width: 480px) {
              .meeting-title { font-size: 24px; }
              .summary-content { padding: 20px; }
              .header { padding: 25px 20px 20px 20px; }
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
                    <span class="meta-icon">👤</span>
                    <div>
                      <span class="meta-label">Facilitator</span>
                      <span class="meta-value">${agentName}</span>
                    </div>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <div>
                      <span class="meta-label">Date</span>
                      <span class="meta-value">${date}</span>
                    </div>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <div>
                      <span class="meta-label">Duration</span>
                      <span class="meta-value">${duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="summary-content">
              <div class="summary-title">
                <span>General Summary</span>
              </div>
              ${this.convertMarkdownToHTML(summary)}
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
