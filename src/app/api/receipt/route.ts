import PDFDocument from 'pdfkit';
import { getStripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';

function formatMoney(amountInCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

function createPdfBuffer(lines: Array<[string, string]>) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on('error', reject);

    doc
      .fontSize(22)
      .fillColor('#111827')
      .text('Payment Receipt', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor('#6b7280')
      .text('NaNpossible dues payment confirmation', { align: 'center' });

    doc.moveDown(1.5);

    lines.forEach(([label, value]) => {
      doc.fontSize(12).fillColor('#111827').text(label, { continued: true, width: 170 });
      doc.fillColor('#374151').text(value);
      doc.moveDown(0.5);
    });

    doc.moveDown(1.5);
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('This receipt confirms that the payment was successfully completed through Stripe.');

    doc.end();
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return Response.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Receipt is only available for paid sessions.' }, { status: 400 });
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || 'n/a';
    const amount = session.amount_total || 0;
    const currency = session.currency || 'usd';
    const dueType = session.metadata?.dueType || 'unknown';
    const customerEmail = session.customer_details?.email || 'not provided';
    const createdAt = new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const pdfBuffer = await createPdfBuffer([
      ['Session ID:', session.id],
      ['Payment Intent:', paymentIntentId],
      ['Due Type:', dueType],
      ['Amount:', formatMoney(amount, currency)],
      ['Customer Email:', customerEmail],
      ['Paid On:', createdAt],
    ]);

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${session.id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate receipt';
    return Response.json({ error: message }, { status: 500 });
  }
}
