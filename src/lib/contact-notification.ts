/**
 * Notification email for the /contact form. Pure, so it is unit-testable;
 * the server action sends it to the COACH_LEAD_NOTIFY_EMAILS recipients
 * (shared with the /become-a-coach form, see `coachLeadRecipients`).
 */

export type ContactMessage = {
  name: string;
  email: string;
  country: string;
  about: string;
  message: string;
  subscribedToNewsletter: boolean;
};

/** Single-line header value: strips CR/LF so user input cannot break the subject. */
function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function buildContactNotificationEmail(contact: ContactMessage) {
  return {
    subject: oneLine(`[${contact.about}] New contact message from ${contact.name}`),
    text: [
      `About: ${contact.about}`,
      `Country: ${contact.country}`,
      "",
      `Name: ${contact.name}`,
      `Email: ${contact.email}`,
      `Newsletter opt-in: ${contact.subscribedToNewsletter ? "yes" : "no"}`,
      "",
      "Message:",
      contact.message,
      "",
      "Sent from the Contact WIAL form.",
    ].join("\n"),
  };
}
