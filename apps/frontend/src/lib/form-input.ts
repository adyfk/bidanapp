const idrCurrencyFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export const extractDigits = (value: string) => value.replace(/\D/g, '');

export const sanitizePhoneValue = (value: string) => {
  const allowedCharacters = value.replace(/[^\d+\s()-]/g, '');
  const hasLeadingPlus = allowedCharacters.startsWith('+');
  const normalizedValue = hasLeadingPlus
    ? `+${allowedCharacters.slice(1).replace(/\+/g, '')}`
    : allowedCharacters.replace(/\+/g, '');

  return normalizedValue.replace(/\s{2,}/g, ' ');
};

export const sanitizeNumericValue = (
  value: string,
  {
    allowDecimal = false,
    allowNegative = false,
    maxDecimals,
  }: {
    allowDecimal?: boolean;
    allowNegative?: boolean;
    maxDecimals?: number;
  } = {},
) => {
  const normalizedValue = value.replace(/[^\d.,-]/g, '').replace(/,/g, '.');
  const hasLeadingNegative = allowNegative && normalizedValue.startsWith('-');
  const unsignedValue = normalizedValue.replace(/-/g, '');

  if (!allowDecimal) {
    return `${hasLeadingNegative ? '-' : ''}${unsignedValue.replace(/\./g, '')}`;
  }

  const firstDecimalIndex = unsignedValue.indexOf('.');

  if (firstDecimalIndex === -1) {
    return `${hasLeadingNegative ? '-' : ''}${unsignedValue}`;
  }

  const integerPart = unsignedValue.slice(0, firstDecimalIndex);
  let decimalPart = unsignedValue.slice(firstDecimalIndex + 1).replace(/\./g, '');

  if (typeof maxDecimals === 'number') {
    decimalPart = decimalPart.slice(0, maxDecimals);
  }

  const hasTrailingDecimal = unsignedValue.endsWith('.') && decimalPart.length === 0;

  return `${hasLeadingNegative ? '-' : ''}${integerPart}.${hasTrailingDecimal ? '' : decimalPart}`;
};

export const formatIdrCurrencyValue = (value: string) => {
  const digits = extractDigits(value);

  if (!digits) {
    return '';
  }

  return `Rp ${idrCurrencyFormatter.format(Number(digits))}`;
};

export const extractDateInputValue = (value?: string) => String(value || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';

export const extractTimeInputValue = (value?: string) => String(value || '').match(/\d{2}:\d{2}/)?.[0] || '';
