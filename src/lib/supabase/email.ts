interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Note: Email sending with Supabase requires email configured in project settings
    // For production, integrate with SendGrid, Resend, or similar
    console.log("Email would be sent:", {
      to: options.to,
      subject: options.subject,
      htmlPreview: options.html.substring(0, 100) + "...",
    });

    // TODO: Integrate with email service provider (SendGrid, Resend, etc.)
    // Example integration:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}` },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: options.to }] }],
    //     from: { email: 'noreply@example.com' },
    //     subject: options.subject,
    //     content: [{ type: 'text/html', value: options.html }]
    //   })
    // });

    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

export function createInvitationEmailHTML(
  invitationId: string,
  inviterName: string,
  ladderName?: string
) {
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup/invitation?invitation=${invitationId}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 6px; 
            text-decoration: none; 
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited! 🎯</h1>
          </div>
          
          <div class="content">
            <p>Hello!</p>
            <p><strong>${inviterName}</strong> has invited you to join ${ladderName ? `the <strong>${ladderName}</strong> ladder` : "KS Sports Ladder"}!</p>
            
            <p>Click the button below to create your account and get started:</p>
            
            <a href="${inviteLink}" class="button">Join the Ladder →</a>
            
            <p style="color: #999; font-size: 13px;">
              Or copy this link: <br/>
              <code style="background: white; padding: 5px 10px; border-radius: 4px; display: block; word-break: break-all; margin-top: 10px;">
                ${inviteLink}
              </code>
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation will expire in 30 days.</p>
            <p>© 2026 KS Sports Ladder. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
