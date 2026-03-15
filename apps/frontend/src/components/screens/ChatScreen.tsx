'use client';

import {
  CheckCheck,
  ChevronLeft,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Plus,
  Send,
  Smile,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import {
  getChatThreadByProfessionalSlug,
  MOCK_PROFESSIONALS,
  SIMULATION_CHAT_THREADS,
  SIMULATION_SHARED,
} from '@/lib/constants';
import { professionalRoute } from '@/lib/routes';
import type { ChatMessage } from '@/types/chat';

export const ChatScreen = ({ professionalId }: { professionalId: string }) => {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback to first professional if ID not found for demo purposes
  const professional = MOCK_PROFESSIONALS.find((p) => p.slug === professionalId) || MOCK_PROFESSIONALS[0];
  const chatThread = getChatThreadByProfessionalSlug(professional.slug) || SIMULATION_CHAT_THREADS[0];
  const [messages, setMessages] = useState(chatThread.messages);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate reply
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: Date.now() + 1,
        text: chatThread.autoReplyText || '',
        sender: 'professional',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      };

      setMessages((prev) => [...prev, replyMessage]);
    }, 1500);
  };

  return (
    <div
      className="flex flex-col h-full absolute inset-0 z-50 overflow-hidden"
      style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
    >
      {/* Header */}
      <div className="bg-white flex items-center justify-between px-4 pt-14 pb-4 shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-1 -ml-2">
          <IconButton icon={<ChevronLeft className="w-6 h-6 text-gray-800" />} onClick={() => router.back()} />
          <div
            className="flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-gray-50 transition-colors ml-1"
            onClick={() => router.push(professionalRoute(professional.slug))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(professionalRoute(professional.slug));
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                <Image src={professional.image} alt={professional.name} fill className="object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-[2px] border-white"></div>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-2">
              <h2 className="text-[16px] font-bold text-gray-900 leading-tight truncate">{professional.name}</h2>
              <span className="text-[12px] text-green-500 font-medium leading-none mt-1">
                {SIMULATION_SHARED.onlineStatusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 -mr-2">
          <IconButton icon={<Video className="w-5 h-5 text-gray-600" />} />
          <IconButton icon={<Phone className="w-5 h-5 text-gray-600" />} />
          <IconButton icon={<MoreVertical className="w-5 h-5 text-gray-600" />} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto w-full pb-4 pt-6 px-4 space-y-4" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="text-center mb-6">
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-wider">
            {chatThread.dayLabel}
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-[20px] relative shadow-sm ${
                  isUser
                    ? 'rounded-br-[4px] text-white'
                    : 'bg-white rounded-bl-[4px] text-gray-800 border border-gray-100'
                }`}
                style={
                  isUser
                    ? {
                        background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.primaryDark} 100%)`,
                      }
                    : {}
                }
              >
                <p className="text-[15px] leading-relaxed mb-1 pr-6">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-80">
                  <span className={`text-[10px] ${isUser ? 'text-pink-100' : 'text-gray-400'}`}>{msg.time}</span>
                  {isUser && <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-blue-300' : 'text-pink-200'}`} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 py-3 pb-6 sm:pb-8 border-t border-gray-100 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSendMessage} className="flex gap-2.5 items-end">
          <button
            type="button"
            className="w-11 h-11 rounded-full flex-shrink-0 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors border border-gray-100"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-gray-50 rounded-[24px] border border-gray-100 flex items-end px-3 py-1.5 focus-within:bg-white focus-within:border-pink-200 focus-within:ring-2 focus-within:ring-pink-500/10 transition-all">
            <button type="button" className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={chatThread.inputPlaceholder}
              className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-[15px] py-2 px-1 text-gray-800 placeholder:text-gray-400 leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            {!inputText && (
              <button type="button" className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            style={{ backgroundColor: APP_CONFIG.colors.primary }}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
