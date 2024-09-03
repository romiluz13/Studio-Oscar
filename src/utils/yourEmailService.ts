import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY as string);

export const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = {
    to,
    from: 'your-verified-sender@example.com', // Change to your verified sender
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};