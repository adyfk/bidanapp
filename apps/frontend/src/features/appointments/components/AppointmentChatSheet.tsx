'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, Navigation } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { SIMULATION_SHARED } from '@/lib/constants';
import type { Appointment } from '@/types/appointments';
import type { AppointmentChatSession } from '@/features/appointments/hooks/useAppointmentFlow';

interface AppointmentChatSheetProps {
  appointment: Appointment;
  chatInput: string;
  chatSession: AppointmentChatSession;
  onChangeChatInput: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export const AppointmentChatSheet = ({
  appointment,
  chatInput,
  chatSession,
  onChangeChatInput,
  onClose,
  onSend,
}: AppointmentChatSheetProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession.messages.length]);

  return (
    <div className="fixed inset-y-0 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col bg-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="sticky top-0 z-10 flex items-center border-b border-gray-100 bg-white p-4 shadow-sm">
        <button onClick={onClose} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
            <Image src={appointment.professional.image} alt={appointment.professional.name} fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-gray-900">{appointment.professional.name}</h2>
            <p className="mt-0.5 text-[11px] font-bold text-green-500">{SIMULATION_SHARED.onlineStatusLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-slate-50 p-4">
        <div className="self-center rounded-full bg-gray-200/60 px-3 py-1 text-[11px] font-bold tracking-wider text-gray-500">
          {chatSession.dayLabel}
        </div>

        {chatSession.messages.map((message) => {
          const isUser = message.sender === 'user';

          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? 'rounded-br-sm text-white'
                    : 'rounded-bl-sm border border-gray-100 bg-white text-gray-800'
                }`}
                style={
                  isUser
                    ? {
                        background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.primaryDark} 100%)`,
                      }
                    : undefined
                }
              >
                <p className="text-[14px] leading-relaxed">{message.text}</p>
                <span className={`mt-1 block text-[10px] ${isUser ? 'text-pink-100' : 'text-gray-400'}`}>
                  {message.time}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 flex items-end gap-3 border-t border-gray-100 bg-white p-4">
        <textarea
          placeholder={chatSession.inputPlaceholder}
          value={chatInput}
          onChange={(event) => onChangeChatInput(event.target.value)}
          className="min-h-[46px] max-h-[100px] flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-3 pb-2 text-[14px] text-gray-800 outline-none placeholder:text-gray-400"
          rows={1}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!chatInput.trim()}
          className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: APP_CONFIG.colors.primary }}
        >
          <Navigation className="ml-1 h-5 w-5 -mt-0.5 pt-0.5" />
        </button>
      </div>
    </div>
  );
};
