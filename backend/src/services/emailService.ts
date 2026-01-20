import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../config/database';
import { emailQueue } from '../config/queue';

let transporter: Transporter | null = null;

/**
 * Initialize Ethereal email transporter
 * Call this once on server startup
 */
export async function initializeEmailService() {
  if (transporter) return;

  const account = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  console.log('📧 Ethereal email service initialized');
}

/**
 * Schedule an email:
 * 1. Save to DB
 * 2. Add delayed BullMQ job
 */
export async function scheduleEmail(data: {
  userId: string;                 // ✅ REQUIRED
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
}) {
  // 1️⃣ Create DB record
  const email = await prisma.email.create({
    data: {
      userId: data.userId,        // ✅ FIX
      senderEmail: data.senderEmail,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      body: data.body,
      scheduledAt: data.scheduledAt,
      status: 'SCHEDULED',
    },
  });

  // 2️⃣ Calculate delay
  const delay = Math.max(0, data.scheduledAt.getTime() - Date.now());

  // 3️⃣ Enqueue BullMQ job
  await emailQueue.add(
    'send-email',
    {
      emailId: email.id,
    },
    {
      jobId: email.id, // idempotency
      delay,
    }
  );

  return email;
}

/**
 * Actually send email (used by worker)
 */
export async function sendEmail(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    throw new Error('Email service not initialized');
  }

  const info = await transporter.sendMail({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}
