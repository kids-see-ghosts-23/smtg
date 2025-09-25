import nodemailer from 'nodemailer';

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
        service: 'gmail', // or your preferred email service
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

      console.log('Message sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate HTML template for meeting summary
  generateSummaryHTML(meetingName: string, summary: string, agentName: string, date: string, duration: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Meeting Summary</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px; 
              text-align: center;
            }
            .meeting-title { 
              margin: 0 0 10px 0; 
              font-size: 28px;
              font-weight: 600;
            }
            .meta-info { 
              display: flex; 
              justify-content: center;
              gap: 30px; 
              margin-top: 20px; 
              font-size: 14px; 
              opacity: 0.9;
              flex-wrap: wrap;
            }
            .meta-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .summary-content { 
              padding: 40px; 
            }
            .summary-title {
              color: #374151;
              margin-bottom: 25px;
              font-size: 20px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .summary-content h1 { 
              color: #1f2937; 
              font-size: 24px; 
              margin: 24px 0 16px 0; 
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .summary-content h2 { 
              color: #374151; 
              font-size: 20px; 
              margin: 20px 0 12px 0; 
              font-weight: 600;
            }
            .summary-content h3 { 
              color: #4b5563; 
              font-size: 18px; 
              margin: 18px 0 10px 0; 
              font-weight: 600;
            }
            .summary-content h4 { 
              color: #6b7280; 
              font-size: 16px; 
              margin: 16px 0 8px 0; 
              font-weight: 600;
            }
            .summary-content h5 { 
              color: #6b7280; 
              font-size: 14px; 
              margin: 14px 0 6px 0; 
              font-weight: 600;
            }
            .summary-content h6 { 
              color: #6b7280; 
              font-size: 12px; 
              margin: 12px 0 4px 0; 
              font-weight: 600;
            }
            .summary-content p { 
              margin: 0 0 16px 0; 
              line-height: 1.7;
              color: #374151;
            }
            .summary-content ul, .summary-content ol { 
              margin: 16px 0;
              padding-left: 24px;
            }
            .summary-content ul {
              list-style-type: disc;
            }
            .summary-content ol {
              list-style-type: decimal;
            }
            .summary-content li { 
              margin-bottom: 8px; 
              line-height: 1.6;
              color: #374151;
            }
            .summary-content ul li {
              list-style-type: disc;
            }
            .summary-content ol li {
              list-style-type: decimal;
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
              font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
              font-size: 13px;
              color: #dc2626;
              border: 1px solid #e5e7eb;
            }
            .summary-content pre {
              background: #1f2937;
              color: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 16px 0;
            }
            .summary-content pre code {
              background: transparent;
              color: #f9fafb;
              padding: 0;
              border: none;
              font-size: 14px;
            }
            .summary-content blockquote { 
              border-left: 4px solid #3b82f6; 
              padding: 16px 20px; 
              margin: 20px 0; 
              background: #f8fafc;
              border-radius: 0 8px 8px 0;
              font-style: italic;
              color: #4b5563;
            }
            .summary-content a {
              color: #3b82f6;
              text-decoration: underline;
            }
            .summary-content a:hover {
              color: #1d4ed8;
            }
            .summary-content hr {
              border: none;
              border-top: 2px solid #e5e7eb;
              margin: 24px 0;
            }
            .footer { 
              background: #f9fafb;
              padding: 25px 40px; 
              border-top: 1px solid #e5e7eb; 
              font-size: 12px; 
              color: #6b7280;
              text-align: center;
            }
            .sparkle { color: #fbbf24; }
            @media (max-width: 600px) {
              .meta-info { flex-direction: column; gap: 10px; }
              .summary-content { padding: 25px; }
              .header { padding: 25px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="meeting-title">${meetingName}</h1>
              <div class="meta-info">
                <div class="meta-item">
                  <span>👤 Agent: ${agentName}</span>
                </div>
                <div class="meta-item">
                  <span>📅 Date: ${date}</span>
                </div>
                <div class="meta-item">
                  <span>⏱️ Duration: ${duration}</span>
                </div>
              </div>
            </div>
            
            <div class="summary-content">
              <div class="summary-title">
                <span class="sparkle">✨</span>
                <span>General Summary</span>
              </div>
              ${this.convertMarkdownToHTML(summary)}
            </div>
            
            <div class="footer">
              <p>This meeting summary was automatically generated and sent to you.</p>
              <p>If you have any questions, please contact your administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Convert markdown to HTML (basic conversion)
  private convertMarkdownToHTML(markdown: string): string {
    if (!markdown) return '<p>No summary available.</p>';
    
    return markdown
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')

    // unordered list markers (* and -)
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')

    // ordered lists (1. 2. etc.)
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')

    // bold
    .replace(/\\(.?)\\*/g, '<strong>$1</strong>')

    // italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

    // inline code (your special markers)
    .replace(/⁠ (.*?) ⁠/g, '<code>$1</code>')

    // paragraphs and line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<[h|l|p])(.+)$/gm, '<p>$1</p>')

    // wrap <li> with <ul>
    .replace(/<li>/g, '<ul><li>')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/<\/li>$/gm, '</li></ul>');
  }
}