import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';

const duesPrices: Record<string, number> = {
  annual: 10000, // $100.00
  workshop: 5000, // $50.00
  certification: 20000 // $200.00
};

export async function POST(request: Request) {
  try {
    const { dueType } = await request.json();

    if (!duesPrices[dueType]) {
      return NextResponse.json({ error: 'Invalid due type' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      metadata: {
        dueType,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${dueType.charAt(0).toUpperCase() + dueType.slice(1)} Dues`,
            },
            unit_amount: duesPrices[dueType],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error creating checkout session', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
