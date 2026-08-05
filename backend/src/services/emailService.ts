import { resend, EMAIL_FROM } from '../config/resend';

/**
 * emailService.ts
 * ------------------------------------------------------------------
 * Centralized email-sending functions for borrow-request lifecycle
 * notifications. Each function builds its own HTML template inline
 * (simple enough at this scale to not warrant a separate templating
 * engine) and sends via Resend.
 *
 * IMPORTANT: every function here is designed to FAIL SAFELY. Email
 * delivery is a nice-to-have notification, not a core business
 * operation — if Resend is down, misconfigured, or rate-limited, that
 * must never block or fail the actual borrow-request transaction it's
 * attached to. Every call site wraps these in a try-catch and only
 * logs a warning on failure (see borrowRequestController.ts).
 */

interface BorrowNotificationParams {
  to: string;
  recipientName: string;
  assetName: string;
  startDate: string;
  endDate: string;
}

/**
 * sendBorrowRequestCreatedEmail
 * ------------------------------------------------------------------
 * Sent to the ASSET OWNER when someone requests to borrow their item.
 */
export async function sendBorrowRequestCreatedEmail(
  params: BorrowNotificationParams & { requesterName: string }
): Promise<void> {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `New borrow request for "${params.assetName}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">New Borrow Request</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.requesterName}</strong> would like to borrow your item, <strong>${params.assetName}</strong>.</p>
        <p>Requested dates: <strong>${params.startDate}</strong> to <strong>${params.endDate}</strong></p>
        <p>Log in to ReBorrow to approve or reject this request.</p>
      </div>
    `,
  });
}

/**
 * sendBorrowRequestApprovedEmail
 * ------------------------------------------------------------------
 * Sent to the REQUESTER when the asset owner approves their request.
 */
export async function sendBorrowRequestApprovedEmail(
  params: BorrowNotificationParams
): Promise<void> {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Your request for "${params.assetName}" was approved!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Request Approved</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Good news — your request to borrow <strong>${params.assetName}</strong> has been approved.</p>
        <p>Dates: <strong>${params.startDate}</strong> to <strong>${params.endDate}</strong></p>
        <p>Coordinate pickup details with the owner via ReBorrow.</p>
      </div>
    `,
  });
}

/**
 * sendBorrowRequestRejectedEmail
 * ------------------------------------------------------------------
 * Sent to the REQUESTER when the asset owner rejects their request.
 */
export async function sendBorrowRequestRejectedEmail(
  params: BorrowNotificationParams
): Promise<void> {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Update on your request for "${params.assetName}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Request Not Approved</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Unfortunately, your request to borrow <strong>${params.assetName}</strong> was not approved this time.</p>
        <p>Feel free to browse other available items on ReBorrow.</p>
      </div>
    `,
  });
}