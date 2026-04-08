require("dotenv").config();
const nodemailer = require("nodemailer");

const requiredFields = ["name", "phone", "email", "location", "serviceType", "details"];

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const formData = req.body || {};

  if (formData.company) {
    return res.status(200).json({ ok: true });
  }

  for (const field of requiredFields) {
    if (!String(formData[field] || "").trim()) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({
      error: "Email service is not configured yet. Add GMAIL_USER and GMAIL_APP_PASSWORD to your environment variables.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const safe = (value) => String(value || "").trim();
    const htmlSafe = (value) => escapeHtml(safe(value));
    const html = `
      <h2>New Flyway Glass Service Request</h2>
      <p><strong>Name:</strong> ${htmlSafe(formData.name)}</p>
      <p><strong>Phone:</strong> ${htmlSafe(formData.phone)}</p>
      <p><strong>Email:</strong> ${htmlSafe(formData.email)}</p>
      <p><strong>Location:</strong> ${htmlSafe(formData.location)}</p>
      <p><strong>Service Type:</strong> ${htmlSafe(formData.serviceType)}</p>
      <p><strong>Vehicle / Equipment:</strong> ${htmlSafe(formData.vehicle) || "Not provided"}</p>
      <p><strong>Details:</strong></p>
      <p>${htmlSafe(formData.details).replace(/\n/g, "<br>")}</p>
    `;

    await transporter.sendMail({
      from: `"Flyway Glass Website" <${process.env.GMAIL_USER}>`,
      to: process.env.REQUEST_TO_EMAIL || "flywayglass@gmail.com",
      replyTo: safe(formData.email),
      subject: `New Service Request: ${safe(formData.serviceType)} - ${safe(formData.name)}`,
      text: [
        "New Flyway Glass Service Request",
        `Name: ${safe(formData.name)}`,
        `Phone: ${safe(formData.phone)}`,
        `Email: ${safe(formData.email)}`,
        `Location: ${safe(formData.location)}`,
        `Service Type: ${safe(formData.serviceType)}`,
        `Vehicle / Equipment: ${safe(formData.vehicle) || "Not provided"}`,
        "Details:",
        safe(formData.details),
      ].join("\n"),
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "The request could not be emailed right now. Please verify the Gmail credentials and try again.",
    });
  }
};
