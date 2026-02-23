import { Resend } from 'resend'
import { config } from '../config.js'

let resend: Resend | null = null
if (config.emailEnabled && config.resendApiKey) {
  resend = new Resend(config.resendApiKey)
}

export async function sendDeliveryEmail(
  toEmail: string,
  senderName: string,
  trackingNumber: string,
  recipientName: string,
  deliveryTime: Date
): Promise<boolean> {
  if (!resend) {
    console.log(`[Email] Disabled. Would notify ${toEmail} about delivery of ${trackingNumber}`)
    return false
  }

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Package Delivered Successfully!</h2>
          <p>Dear ${senderName},</p>
          <p>Your package has been delivered successfully.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p style="margin: 5px 0;"><strong>Recipient:</strong> ${recipientName}</p>
            <p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${deliveryTime.toUTCString()}</p>
          </div>
          <p>Thank you for using OATH Logistics!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">This is an automated notification from OATH Logistics.</p>
        </div>
      </body>
    </html>
  `

  try {
    const { error } = await resend.emails.send({
      from: config.emailFrom,
      to: toEmail,
      subject: `Package Delivered - ${trackingNumber}`,
      html,
    })
    if (error) {
      console.error('[Email] Resend error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[Email] Failed to send delivery email:', err)
    return false
  }
}

export async function sendNfcScanEmail(
  toEmail: string,
  driverName: string,
  locationName: string,
  officeName: string
): Promise<boolean> {
  if (!resend) return false

  try {
    const { error } = await resend.emails.send({
      from: config.emailFrom,
      to: toEmail,
      subject: `NFC Scan Alert: ${driverName} at ${locationName}`,
      html: `
        <h2>NFC Tag Scanned</h2>
        <p><strong>Driver:</strong> ${driverName}</p>
        <p><strong>Location:</strong> ${locationName} (${officeName})</p>
        <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
        <p>The driver can now scan packages at this location.</p>
      `,
    })
    return !error
  } catch {
    return false
  }
}
