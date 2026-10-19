import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Send,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Radio,
  CornerDownLeft,
  Settings2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { blueSmiRFInstance } from '../core/blueSmiRFEngine';
import { TerminalLine, SUPPORTED_BAUD_RATES } from '../types/bluesmirf';

interface TerminalViewProps {
  onQuickConfigure?: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ onQuickConfigure }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'SparkFun BlueSMiRF v2 Terminal Ready.\r\nType $$$ or click "$$$" button to enter AT Command Mode.\r\n'
    }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lineEnding, setLineEnding] = useState<'\r\n' | '\r' | '\n' | ''>('\r\n');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showHex, setShowHex] = useState(false);

  // Engine state mirror
  const [mode, setMode] = useState(blueSmiRFInstance.getMode());
  const [connectLed, setConnectLed] = useState(blueSmiRFInstance.connectLed);
  const [statusLed, setStatusLed] = useState(blueSmiRFInstance.statusLed);
  const [settings, setSettings] = useState(blueSmiRFInstance.getSettings());
  const [isConnected, setIsConnected] = useState(blueSmiRFInstance.getIsConnected());

  // Button hold state
  const [buttonPressed, setButtonPressed] = useState(false);
  const [buttonHoldSeconds, setButtonHoldSeconds] = useState(0);
  const buttonTimerRef = useRef<any>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Subscribe to engine events
    const unsubscribe = blueSmiRFInstance.subscribe(() => {
      setMode(blueSmiRFInstance.getMode());
      setConnectLed(blueSmiRFInstance.connectLed);
      setStatusLed(blueSmiRFInstance.statusLed);
      setSettings(blueSmiRFInstance.getSettings());
      setIsConnected(blueSmiRFInstance.getIsConnected());
    });

    blueSmiRFInstance.setOutputCallback((text, type) => {
      setLines(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          type,
          text
        }
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : input;
    if (!text && textToSend === undefined) return;

    // Log to terminal
    setLines(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'tx',
        text: text + (lineEnding === '\r\n' ? '\\r\\n' : lineEnding === '\r' ? '\\r' : lineEnding === '\n' ? '\\n' : '')
      }
    ]);

    if (textToSend === undefined) {
      setHistory(prev => [text, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);
      setInput('');
    }

    // Process through BlueSMiRF engine
    blueSmiRFInstance.processInput(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleClear = () => {
    setLines([]);
  };

  const handleExport = () => {
    const raw = lines.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    const blob = new Blob([raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bluesmirf_terminal_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Button press & hold handler
  const startButtonPress = () => {
    setButtonPressed(true);
    setButtonHoldSeconds(0);
    const startTime = Date.now();

    buttonTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setButtonHoldSeconds(elapsed);
    }, 200);
  };

  const endButtonPress = () => {
    if (!buttonPressed) return;
    setButtonPressed(false);
    if (buttonTimerRef.current) clearInterval(buttonTimerRef.current);

    if (buttonHoldSeconds >= 8) {
      blueSmiRFInstance.handleButtonLongPress8s();
    } else if (buttonHoldSeconds >= 3) {
      blueSmiRFInstance.handleButtonLongPress3s();
    } else {
      blueSmiRFInstance.handleButtonShortPress();
    }
    setButtonHoldSeconds(0);
  };

  const toHex = (str: string) => {
    return Array.from(str)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Interactive Hardware Emulation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* BlueSMiRF PCB Mockup Widget */}
          <div className="flex items-center gap-6">
            <div className="relative bg-red-950/80 border-2 border-red-700/80 rounded-xl p-4 shadow-xl shadow-red-950/40 flex items-center gap-6">
              {/* SparkFun Silk & Board Branding */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] tracking-widest text-red-300 font-mono font-bold uppercase">
                  SparkFun
                </span>
                <span className="text-xs font-bold text-white tracking-wider font-mono">
                  BlueSMiRF v2
                </span>
                <span className="text-[9px] text-red-400 font-mono mt-0.5">ESP32-PICO</span>
              </div>

              {/* LEDs */}
              <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-100 ${
                      connectLed
                        ? 'bg-blue-400 shadow-[0_0_12px_#3b82f6]'
                        : 'bg-blue-950/40 border border-blue-900/40'
                    }`}
                  />
                  <span className="text-[10px] font-mono font-semibold text-slate-300">CONNECT</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-100 ${
                      statusLed
                        ? 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                        : 'bg-emerald-950/40 border border-emerald-900/40'
                    }`}
                  />
                  <span className="text-[10px] font-mono font-semibold text-slate-300">STATUS</span>
                </div>
              </div>

              {/* Push Button */}
              <div className="flex flex-col items-center">
                <button
                  onMouseDown={startButtonPress}
                  onMouseUp={endButtonPress}
                  onMouseLeave={endButtonPress}
                  onTouchStart={startButtonPress}
                  onTouchEnd={endButtonPress}
                  className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center font-bold text-xs select-none active:scale-95 ${
                    buttonPressed
                      ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_15px_#f59e0b]'
                      : 'bg-slate-800 border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-700'
                  }`}
                  title="Click: Pair / Hold 3s: Pair Mode / Hold 8s: Reset Defaults"
                >
                  PAIR
                </button>
                <span className="text-[9px] font-mono text-slate-300 mt-1">
                  {buttonHoldSeconds > 0 ? `${buttonHoldSeconds}s` : 'BTN'}
                </span>
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current Mode:</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    mode === 'COMMAND'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : mode === 'PAIRING'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : mode === 'REBOOTING'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {mode === 'DATA' ? 'DATA PIPE MODE' : mode + ' MODE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Radio Protocol:</span>
                <span className="text-slate-200 font-mono">
                  {['Bluetooth SPP (Classic)', 'BLE (Low Energy)', 'Radio Off'][settings.btType]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Baud Rate:</span>
                <span className="text-slate-200 font-mono">{settings.baudRate} bps</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Link Status:</span>
                <span className={`font-medium ${isConnected ? 'text-blue-400' : 'text-slate-400'}`}>
                  {isConnected ? 'Paired & Linked' : 'Discoverable / Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Hardware Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSend('$$$')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                mode === 'COMMAND'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              $$$ (Command Mode)
            </button>

            <button
              onClick={() => blueSmiRFInstance.reboot()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reboot (ATZ)
            </button>

            <button
              onClick={() => blueSmiRFInstance.resetFactoryDefaults()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-red-300 hover:bg-red-950/60 border border-slate-700 hover:border-red-800 flex items-center gap-1.5 transition"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Factory Reset (ATF)
            </button>

            {onQuickConfigure && (
              <button
                onClick={onQuickConfigure}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Visual Config
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Terminal Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
        {/* Terminal Header */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono font-semibold text-slate-200">
                UART Serial Console • {settings.baudRate} 8-N-1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Baud selector */}
            <select
              value={settings.baudRate}
              onChange={e => {
                const b = parseInt(e.target.value, 10);
                blueSmiRFInstance.processInput(`AT-SerialSpeed=${b}`);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-red-500"
            >
              {SUPPORTED_BAUD_RATES.map(rate => (
                <option key={rate} value={rate}>
                  {rate} baud
                </option>
              ))}
            </select>

            {/* Line ending */}
            <select
              value={lineEnding}
              onChange={e => setLineEnding(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-red-500"
            >
              <option value="\r\n">Both NL & CR (\r\n)</option>
              <option value="\r">Carriage Return (\r)</option>
              <option value="\n">Newline (\n)</option>
              <option value="">No line ending</option>
            </select>

            <button
              onClick={() => setShowHex(!showHex)}
              className={`px-2 py-1 rounded text-xs font-mono transition ${
                showHex ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400'
              }`}
            >
              HEX
            </button>

            <button
              onClick={handleClear}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleExport}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Export Log"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Screen */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto max-h-[480px] space-y-1.5 selection:bg-red-500/30"
        >
          {lines.length === 0 ? (
            <div className="text-slate-600 italic py-10 text-center">
              Terminal console cleared. Send data or commands below.
            </div>
          ) : (
            lines.map(line => (
              <div key={line.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none shrink-0">[{line.timestamp}]</span>
                <span
                  className={`font-semibold shrink-0 select-none uppercase text-[10px] px-1 rounded ${
                    line.type === 'tx'
                      ? 'bg-sky-950 text-sky-400 border border-sky-800'
                      : line.type === 'rx'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : line.type === 'error'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {line.type}
                </span>
                <span
                  className={`whitespace-pre-wrap break-all ${
                    line.type === 'tx'
                      ? 'text-sky-300'
                      : line.type === 'rx'
                      ? 'text-emerald-300'
                      : line.type === 'error'
                      ? 'text-red-400'
                      : 'text-slate-300'
                  }`}
                >
                  {showHex ? toHex(line.text) : line.text}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Common AT Command Short-cuts Bar */}
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <span className="text-slate-500 select-none mr-1">Quick:</span>
          {['AT', 'AT?', 'ATA', 'ATB', 'ATS', 'ATY', 'ATM', 'ATV', 'ATP', 'ATW', 'ATX', 'AT-?'].map(cmd => (
            <button
              key={cmd}
              onClick={() => handleSend(cmd)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'COMMAND'
                  ? "Enter AT command (e.g., 'AT?', 'ATA', 'AT-SerialSpeed=57600', 'ATW')..."
                  : "Type text to transmit over Bluetooth, or enter '$$$' for Command Mode..."
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <span>Send</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
