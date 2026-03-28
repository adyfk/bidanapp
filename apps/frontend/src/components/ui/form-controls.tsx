'use client';

import { CalendarDays, Check, ChevronDown, Clock3, Search, X } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ReactNode, useRef, useState } from 'react';
import {
  extractDateInputValue,
  extractTimeInputValue,
  formatIdrCurrencyValue,
  sanitizeNumericValue,
  sanitizePhoneValue,
} from '@/lib/form-input';
import {
  buildStandardFieldButtonClass,
  buildStandardInputClass,
  buildStandardOptionClass,
  buildStandardSelectClass,
  type StandardFieldAccent,
  type StandardFieldSurface,
  standardDropdownPanelClass,
} from './form-styles';

type ValueInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'> & {
  accent?: StandardFieldAccent;
  onValueChange: (value: string) => void;
  surface?: StandardFieldSurface;
  value: string;
};

export interface SearchableSelectOption {
  description?: string;
  keywords?: string[];
  label: string;
  value: string;
}

const joinClassNames = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

const filterOptions = (options: SearchableSelectOption[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return options;
  }

  return options.filter((option) =>
    [option.label, option.description, ...(option.keywords || [])].join(' ').toLowerCase().includes(normalizedQuery),
  );
};

const PickerActionButton = ({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="absolute inset-y-2 right-2 flex w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
  >
    {icon}
  </button>
);

export const StandardTextInput = ({
  accent = 'blue',
  className,
  onValueChange,
  surface = 'muted',
  value,
  ...props
}: ValueInputProps) => (
  <input
    {...props}
    value={value}
    onChange={(event) => onValueChange(event.target.value)}
    className={joinClassNames(buildStandardInputClass({ accent, surface }), className)}
  />
);

export const StandardPhoneInput = ({
  autoComplete = 'tel',
  inputMode = 'tel',
  onValueChange,
  type = 'tel',
  ...props
}: ValueInputProps) => (
  <StandardTextInput
    {...props}
    autoComplete={autoComplete}
    inputMode={inputMode}
    type={type}
    onValueChange={(nextValue) => onValueChange(sanitizePhoneValue(nextValue))}
  />
);

export const StandardNumberInput = ({
  inputMode,
  onValueChange,
  type = 'text',
  ...props
}: ValueInputProps & {
  allowDecimal?: boolean;
  allowNegative?: boolean;
  maxDecimals?: number;
}) => {
  const { allowDecimal = false, allowNegative = false, maxDecimals, ...inputProps } = props;

  return (
    <StandardTextInput
      {...inputProps}
      type={type}
      inputMode={inputMode || (allowDecimal ? 'decimal' : 'numeric')}
      onValueChange={(nextValue) =>
        onValueChange(
          sanitizeNumericValue(nextValue, {
            allowDecimal,
            allowNegative,
            maxDecimals,
          }),
        )
      }
    />
  );
};

export const StandardCurrencyInput = ({
  inputMode = 'numeric',
  onValueChange,
  type = 'text',
  ...props
}: ValueInputProps) => (
  <StandardTextInput
    {...props}
    type={type}
    inputMode={inputMode}
    onValueChange={(nextValue) => onValueChange(formatIdrCurrencyValue(nextValue))}
  />
);

export const StandardSearchInput = ({
  accent = 'blue',
  className,
  onValueChange,
  surface = 'muted',
  type = 'search',
  value,
  ...props
}: ValueInputProps) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      {...props}
      type={type}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={joinClassNames(buildStandardInputClass({ accent, surface }), 'pl-11', className)}
    />
  </div>
);

export const StandardSelect = ({
  accent = 'blue',
  children,
  className,
  onValueChange,
  surface = 'muted',
  value,
  ...props
}: Omit<ComponentPropsWithoutRef<'select'>, 'onChange' | 'value'> & {
  accent?: StandardFieldAccent;
  onValueChange: (value: string) => void;
  surface?: StandardFieldSurface;
  value: string;
}) => (
  <div className="relative">
    <select
      {...props}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={joinClassNames(buildStandardSelectClass({ accent, surface }), className)}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

export const StandardDateInput = ({
  accent = 'blue',
  className,
  onValueChange,
  surface = 'muted',
  value,
  ...props
}: ValueInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const picker = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.focus();
  };

  return (
    <div className="relative">
      <input
        {...props}
        ref={inputRef}
        type="date"
        value={extractDateInputValue(value)}
        onChange={(event) => onValueChange(event.target.value)}
        className={joinClassNames(buildStandardInputClass({ accent, surface }), 'pr-12', className)}
      />
      <PickerActionButton icon={<CalendarDays className="h-4 w-4" />} label="Buka kalender" onClick={openPicker} />
    </div>
  );
};

