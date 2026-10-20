import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'terracotta' }) {
  const colorStyles = {
    terracotta: {
      iconBg: 'bg-[#FDF7F4] text-[#A44D2D] border-[#F2D3C4]',
      border: 'border-[#E6E0D5]',
    },
    indigo: {
      iconBg: 'bg-[#FDF7F4] text-[#A44D2D] border-[#F2D3C4]',
      border: 'border-[#E6E0D5]',
    },
    emerald: {
      iconBg: 'bg-[#F5F7F4] text-[#577254] border-[#CCD7C9]',
      border: 'border-[#E6E0D5]',
    },
    sage: {
      iconBg: 'bg-[#F5F7F4] text-[#577254] border-[#CCD7C9]',
      border: 'border-[#E6E0D5]',
    },
    amber: {
      iconBg: 'bg-[#FDF9EF] text-[#B8781B] border-[#F5DEB0]',
      border: 'border-[#E6E0D5]',
    },
    purple: {
      iconBg: 'bg-[#F4EFE6] text-[#835E37] border-[#DCD0BD]',
      border: 'border-[#E6E0D5]',
    },
    stone: {
      iconBg: 'bg-[#F4EFE6] text-[#835E37] border-[#DCD0BD]',
      border: 'border-[#E6E0D5]',
    },
  };

  const style = colorStyles[color] || colorStyles.terracotta;

  return (
    <div className="bg-white rounded-xl p-6 border border-[#E6E0D5] shadow-xs hover:border-[#C7B59D] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-3xl font-serif text-stone-900 mt-2 font-bold">{value ?? '0'}</h4>
          {subtitle && <p className="text-xs text-stone-500 mt-1.5 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${style.iconBg} border shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
