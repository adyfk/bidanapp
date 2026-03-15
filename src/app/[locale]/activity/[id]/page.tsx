'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, MessageCircle, Navigation, Star, Camera } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import {
  SIMULATION_MESSAGES,
  SIMULATION_SHARED,
  fillSimulationTemplate,
  getAppointmentById,
  getAppointmentChatThread,
} from '@/lib/constants';
import type { AppointmentStatus } from '@/types/appointments';

const getStatusBannerClasses = (status: AppointmentStatus) => {
  if (status === 'requested') return 'bg-orange-50 border-orange-100 text-orange-800';
  if (status === 'paid' || status === 'confirmed' || status === 'in_service') return 'bg-green-50 border-green-100 text-green-800';
  if (status === 'cancelled' || status === 'expired') return 'bg-gray-100 border-gray-200 text-gray-700';
  if (status === 'rejected') return 'bg-red-50 border-red-100 text-red-700';
  return 'bg-gray-100 border-gray-200 text-gray-700';
};

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tStatus = useTranslations('Appointments.status');

  const appointmentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const appointment = appointmentId ? getAppointmentById(appointmentId) : undefined;
  const appointmentThread = appointmentId ? getAppointmentChatThread(appointmentId) : undefined;

  // State local to this detail page
  const [currentStatus, setCurrentStatus] = useState(appointment?.status || 'requested');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const currentStatusBanner = SIMULATION_MESSAGES.appointmentStatusBanners[currentStatus];

  if (!appointment) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center relative overflow-hidden">
        <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100 absolute top-0 w-full z-10 max-w-md mx-auto">
          <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{SIMULATION_MESSAGES.appointmentDetailTitle}</h2>
        </div>
        <p className="text-gray-500 mt-20">{SIMULATION_MESSAGES.appointmentNotFoundMessage}</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-gray-200 rounded-full font-medium">{SIMULATION_MESSAGES.appointmentBackLabel}</button>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="flex flex-col h-full bg-gray-50 relative overflow-hidden">
      {/* Activity Detail View */}
      <div className="flex flex-col h-full absolute inset-0 z-10 w-full max-w-md mx-auto bg-gray-50 animate-in fade-in duration-300">
        <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{SIMULATION_MESSAGES.appointmentDetailTitle}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-24">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <Image src={appointment.professional.image} alt={appointment.professional.name} fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-gray-900">{appointment.professional.name}</h3>
                <p className="text-[12px] text-green-500 font-bold">{SIMULATION_SHARED.onlineStatusLabel}</p>
              </div>
            </div>
            {currentStatus !== 'completed' && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-gray-50 active:scale-95 text-gray-600 border border-gray-200"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{SIMULATION_MESSAGES.appointmentFieldLabels.status}</p>
                <span className={`px-2.5 py-1 rounded-[8px] text-[12px] font-bold uppercase tracking-wider ${currentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                  currentStatus === 'requested' ? 'bg-orange-100 text-orange-700' :
                    currentStatus === 'approved_waiting_payment' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                  {tStatus(currentStatus)}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{SIMULATION_MESSAGES.appointmentFieldLabels.time}</p>
                <p className="font-semibold text-[14px] text-gray-900">{appointment.time}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{SIMULATION_MESSAGES.appointmentFieldLabels.location}</p>
                <p className="font-semibold text-[14px] text-gray-900">{appointment.professional.location}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{SIMULATION_MESSAGES.appointmentFieldLabels.service}</p>
                <p className="font-semibold text-[14px] text-gray-900">{appointment.service.name}</p>
                <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{appointment.service.description}</p>
              </div>
              <div className="pt-4 mt-2 border-t border-gray-50 flex justify-between items-center">
                <p className="text-[13px] font-bold text-gray-500">{SIMULATION_MESSAGES.appointmentFieldLabels.totalPayment}</p>
                <p className="text-[16px] font-bold text-pink-600 text-right">{appointment.totalPrice}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-20">
          {currentStatus === 'approved_waiting_payment' && (
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 transition-colors font-bold text-gray-700 rounded-xl text-[14px]"
              >
                {SIMULATION_MESSAGES.appointmentActionLabels.cancel}
              </button>
              <button
                onClick={() => {
                  alert(SIMULATION_MESSAGES.paymentSuccessAlert);
                  setCurrentStatus('paid');
                }}
                className="flex-1 py-3.5 text-white transition-transform active:scale-95 font-bold rounded-xl text-[14px] shadow-md shadow-pink-500/20"
                style={{ backgroundColor: APP_CONFIG.colors.primary }}
              >
                {SIMULATION_MESSAGES.appointmentActionLabels.payNow}
              </button>
            </div>
          )}

          {currentStatus === 'completed' && (
            <button
              onClick={() => setIsReviewOpen(true)}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 transition-colors font-bold text-gray-700 rounded-xl text-[14px]"
            >
              {SIMULATION_MESSAGES.review.title}
            </button>
          )}

          {currentStatus !== 'approved_waiting_payment' &&
            currentStatus !== 'completed' &&
            currentStatusBanner && (
              <div className={`p-4 rounded-xl border ${getStatusBannerClasses(currentStatus)}`}>
                <p className="text-[13px] font-medium leading-relaxed">{currentStatusBanner}</p>
              </div>
            )}
        </div>
      </div>

      {/* Chat Sub-Modal Overlay */}
      {isChatOpen && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70] flex flex-col bg-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <button onClick={() => setIsChatOpen(false)} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <Image src={appointment.professional.image} alt={appointment.professional.name} fill className="object-cover" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold leading-tight text-gray-900">{appointment.professional.name}</h2>
                <p className="text-[11px] text-green-500 font-bold mt-0.5">{SIMULATION_SHARED.onlineStatusLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
            <div className="self-center bg-gray-200/60 text-gray-500 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider mb-2">
              {appointmentThread?.dayLabel || SIMULATION_MESSAGES.appointmentChatDayLabel}
            </div>

            {(appointmentThread?.messages.length
              ? appointmentThread.messages
              : [
                  {
                    id: 0,
                    text: fillSimulationTemplate(SIMULATION_MESSAGES.appointmentWelcomeTemplate, {
                      serviceName: appointment.service.name,
                    }),
                    sender: 'professional',
                    time: '10:41',
                    isRead: true,
                  },
                ]
            ).map((message) => {
              const isUser = message.sender === 'user';

              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                      isUser
                        ? 'text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                    }`}
                    style={
                      isUser
                        ? { background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.primaryDark} 100%)` }
                        : undefined
                    }
                  >
                    <p className="text-[14px] leading-relaxed">{message.text}</p>
                    <span className={`block mt-1 text-[10px] ${isUser ? 'text-pink-100' : 'text-gray-400'}`}>
                      {message.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex items-end gap-3 sticky bottom-0">
            <textarea
              placeholder={appointmentThread?.inputPlaceholder || SIMULATION_MESSAGES.appointmentChatInputPlaceholder}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 outline-none text-[14px] min-h-[46px] max-h-[100px] resize-none pb-2 text-gray-800 placeholder:text-gray-400"
              rows={1}
            />
            <button
              className="w-[46px] h-[46px] text-white rounded-full flex items-center justify-center shadow-md flex-shrink-0 transition-transform active:scale-95"
              style={{ backgroundColor: APP_CONFIG.colors.primary }}
              onClick={() => {
                if (chatInput.trim()) {
                  alert(SIMULATION_MESSAGES.chatSentAlert);
                  setChatInput('');
                }
              }}
            >
              <Navigation className="w-5 h-5 ml-1 pt-0.5 -mt-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Review Sub-Modal Overlay */}
      {isReviewOpen && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70] flex flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button onClick={() => setIsReviewOpen(false)} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h2 className="text-[17px] font-bold text-gray-900">{SIMULATION_MESSAGES.review.title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <div className="flex flex-col items-center mt-4 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden relative mb-4 shadow-sm border border-gray-100">
                <Image src={appointment.professional.image} alt={appointment.professional.name} fill className="object-cover" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-1 text-center leading-snug">
                {fillSimulationTemplate(SIMULATION_MESSAGES.review.titleTemplate, { professionalName: appointment.professional.name })}
              </h3>
              <p className="text-[13px] text-gray-500 text-center px-4 mt-1">{SIMULATION_MESSAGES.review.helperText}</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-95"
                >
                  <Star className={`w-10 h-10 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-[13px] font-bold text-gray-700 mb-2">{SIMULATION_MESSAGES.review.photoLabel}</label>
              <button
                onClick={() => alert(SIMULATION_MESSAGES.review.uploadAlert)}
                className="w-[100px] h-[100px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-6 h-6 mb-2" />
                <span className="text-[11px] font-medium">{SIMULATION_MESSAGES.review.photoButtonLabel}</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-[13px] font-bold text-gray-700 mb-2">{SIMULATION_MESSAGES.review.reviewLabel}</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={SIMULATION_MESSAGES.review.reviewPlaceholder}
                className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[14px] text-gray-800 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 resize-none transition-all"
              />
            </div>
          </div>

          <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <button
              disabled={rating === 0}
              onClick={() => {
                alert(SIMULATION_MESSAGES.review.successAlert);
                setIsReviewOpen(false);
              }}
              className={`w-full py-4 rounded-[16px] font-bold text-[15px] transition-all ${rating > 0 ? 'text-white shadow-[0_8px_20px_rgba(123,97,255,0.3)] active:scale-[0.98]' : 'bg-gray-100 text-gray-400'}`}
              style={{ backgroundColor: rating > 0 ? APP_CONFIG.colors.primary : undefined }}
            >
              {SIMULATION_MESSAGES.review.submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
