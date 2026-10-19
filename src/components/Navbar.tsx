import React from 'react';
import {
  Terminal,
  Settings,
  Radio,
  Cpu,
  BookOpen,
  Usb,
  Sparkles
} from 'lucide-react';
import { BlueSMiRFMode } from '../types/bluesmirf';

export type ActiveTab = 'terminal' | 'configurator' | 'bridge' | 'hardware' | 'docs' | 'real_device';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mode: BlueSMiRFMode;
  connectLed: boolean;
  statusLed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  mode,
  connectLed,
  statusLed
}) => {
  const TABS: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'terminal', label: 'Terminal & Console', icon: Terminal },
    { id: 'configurator', label: 'Device Configurator', icon: Settings },
    { id: 'bridge', label: 'Wireless Dual-Bridge', icon: Radio },
    { id: 'hardware', label: '3D CAD & Pinouts', icon: Cpu },
    { id: 'docs', label: 'Hookup Guide & Docs', icon: BookOpen },
    { id: 'real_device', label: 'Connect Real Device', icon: Usb }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30">
              <span className="text-white font-mono font-black text-sm tracking-wider">
                SF
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  SparkFun BlueSMiRF v2
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-semibold">
                  ESP32
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Wireless Bluetooth® Serial Link Companion & Emulator
              </p>
            </div>
          </div>

          {/* Quick Hardware Indicator in Header */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                  connectLed
                    ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                    : 'bg-blue-950 border border-blue-900'
                }`}
              />
              <span className="text-[10px] font-mono text-slate-400">CONNECT</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                  statusLed
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    : 'bg-emerald-950 border border-emerald-900'
                }`}
              />
              <span className="text-[10px] font-mono text-slate-400">STATUS</span>
            </div>

            <span className="text-slate-700">|</span>

            <span
              className={`font-mono text-[10px] font-bold ${
                mode === 'COMMAND'
                  ? 'text-amber-400'
                  : mode === 'PAIRING'
                  ? 'text-sky-400'
                  : 'text-emerald-400'
              }`}
            >
              {mode} MODE
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    active
                      ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
