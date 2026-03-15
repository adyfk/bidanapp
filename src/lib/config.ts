import { Stethoscope, Heart, Brain, Baby } from 'lucide-react';

export const APP_CONFIG = {
  // --- Global Branding ---
  appName: "BidanCare",
  seoDescription: "Temukan profesional independen terpercaya untuk kebutuhan Anda.",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://bidanapp.com",
  ogImage: "/icon-512x512.png", // Default OG Image for Social Media

  // --- Nomenclature / White Label Config ---
  terms: {
    professional: "Bidan", // Could be "Terapis", "Pakar", "Pekerja Independen", etc.
    category: "Kategori", // Could be "Kategori", "Spesialisasi"
    service: "Layanan", // Could be "Tindakan", "Produk Jasa"
    location: "Klinik / Praktik Mandiri", // Could be "Cabang", "Area"
    experience: "Tahun Berpraktik",
    patients: "Pasien Dilayani", // Could be "Klien Dilayani"
  },

  // --- Dynamic Categories / Specialties ---
  // You can easily swap these out for different business types
  categories: [
    { id: 'umum', label: 'Umum', icon: Stethoscope },
    { id: 'kandungan', label: 'Kandungan', icon: Heart },
    { id: 'anak', label: 'Anak', icon: Baby },
    { id: 'konsultasi', label: 'Konsultasi', icon: Brain },
  ],

  // --- Theme Colors ---
  colors: {
    primary: '#E91E8C',
    primaryDark: '#C2177A',
    primaryLight: '#FCE4F2',
    secondary: '#7C3AED',
    accent: '#F97316',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    darkNav: '#1E1E1E',
    textMain: '#111827',
    textMuted: '#6B7280',
    bgLight: '#F9FAFB',
  }
};
