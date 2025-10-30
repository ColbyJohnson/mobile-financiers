import { plaidClient } from '../config/plaid';
import { supabase } from '../config/supabase';
import type { CountryCode, Products } from 'plaid';

export async function createSandboxPublicToken(institution_id = 'ins_130958', products = ['transactions']) {
  // only available in sandbox environment
  const resp = await plaidClient.sandboxPublicTokenCreate({
    institution_id,
    initial_products: products as Products[],
  });
  return resp.data.public_token;
}

export async function createLinkToken(user_id: string) {
  const resp = await plaidClient.linkTokenCreate({
    user: { client_user_id: user_id },
    client_name: 'Mobile Financiers',
    products: ['transactions' as Products],
    country_codes: ['US' as CountryCode],
    language: 'en',
  });
  return resp.data;
}

export async function exchangePublicTokenAndStore(public_token: string, user_id: string) {
  const resp = await plaidClient.itemPublicTokenExchange({ public_token });
  const { access_token, item_id } = resp.data;

  // store access_token / item in Supabase and associate with user_id
  // use onConflict: 'user_id' so each user has at most one item
  const { data, error } = await supabase
    .from('plaid_items')
    .upsert(
      { user_id, item_id, access_token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;

  return { access_token, item_id, db: data };
}

export async function fetchAccounts(access_token: string) {
  const resp = await plaidClient.accountsGet({ access_token });
  return resp.data.accounts;
}

export async function fetchTransactions(access_token: string, start_date: string, end_date: string) {
  // basic single-page implementation (adjust paging for >5000 tx)
  const resp = await plaidClient.transactionsGet({
    access_token,
    start_date,
    end_date,
    options: { count: 500, offset: 0 },
  });
  return resp.data.transactions;
}

export async function syncToSupabase(access_token: string, user_id: string, start_date: string, end_date: string) {
  const accounts = await fetchAccounts(access_token);
  const transactions = await fetchTransactions(access_token, start_date, end_date);

  // upsert accounts
  const accountRows = accounts.map(a => ({
    user_id,
    account_id: a.account_id,
    name: a.name,
    mask: a.mask,
    subtype: a.subtype,
    type: a.type,
    current_balance: a.balances?.current ?? null,
    available_balance: a.balances?.available ?? null,
    currency: a.balances?.iso_currency_code ?? null,
  }));

  const { error: accErr } = await supabase.from('plaid_accounts').upsert(accountRows, { onConflict: 'account_id' });
  if (accErr) throw accErr;

  // insert transactions (avoid duplicates by using primary key or upsert if you added one)
  const txRows = transactions.map(t => ({
    user_id,
    transaction_id: t.transaction_id,
    account_id: t.account_id,
    name: t.name,
    amount: t.amount,
    iso_currency: t.iso_currency_code,
    category: (t.category || []).join(' > '),
    date: t.date,
    raw: t,
  }));

  const { error: txErr } = await supabase.from('transactions').upsert(txRows, { onConflict: 'transaction_id' });
  if (txErr) throw txErr;

  return { accounts: accountRows.length, transactions: txRows.length };
}