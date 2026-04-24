import React from 'react';

export const SkeletonCard = () => (
  <div className="animate-pulse rounded-[2rem] border border-slate-800/70 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/10">
    <div className="h-6 w-40 rounded-full bg-slate-700" />
    <div className="mt-5 space-y-4">
      <div className="h-4 w-3/4 rounded-full bg-slate-700" />
      <div className="h-4 rounded-full bg-slate-700" />
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-24 rounded-2xl bg-slate-700" />
        <div className="h-10 w-16 rounded-2xl bg-slate-700" />
      </div>
    </div>
  </div>
);
