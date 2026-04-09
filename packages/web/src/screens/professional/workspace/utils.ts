export function formatWorkspaceCurrency(amount: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    currency: currency || 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount || 0);
}

export function updateAtIndex<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}
