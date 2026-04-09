'use client';

export function formatAdminCurrency(amount: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    currency: currency || 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount || 0);
}
