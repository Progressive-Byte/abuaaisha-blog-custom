import { Resend } from "resend";

export interface ContactEmail {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatReceivedAt(): string {
  return new Date().toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "full",
    timeStyle: "short",
  });
}

export async function sendContactEmail(contact: ContactEmail): Promise<"sent" | "stored"> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return "stored";

  const isBooking = contact.subject.startsWith("সেশন বুকিং");
  const sessionName = isBooking ? contact.subject.split(":")[1]?.trim() || contact.subject : "";
  const kind = isBooking ? "নতুন সেশন বুকিং" : "নতুন যোগাযোগ বার্তা";
  const receivedAt = formatReceivedAt();

  const text = [
    kind,
    "",
    `নাম: ${contact.name}`,
    `ইমেইল: ${contact.email}`,
    `বিষয়: ${contact.subject}`,
    sessionName ? `সেশন: ${sessionName}` : "",
    `সময়: ${receivedAt}`,
    "",
    "বার্তা:",
    contact.message,
    "",
    "---",
    `এই ইমেইলে Reply করলে সরাসরি ${contact.email} এ উত্তর যাবে।`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const rows: Array<[string, string]> = [
    ["নাম", contact.name],
    ["ইমেইল", contact.email],
    ["বিষয়", contact.subject],
  ];
  if (sessionName) rows.push(["সেশন", sessionName]);
  rows.push(["সময়", receivedAt]);

  const rowsHtml = rows
    .map(
      ([label, value], index) => `
        <tr>
          <td style="padding:10px 0;border-top:${index === 0 ? "none" : "1px solid #eceae3"};font-size:13px;color:#6b7280;width:110px;vertical-align:top;">${label}</td>
          <td style="padding:10px 0;border-top:${index === 0 ? "none" : "1px solid #eceae3"};font-size:15px;color:#1f2933;font-weight:600;">${
            label === "ইমেইল"
              ? `<a href="mailto:${escapeHtml(value)}" style="color:#0f6b47;text-decoration:none;">${escapeHtml(value)}</a>`
              : escapeHtml(value)
          }</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="bn">
  <body style="margin:0;padding:24px;background:#f5f2ea;font-family:'Noto Sans Bengali',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e2d8;">
      <tr>
        <td style="background:#0f3d2e;padding:24px 28px;color:#ffffff;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;">আবু আয়েশা · abuaaisha.com</div>
          <div style="font-size:22px;font-weight:700;margin-top:8px;">${kind}</div>
          ${sessionName ? `<div style="font-size:15px;opacity:.9;margin-top:6px;">${escapeHtml(sessionName)}</div>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
          <div style="margin-top:24px;font-size:13px;color:#6b7280;">বার্তা</div>
          <div style="margin-top:8px;padding:16px;background:#faf9f5;border:1px solid #eceae3;border-radius:8px;font-size:15px;line-height:1.7;color:#1f2933;">${escapeHtml(
            contact.message,
          ).replace(/\r?\n/g, "<br>")}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 24px;">
          <div style="border-top:1px solid #eceae3;padding-top:16px;font-size:12px;line-height:1.6;color:#6b7280;">
            এই ইমেইলে <strong style="color:#1f2933;">Reply</strong> করলে সরাসরি
            <a href="mailto:${escapeHtml(contact.email)}" style="color:#0f6b47;text-decoration:none;">${escapeHtml(
              contact.email,
            )}</a> এ উত্তর যাবে।
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: contact.email,
    subject: `[Abu Aaisha] ${contact.subject}`,
    text,
    html,
  });

  if (error) throw new Error(error.message);
  return "sent";
}
