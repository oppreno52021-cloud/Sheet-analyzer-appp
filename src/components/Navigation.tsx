import React from 'react';
import { Home, BarChart3, MoreHorizontal } from 'lucide-react';
import { Language, NavTab } from '../types';
import { getTranslation } from '../utils/translations';

export type { NavTab };

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: Language;
  hasFile: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  lang,
  hasFile
}) => {
  const t = getTranslation(lang);

  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: boolean }> = [
    {
      id: 'home',
      label: t.home || 'Home',
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'analyze',
      label: t.analyze || 'Analyze',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: hasFile
    },
    {
      id: 'more',
      label: t.more || 'More',
      icon: <MoreHorizontal className="w-5 h-5" />
    }
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D9E1E8] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const isDisabled = tab.id === 'analyze' && !hasFile;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              title={isDisabled ? (lang === 'ar' ? 'يرجى رفع شيت بيانات أولاً لتفعيل التحليل' : 'Please upload a sheet first to enable analysis') : tab.label}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all relative ${
                isDisabled
                  ? 'opacity-35 cursor-not-allowed text-slate-400 select-none'
                  : isActive
                  ? 'text-[#0A3D62] font-black cursor-pointer'
                  : 'text-slate-400 hover:text-slate-600 font-semibold cursor-pointer'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    !isDisabled && isActive ? 'bg-sky-50 text-[#0A3D62] scale-110' : ''
                  }`}
                >
                  {tab.icon}
                </div>
                {!isDisabled && tab.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-600 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[11px] mt-0.5 leading-none tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
