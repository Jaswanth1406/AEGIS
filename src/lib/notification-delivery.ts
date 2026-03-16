import nodemailer from "nodemailer";
import { lookup } from "node:dns/promises";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT || "587";
  const secureRaw = process.env.SMTP_SECURE || "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(portRaw);
  const secure = secureRaw.toLowerCase() === "true";

  return { host, port, secure, user, pass };
}

function createTransporter(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  servername?: string;
}) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    // force IPv4
    family: 4,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      // Keep certificate verification bound to the real SMTP hostname.
      servername: config.servername || config.host,
    },
  });
}

export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  body: string;
}) {
  const config = getSmtpConfig();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!config || !from) {
    console.warn("SMTP environment is not fully configured. Skipping email send.");
    return { sent: false, reason: "missing_smtp_config" };
  }

  const send = async (hostOverride?: string) => {
    const transporter = createTransporter({
      ...config,
      host: hostOverride || config.host,
      servername: config.host,
    });
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.body,
    });
  };

  const resolved = await lookup(config.host, { family: 4 });
  await send(resolved.address);

  return { sent: true };
}

export async function sendSlackNotification(params: {
  webhookUrl: string;
  message: string;
}) {
  const { webhookUrl, message } = params;
  if (!webhookUrl) {
    return { sent: false, reason: "missing_slack_webhook" };
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack webhook failed: ${res.status} ${text}`);
  }

  return { sent: true };
}
