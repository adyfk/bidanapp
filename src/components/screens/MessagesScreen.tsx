'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Edit, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS } from '@/lib/constants';

// Create some mock conversations based on professionals
const MOCK_CONVERSATIONS = [
  {
    id: 'chat1',
    professional: MOCK_PROFESSIONALS[0],
    lastMessage: 'Halo, jadwal pijat bayi besok jam 10 pagi masih bisa?',
    time: '10:42 AM',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'chat2',
    professional: MOCK_PROFESSIONALS[1],
    lastMessage: 'Baik ibu, saya akan datang sesuai jadwal yang sudah disepakati.',
    time: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    isRead: true,
  },
  {
    id: 'chat3',
    professional: MOCK_PROFESSIONALS[2],
    lastMessage: 'Tentu, untuk sesi bekham full body memakan waktu sekitar 90 menit.',
    time: 'Monday',
    unreadCount: 0,
    isOnline: false,
    isRead: false,
  }
];

export const MessagesScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslations('Messages');

  const filteredConversations = MOCK_CONVERSATIONS.filter(chat => 
    chat.professional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      
      {/* Header Sticky */}
      <div className="px-5 pt-14 pb-4 sticky top-0 z-20" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight ml-1">{t('title')}</h1>
          <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all outline-none border border-gray-100">
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl flex items-center px-4 py-2.5 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="bg-transparent border-none outline-none text-[15px] w-full text-gray-700 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Horizontal Scroll - Optional for future expansion */}
      <div className="flex gap-2 px-6 mb-4 mt-2">
         <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-gray-900 text-white shadow-md">{t('all')}</button>
         <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50">{t('unread')}</button>
         <button className="px-4 py-1.5 rounded-full text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50">{t('archived')}</button>
      </div>

      <div className="px-5">
        {filteredConversations.length > 0 ? (
          <div className="bg-white rounded-[24px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden mb-6">
            {filteredConversations.map((chat, idx) => (
              <div 
                key={chat.id} 
                onClick={() => router.push(`/messages/${chat.id}`)}
                className={`flex items-center gap-3.5 p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100 ${idx !== filteredConversations.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                    <img src={chat.professional.image} alt={chat.professional.name} className="w-full h-full object-cover" />
                  </div>
                  {chat.isOnline && (
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-white"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-[16px] text-gray-900 truncate pr-2">{chat.professional.name}</h3>
                    <span className={`text-[12px] font-medium whitespace-nowrap ${chat.unreadCount > 0 ? 'text-pink-600' : 'text-gray-400'}`}>
                      {chat.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[14px] truncate flex-1 ${chat.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {chat.unreadCount === 0 && (
                         <span className="inline-block mr-1">
                           {chat.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" /> : <Check className="w-3.5 h-3.5 text-gray-400 inline" />}
                         </span>
                      )}
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm" style={{ backgroundColor: APP_CONFIG.colors.primary }}>
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-300">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-1">{t('noMessages')}</p>
            <p className="text-sm text-gray-500">{t('trySearching')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
