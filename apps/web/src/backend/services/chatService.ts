import { supabase } from '../config/supabase';

interface PlaidAccount {
  name?: string | null;
  mask?: string | null;
  current_balance?: number | null;
  currency?: string | null;
}

interface TransactionRecord {
  name?: string | null;
  amount?: number | null;
  date?: string | null;
  iso_currency?: string | null;
  category?: string[] | string | null;
}

export async function buildPlaidContext(user_id: string) {
  if (!user_id) return '';

  const { data: accounts } = await supabase
    .from('plaid_accounts')
    .select('name, mask, current_balance, currency')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: txs } = await supabase
    .from('transactions')
    .select('name, amount, date, iso_currency, category')
    .eq('user_id', user_id)
    .order('date', { ascending: false })
    .limit(5);

  let out = '';

  if (accounts && accounts.length) {
    out += 'Accounts (top 3):\n';
    accounts.forEach((a: PlaidAccount) => {
      out += `- ${a.name ?? 'Account'}${a.mask ? ' ****' + a.mask : ''}: ${a.current_balance ?? '—'} ${a.currency ?? ''}\n`;
    });
    out += '\n';
  }

  if (txs && txs.length) {
    out += 'Recent transactions (up to 5):\n';
    txs.forEach((t: TransactionRecord) => {
      const cat = Array.isArray(t.category) ? t.category.join(' > ') : t.category ?? '';
      out += `- ${t.date} • ${t.name} • ${t.amount} ${t.iso_currency ?? ''} ${cat ? `(${cat})` : ''}\n`;
    });
    out += '\n';
  }

  return out.trim();
}