export const StandardTimeInput = ({
  accent = 'blue',
  className,
  onValueChange,
  surface = 'muted',
  value,
  ...props
}: ValueInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const picker = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;

    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.focus();
  };

  return (
    <div className="relative">
      <input
        {...props}
        ref={inputRef}
        type="time"
        value={extractTimeInputValue(value)}
        onChange={(event) => onValueChange(event.target.value)}
        className={joinClassNames(buildStandardInputClass({ accent, surface }), 'pr-12', className)}
      />
      <PickerActionButton icon={<Clock3 className="h-4 w-4" />} label="Buka pemilih waktu" onClick={openPicker} />
    </div>
  );
};

export const StandardSearchableSelect = ({
  accent = 'blue',
  emptyStateLabel = 'Tidak ada hasil yang cocok.',
  options,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Cari opsi...',
  surface = 'muted',
  value,
}: {
  accent?: StandardFieldAccent;
  emptyStateLabel?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  surface?: StandardFieldSurface;
  value: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOption = options.find((option) => option.value === value) || null;
  const filteredOptions = filterOptions(options, query);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={buildStandardFieldButtonClass({ accent, surface })}
      >
        <span className={selectedOption ? 'text-slate-700' : 'text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className={standardDropdownPanelClass}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <StandardSearchInput
                accent={accent}
                placeholder={searchPlaceholder}
                surface="soft"
                value={query}
                onValueChange={setQuery}
              />
            </div>
            {selectedOption ? (
              <button
                type="button"
                onClick={() => {
                  onValueChange('');
                  setQuery('');
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isActive = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onValueChange(option.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={buildStandardOptionClass({ accent, isActive })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold">{option.label}</p>
                        {option.description ? (
                          <p
                            className={`mt-1 text-[12px] leading-relaxed ${isActive ? 'text-current/80' : 'text-slate-500'}`}
                          >
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                      {isActive ? <Check className="mt-0.5 h-4 w-4 flex-shrink-0" /> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-[13px] text-slate-500">
                {emptyStateLabel}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const StandardMultiSelect = ({
  accent = 'blue',
  emptyStateLabel = 'Tidak ada hasil yang cocok.',
  options,
  onValuesChange,
  placeholder,
  searchPlaceholder = 'Cari opsi...',
  surface = 'muted',
  values,
}: {
  accent?: StandardFieldAccent;
  emptyStateLabel?: string;
  onValuesChange: (values: string[]) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  surface?: StandardFieldSurface;
  values: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredOptions = filterOptions(options, query);
  const selectedLabels = options.filter((option) => values.includes(option.value)).map((option) => option.label);
  const summaryLabel =
    selectedLabels.length === 0
      ? placeholder
      : `${selectedLabels.slice(0, 2).join(', ')}${selectedLabels.length > 2 ? ` +${selectedLabels.length - 2}` : ''}`;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={buildStandardFieldButtonClass({ accent, surface })}
      >
        <span className={selectedLabels.length > 0 ? 'text-slate-700' : 'text-slate-400'}>{summaryLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className={standardDropdownPanelClass}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <StandardSearchInput
                accent={accent}
                placeholder={searchPlaceholder}
                surface="soft"
                value={query}
                onValueChange={setQuery}
              />
            </div>
            {values.length > 0 ? (
              <button
                type="button"
                onClick={() => onValuesChange([])}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Reset
              </button>
            ) : null}
          </div>

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isActive = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onValuesChange(
                        isActive
                          ? values.filter((currentValue) => currentValue !== option.value)
                          : [...values, option.value],
                      )
                    }
                    className={buildStandardOptionClass({ accent, isActive })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold">{option.label}</p>
                        {option.description ? (
                          <p
                            className={`mt-1 text-[12px] leading-relaxed ${isActive ? 'text-current/80' : 'text-slate-500'}`}
                          >
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                      {isActive ? <Check className="mt-0.5 h-4 w-4 flex-shrink-0" /> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-[13px] text-slate-500">
                {emptyStateLabel}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
