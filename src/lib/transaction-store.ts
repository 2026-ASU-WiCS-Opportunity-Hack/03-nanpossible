import { promises as fs } from 'fs';
import path from 'path';
import Stripe from 'stripe';

export type TransactionRecord = {
  sessionId: string;
  paymentIntentId: string;
  dueType: string;
  amount: number;
  currency: string;
  customerEmail: string | null;
  paymentStatus: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), 'data');
const transactionsFile = path.join(dataDir, 'transactions.json');

async function ensureStoreFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(transactionsFile);
  } catch {
    await fs.writeFile(transactionsFile, '[]', 'utf8');
  }
}

async function readTransactions(): Promise<TransactionRecord[]> {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(transactionsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TransactionRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeTransactions(transactions: TransactionRecord[]) {
  await ensureStoreFile();
  const sorted = [...transactions].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  await fs.writeFile(transactionsFile, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
}

export async function getTransactions() {
  return readTransactions();
}

export async function upsertTransactionFromSession(session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || '';

  if (!session.id || !paymentIntentId) {
    return null;
  }

  const record: TransactionRecord = {
    sessionId: session.id,
    paymentIntentId,
    dueType: session.metadata?.dueType || 'unknown',
    amount: (session.amount_total || 0) / 100,
    currency: (session.currency || 'usd').toUpperCase(),
    customerEmail: session.customer_details?.email ?? null,
    paymentStatus: session.payment_status || 'unpaid',
    createdAt: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
  };

  const transactions = await readTransactions();
  const existingIndex = transactions.findIndex((item) => item.sessionId === record.sessionId);

  if (existingIndex >= 0) {
    transactions[existingIndex] = record;
  } else {
    transactions.push(record);
  }

  await writeTransactions(transactions);
  return record;
}
