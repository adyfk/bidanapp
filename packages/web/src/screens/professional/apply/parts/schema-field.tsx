'use client';

import type { ProfessionalRegistrationField } from '@marketplace/platform-config';
import { CheckboxField, MessageBanner } from '@marketplace/ui';
import { UploadCloud } from 'lucide-react';
import { isEnglishLocale } from '../../../../lib/marketplace-copy';
import { stringifyApplyValue } from '../utils';
import { applyFieldClassName, FormField } from './form-field';

export function ProfessionalSchemaField({
  field,
  locale,
  onBooleanChange,
  onTextChange,
  onUpload,
  uploadingFieldKey,
  value,
}: {
  field: ProfessionalRegistrationField;
  locale: string;
  onBooleanChange: (checked: boolean) => void;
  onTextChange: (value: string) => void;
  onUpload: (file: File | null) => void;
  uploadingFieldKey: string;
  value: string | boolean;
}) {
  if (field.type === 'textarea') {
    return (
      <FormField label={field.label} helperText={field.helperText}>
        <textarea
          className={`${applyFieldClassName} min-h-28`}
          placeholder={field.placeholder}
          value={stringifyApplyValue(value)}
          onChange={(event) => onTextChange(event.target.value)}
        />
      </FormField>
    );
  }

  if (field.type === 'boolean') {
    return (
      <CheckboxField
        checked={Boolean(value)}
        helperText={field.helperText}
        label={field.label}
        onChange={onBooleanChange}
      />
    );
  }

  if (field.type === 'document') {
    return (
      <div className="rounded-[24px] border border-pink-100/80 bg-[linear-gradient(180deg,#FFF7FB_0%,#FFFFFF_100%)] p-4 shadow-[0_18px_40px_-28px_rgba(17,24,39,0.18)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-gray-900">{field.label}</p>
            <p className="mt-1 text-[12px] leading-5 text-gray-500">
              {field.helperText ||
                (isEnglishLocale(locale)
                  ? 'Upload the proof requested for this review step.'
                  : 'Unggah bukti yang diminta untuk tahap review ini.')}
            </p>
          </div>
        </div>
        <input
          className={`mt-4 ${applyFieldClassName}`}
          onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
          type="file"
        />
        {stringifyApplyValue(value) ? (
          <div className="mt-3">
            <MessageBanner tone="success">
              <p className="text-xs font-semibold">{isEnglishLocale(locale) ? 'Document ready' : 'Dokumen siap'}</p>
              <p className="mt-1 break-all text-xs">{stringifyApplyValue(value)}</p>
            </MessageBanner>
          </div>
        ) : null}
        {uploadingFieldKey === field.key ? (
          <p className="mt-3 text-xs text-gray-500">{isEnglishLocale(locale) ? 'Uploading...' : 'Mengunggah...'}</p>
        ) : null}
      </div>
    );
  }

  return (
    <FormField label={field.label} helperText={field.helperText}>
      <input
        className={applyFieldClassName}
        placeholder={field.placeholder}
        value={stringifyApplyValue(value)}
        onChange={(event) => onTextChange(event.target.value)}
      />
    </FormField>
  );
}
