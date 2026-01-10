interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Using Supabase's built-in email functionality
    // This requires SMTP to be configured in your Supabase project settings
    // Go to: Supabase Dashboard → Project Settings → Auth → SMTP Settings

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase credentials missing for email sending");
      console.log("Email would be sent:", {
        to: options.to,
        subject: options.subject,
        htmlPreview: options.html.substring(0, 100) + "...",
      });
      return false;
    }

    // Use Supabase's email invite functionality
    // Note: This sends via Supabase's configured SMTP
    const response = await fetch(`${supabaseUrl}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email: options.to,
        data: {
          email_subject: options.subject,
          email_body: options.html,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Supabase email error:', error);

      // Fallback: log the email details
      console.log("📧 Email details (not sent):", {
        to: options.to,
        subject: options.subject,
        htmlPreview: options.html.substring(0, 100) + "...",
      });
      return false;
    }

    console.log(`✅ Email sent via Supabase to: ${options.to}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send email:", err);

    // Fallback: log the email details
    console.log("📧 Email details (not sent):", {
      to: options.to,
      subject: options.subject,
      htmlPreview: options.html.substring(0, 100) + "...",
    });
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
