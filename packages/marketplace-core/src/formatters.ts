export function isEnglishLocale(locale?: string | null) {
  return locale === 'en';
}

export function formatCurrency(amount: number, locale?: string | null, currency = 'IDR') {
  return new Intl.NumberFormat(isEnglishLocale(locale) ? 'en-US' : 'id-ID', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount || 0);
}

export function formatDateTime(value: string | undefined, locale?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(isEnglishLocale(locale) ? 'en-US' : 'id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function orderStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'pending_payment':
      return en ? 'Awaiting payment' : 'Menunggu pembayaran';
    case 'pending_fulfillment':
      return en ? 'Preparing service' : 'Menunggu diproses';
    case 'in_progress':
      return en ? 'In progress' : 'Sedang berjalan';
    case 'completed':
      return en ? 'Completed' : 'Selesai';
    case 'refunded':
      return en ? 'Refunded' : 'Refund selesai';
    case 'cancelled':
      return en ? 'Cancelled' : 'Dibatalkan';
    default:
      return status || (en ? 'Unknown status' : 'Status belum diketahui');
  }
}

export function paymentStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'pending':
    case 'pending_payment':
      return en ? 'Pending payment' : 'Belum dibayar';
    case 'paid':
      return en ? 'Paid' : 'Sudah dibayar';
    case 'failed':
      return en ? 'Payment failed' : 'Pembayaran gagal';
    case 'refunded':
      return en ? 'Refunded' : 'Sudah direfund';
    case 'cancelled':
      return en ? 'Payment cancelled' : 'Pembayaran dibatalkan';
    case 'expired':
      return en ? 'Payment expired' : 'Pembayaran kedaluwarsa';
    default:
      return status || (en ? 'Unknown payment' : 'Status pembayaran belum diketahui');
  }
}

export function supportStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'new':
      return en ? 'New' : 'Baru';
    case 'triaged':
      return en ? 'In review' : 'Sedang ditinjau';
    case 'reviewing':
      return en ? 'Being handled' : 'Sedang ditangani';
    case 'resolved':
      return en ? 'Resolved' : 'Selesai';
    case 'refunded':
      return en ? 'Refund handled' : 'Refund ditangani';
    case 'closed':
      return en ? 'Closed' : 'Ditutup';
    default:
      return status || (en ? 'Unknown ticket' : 'Status tiket belum diketahui');
  }
}

export function offeringStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'draft':
      return en ? 'Draft' : 'Draf';
    case 'published':
      return en ? 'Published' : 'Terbit';
    case 'archived':
      return en ? 'Archived' : 'Diarsipkan';
    default:
      return status?.replaceAll('_', ' ') || (en ? 'Unknown service' : 'Status layanan belum diketahui');
  }
}

export function reviewStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'draft':
      return en ? 'Draft' : 'Draf';
    case 'submitted':
    case 'pending_review':
      return en ? 'Awaiting review' : 'Menunggu review';
    case 'changes_requested':
      return en ? 'Needs revision' : 'Perlu revisi';
    case 'approved':
      return en ? 'Approved' : 'Disetujui';
    case 'rejected':
      return en ? 'Rejected' : 'Ditolak';
    case 'paused':
      return en ? 'Paused' : 'Dijeda';
    default:
      return status?.replaceAll('_', ' ') || (en ? 'Unknown review' : 'Status review belum diketahui');
  }
}

export function refundStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'pending':
      return en ? 'Refund pending' : 'Refund menunggu';
    case 'approved':
      return en ? 'Refund approved' : 'Refund disetujui';
    case 'processed':
      return en ? 'Refund processed' : 'Refund diproses';
    case 'failed':
      return en ? 'Refund failed' : 'Refund gagal';
    default:
      return status?.replaceAll('_', ' ') || (en ? 'Unknown refund' : 'Status refund belum diketahui');
  }
}

export function payoutStatusLabel(status: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (status) {
    case 'pending':
      return en ? 'Payout pending' : 'Payout menunggu';
    case 'processing':
      return en ? 'Payout processing' : 'Payout diproses';
    case 'paid':
      return en ? 'Paid out' : 'Sudah dicairkan';
    case 'failed':
      return en ? 'Payout failed' : 'Payout gagal';
    default:
      return status?.replaceAll('_', ' ') || (en ? 'Unknown payout' : 'Status payout belum diketahui');
  }
}

export function notificationKindLabel(kind: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (kind) {
    case 'order':
      return en ? 'Order update' : 'Update order';
    case 'support':
      return en ? 'Support update' : 'Update support';
    case 'review':
      return en ? 'Review update' : 'Update review';
    case 'payment':
      return en ? 'Payment update' : 'Update pembayaran';
    default:
      return kind || (en ? 'Activity' : 'Aktivitas');
  }
}

export function offeringTypeLabel(value: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (value) {
    case 'home_visit':
      return en ? 'Home visit' : 'Kunjungan rumah';
    case 'online_session':
      return en ? 'Online session' : 'Sesi online';
    case 'digital_product':
      return en ? 'Digital product' : 'Produk digital';
    default:
      return value?.replaceAll('_', ' ') || (en ? 'Service' : 'Layanan');
  }
}

export function deliveryModeLabel(value: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (value) {
    case 'on_site':
      return en ? 'On site' : 'Datang ke lokasi';
    case 'home_visit':
      return en ? 'At home' : 'Datang ke rumah';
    case 'online':
      return en ? 'Online' : 'Online';
    case 'digital':
      return en ? 'Digital delivery' : 'Dikirim digital';
    default:
      return value?.replaceAll('_', ' ') || (en ? 'Flexible' : 'Fleksibel');
  }
}

export function firstName(value: string | undefined | null) {
  if (!value) {
    return '';
  }
  return value.trim().split(/\s+/)[0] || value;
}
