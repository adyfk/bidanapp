'use client';

import { Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StandardSearchableSelect } from '@/components/ui/form-controls';
import type { ProfessionalManagedService } from '@/lib/use-professional-portal';
import { dashboardInputClass, dashboardTextareaClass, dashboardTextareaTallClass } from './editorStyles';
import { DashboardDialog, LabeledField, SegmentButton } from './ProfessionalDashboardShared';
import type { PortfolioDraft } from './types';

interface ProfessionalDashboardPortfolioEditorDialogProps {
  activeServiceConfigurations: ProfessionalManagedService[];
  getServiceLabel: (serviceId: string) => string;
  onChangeDraft: (draft: PortfolioDraft) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  portfolioDraft: PortfolioDraft;
}

export const ProfessionalDashboardPortfolioEditorDialog = ({
  activeServiceConfigurations,
  getServiceLabel,
  onChangeDraft,
  onClose,
  onDelete,
  onSave,
  portfolioDraft,
}: ProfessionalDashboardPortfolioEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const updateDraft = (changes: Partial<PortfolioDraft>) => onChangeDraft({ ...portfolioDraft, ...changes });

  return (
    <DashboardDialog
      badges={
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
            portfolioDraft.visibility === 'public' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {portfolioDraft.visibility === 'public'
            ? t('portfolio.visibility.public')
            : t('portfolio.visibility.private')}
        </span>
      }
      closeLabel={t('portfolio.closeButton')}
      description={portfolioDraft.summary}
      eyebrow={t('portfolio.editorTitle')}
      onClose={onClose}
      title={portfolioDraft.title || t('portfolio.editorTitle')}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-[14px] font-bold text-white"
          >
            <Save className="h-4 w-4" />
            {t('portfolio.saveButton')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-[14px] font-bold text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            {t('portfolio.deleteButton')}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4">
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <LabeledField label={t('portfolio.fields.title')}>
              <input
                type="text"
                value={portfolioDraft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                className={dashboardInputClass}
              />
            </LabeledField>
            <div className="mt-4 grid gap-3">
              <LabeledField label={t('portfolio.fields.period')}>
                <input
                  type="text"
                  value={portfolioDraft.periodLabel}
                  onChange={(event) => updateDraft({ periodLabel: event.target.value })}
                  className={dashboardInputClass}
                />
              </LabeledField>
              <LabeledField label={t('portfolio.fields.service')}>
                <StandardSearchableSelect
                  accent="blue"
                  emptyStateLabel={t('portfolio.noServiceOption')}
                  options={[
                    {
                      label: t('portfolio.noServiceOption'),
                      value: '',
                    },
                    ...activeServiceConfigurations.map((service) => ({
                      label: getServiceLabel(service.serviceId),
                      value: service.serviceId,
                    })),
                  ]}
                  placeholder={t('portfolio.noServiceOption')}
                  searchPlaceholder={t('portfolio.fields.service')}
                  surface="muted"
                  value={portfolioDraft.serviceId}
                  onValueChange={(nextValue) => updateDraft({ serviceId: nextValue })}
                />
              </LabeledField>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <LabeledField label={t('portfolio.fields.image')}>
              <input
                type="text"
                value={portfolioDraft.image}
                onChange={(event) => updateDraft({ image: event.target.value })}
                className={dashboardInputClass}
              />
            </LabeledField>
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-semibold text-slate-500">{t('portfolio.fields.visibility')}</p>
              <div className="grid grid-cols-2 gap-2 rounded-full bg-white p-1">
                <SegmentButton
                  isActive={portfolioDraft.visibility === 'public'}
                  label={t('portfolio.visibility.public')}
                  onClick={() => updateDraft({ visibility: 'public' })}
                />
                <SegmentButton
                  isActive={portfolioDraft.visibility === 'private'}
                  label={t('portfolio.visibility.private')}
                  onClick={() => updateDraft({ visibility: 'private' })}
                />
              </div>
            </div>
          </div>
        </div>

        <LabeledField label={t('portfolio.fields.summary')}>
          <textarea
            value={portfolioDraft.summary}
            onChange={(event) => updateDraft({ summary: event.target.value })}
            className={dashboardTextareaClass}
          />
        </LabeledField>
        <LabeledField label={t('portfolio.fields.outcomes')}>
          <textarea
            value={portfolioDraft.outcomesText}
            onChange={(event) => updateDraft({ outcomesText: event.target.value })}
            className={dashboardTextareaTallClass}
          />
        </LabeledField>
      </div>
    </DashboardDialog>
  );
};
