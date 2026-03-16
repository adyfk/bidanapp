'use client';

export const ProfessionalPageSkeleton = () => (
  <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-10 custom-scrollbar">
    <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-4 pb-4 pt-14 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-full bg-gray-100" />
        <div className="h-4 w-36 rounded-full bg-gray-100" />
        <div className="h-10 w-10 rounded-full bg-gray-100" />
      </div>
    </div>

    <div className="space-y-5 px-5 py-6">
      <div className="h-36 rounded-[28px] bg-white shadow-sm" />
      <div className="h-40 rounded-[28px] bg-white shadow-sm" />
      <div className="h-72 rounded-[28px] bg-white shadow-sm" />
      <div className="h-56 rounded-[28px] bg-white shadow-sm" />
    </div>
  </div>
);
