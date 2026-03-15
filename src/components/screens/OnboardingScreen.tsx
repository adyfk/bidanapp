import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COLORS } from '@/lib/constants';

export const OnboardingScreen = () => (
  <div className="flex flex-col h-full text-white relative overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
    {/* Dekorasi Background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[10%] -left-[20%] w-[140%] h-[40%] bg-white/10 rounded-[100%] rotate-[-10deg]"></div>
      <div className="absolute top-[40%] -left-[20%] w-[140%] h-[40%] bg-white/10 rounded-[100%] rotate-[10deg]"></div>
    </div>

    <div className="flex-1 flex flex-col items-center justify-start pt-24 px-8 z-10 text-center relative">
      <h1 className="text-[32px] font-bold leading-[1.2] mb-4 drop-shadow-sm">
        Easy Consultation With A<br />Doctor In Your Pocket
      </h1>
      <p className="text-white/80 text-[15px] mb-10 font-medium">
        Say yes to your good health!
      </p>
      <Link
        href="/home"
        className="flex items-center gap-2 bg-black/20 hover:bg-black/30 transition-colors backdrop-blur-md px-8 py-4 rounded-full text-white font-semibold border border-white/10 active:scale-95"
      >
        Get Started <ArrowRight className="w-5 h-5 ml-1" />
      </Link>
    </div>

    <div className="relative h-[55%] flex justify-center items-end z-10">
      <img
        src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1000&auto=format&fit=crop"
        alt="Doctor"
        className="h-full object-cover object-top drop-shadow-2xl"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)'
        }}
      />
    </div>
  </div>
);
