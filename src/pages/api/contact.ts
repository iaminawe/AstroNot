import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { emailConfig } from '../../config/email';

export const post: APIRoute = async ({ request }) => {
  try {
    // Parse the form data
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const subject = formData.get('subject')?.toString();
    const message = formData.get('message')?.toString();

    // Validate the form data
    if (!email || !subject || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Please fill out all fields',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: emailConfig.from,
      to: emailConfig.to,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `
        Name: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
      `,
      html: `
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    // Return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your message has been sent successfully!',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Return an error response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'There was an error sending your message. Please try again later.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
