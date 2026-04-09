'use client';

import type { SupportTicket } from '@marketplace/marketplace-core';
import {
  EmptyState,
  EntityCard,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
  TextAreaField,
  TextField,
  TimelineBlock,
} from '@marketplace/ui';
import type { Dispatch, SetStateAction } from 'react';

export function SupportSection({
  busy,
  onTriage,
  setSupportForms,
  supportForms,
  tickets,
}: {
  busy: boolean;
  onTriage: (ticketId: string) => Promise<void>;
  setSupportForms: Dispatch<
    SetStateAction<
      Record<string, { assignToAdminId: string; internalNote: string; publicNote: string; status: string }>
    >
  >;
  supportForms: Record<string, { assignToAdminId: string; internalNote: string; publicNote: string; status: string }>;
  tickets: SupportTicket[];
}) {
  return (
    <SurfaceCard title="Support desk" description="Tinjau tiket, catatan penanganan, dan status penyelesaian customer.">
      {tickets.length ? (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const form = supportForms[ticket.id] || {
              assignToAdminId: ticket.assignedAdminId || '',
              internalNote: '',
              publicNote: '',
              status: ticket.status,
            };

            return (
              <EntityCard
                key={ticket.id}
                badge={<StatusPill tone="neutral">{ticket.id}</StatusPill>}
                description={ticket.details}
                subtitle={`${ticket.status} • ${ticket.priority} • Reporter ${ticket.reporterUserId}`}
                title={ticket.subject}
              >
                <p className="text-xs" style={{ color: 'var(--ui-text-subtle)' }}>
                  Order: {ticket.orderId || '-'} • Thread: {ticket.chatThreadId || '-'}
                </p>
                {(ticket.events ?? []).length ? (
                  <div className="mt-4">
                    <TimelineBlock
                      items={(ticket.events ?? []).map((event) => ({
                        body: event.publicNote || event.internalNote || undefined,
                        id: event.id,
                        meta: `${event.actorKind} • ${event.createdAt}`,
                        title: event.eventType,
                      }))}
                    />
                  </div>
                ) : null}
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <TextField
                    label="PIC admin"
                    value={form.assignToAdminId}
                    onChange={(event) =>
                      setSupportForms((current) => ({
                        ...current,
                        [ticket.id]: {
                          ...form,
                          assignToAdminId: event.target.value,
                        },
                      }))
                    }
                  />
                  <TextField
                    label="Status"
                    helperText="new, triaged, reviewing, resolved, refunded"
                    value={form.status}
                    onChange={(event) =>
                      setSupportForms((current) => ({
                        ...current,
                        [ticket.id]: {
                          ...form,
                          status: event.target.value,
                        },
                      }))
                    }
                  />
                  <TextAreaField
                    label="Catatan ke customer"
                    value={form.publicNote}
                    onChange={(event) =>
                      setSupportForms((current) => ({
                        ...current,
                        [ticket.id]: {
                          ...form,
                          publicNote: event.target.value,
                        },
                      }))
                    }
                  />
                  <TextAreaField
                    label="Catatan internal"
                    value={form.internalNote}
                    onChange={(event) =>
                      setSupportForms((current) => ({
                        ...current,
                        [ticket.id]: {
                          ...form,
                          internalNote: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="mt-5">
                  <PrimaryButton disabled={busy} onClick={() => void onTriage(ticket.id)} type="button">
                    {busy ? 'Menyimpan...' : 'Simpan triage'}
                  </PrimaryButton>
                </div>
              </EntityCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum ada ticket support"
          description="Tiket customer akan muncul di sini setelah mereka menghubungi support."
        />
      )}
    </SurfaceCard>
  );
}
