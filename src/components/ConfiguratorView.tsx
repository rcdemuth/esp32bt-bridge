import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bluetooth,
  Binary,
  Cpu,
  Save,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  AlertTriangle,
  Play
} from 'lucide-react';
import { blueSmiRFInstance } from '../core/blueSmiRFEngine';
import {
  BlueSMiRFSettings,
  SUPPORTED_BAUD_RATES,
  DEFAULT_SETTINGS
} from '../types/bluesmirf';

interface ConfiguratorViewProps {
  onApplied?: () => void;
}

export const ConfiguratorView: React.FC<ConfiguratorViewProps> = ({ onApplied }) => {
  const [current, setCurrent] = useState<BlueSMiRFSettings>(blueSmiRFInstance.getSettings());
  const [form, setForm] = useState<BlueSMiRFSettings>(blueSmiRFInstance.getSettings());
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = blueSmiRFInstance.subscribe(() => {
      const s = blueSmiRFInstance.getSettings();
      setCurrent(s);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = <K extends keyof BlueSMiRFSettings>(field: K, value: BlueSMiRFSettings[K]) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generate batch script of modified settings
  const generateScript = () => {
    const lines: string[] = ['$$$', 'AT'];

    if (form.btNickname !== current.btNickname) lines.push(`AT-BluetoothNickname=${form.btNickname}`);
    if (form.btType !== current.btType) lines.push(`AT-BluetoothType=${form.btType}`);
    if (form.btPairedMac !== current.btPairedMac) lines.push(`AT-BluetoothPairedMac=${form.btPairedMac}`);
    if (form.btPairedName !== current.btPairedName) lines.push(`AT-BluetoothPairedName=${form.btPairedName}`);
    if (form.btPin !== current.btPin) lines.push(`AT-BluetoothPin=${form.btPin}`);
    if (form.btConnectRetries !== current.btConnectRetries) lines.push(`AT-BluetoothConnectRetries=${form.btConnectRetries}`);
    if (form.btConnectTimeoutMs !== current.btConnectTimeoutMs) lines.push(`AT-BluetoothConnectTimeoutMs=${form.btConnectTimeoutMs}`);
    if (form.btRxSize !== current.btRxSize) lines.push(`AT-BluetoothRxSize=${form.btRxSize}`);
    if (form.btTxSize !== current.btTxSize) lines.push(`AT-BluetoothTxSize=${form.btTxSize}`);

    if (form.baudRate !== current.baudRate) lines.push(`AT-SerialSpeed=${form.baudRate}`);
    if (form.flowControl !== current.flowControl) lines.push(`AT-FlowControl=${form.flowControl ? '1' : '0'}`);
    if (form.invertCts !== current.invertCts) lines.push(`AT-InvertCts=${form.invertCts ? '1' : '0'}`);
    if (form.invertRts !== current.invertRts) lines.push(`AT-InvertRts=${form.invertRts ? '1' : '0'}`);
    if (form.serialPartialFrameTimeoutMs !== current.serialPartialFrameTimeoutMs) lines.push(`AT-PartialFrameTimeoutMs=${form.serialPartialFrameTimeoutMs}`);
    if (form.rtsStartSendingPercent !== current.rtsStartSendingPercent) lines.push(`AT-RtsStartSendingPercent=${form.rtsStartSendingPercent}`);
    if (form.rtsStopSendingPercent !== current.rtsStopSendingPercent) lines.push(`AT-RtsStopSendingPercent=${form.rtsStopSendingPercent}`);

    if (form.escapeCharacter !== current.escapeCharacter) lines.push(`AT-EscapeCharacter=${form.escapeCharacter}`);
    if (form.maxEscapeCharacters !== current.maxEscapeCharacters) lines.push(`AT-EscapeCharacterCount=${form.maxEscapeCharacters}`);
    if (form.ledStyle !== current.ledStyle) lines.push(`AT-LedStyle=${form.ledStyle}`);
    if (form.maxCommandTimeMs !== current.maxCommandTimeMs) lines.push(`AT-MaxCommandTimeMs=${form.maxCommandTimeMs}`);
    if (form.minEscapeTimeMs !== current.minEscapeTimeMs) lines.push(`AT-MinEscapeTimeMs=${form.minEscapeTimeMs}`);
    if (form.wifiSsid !== current.wifiSsid) lines.push(`AT-WiFiSSID=${form.wifiSsid}`);
    if (form.wifiPassword !== current.wifiPassword) lines.push(`AT-WiFiPassword=${form.wifiPassword}`);

    lines.push('ATW'); // Save to NVM
    lines.push('ATX'); // Exit command mode

    return lines;
  };

  const handleApply = () => {
    // Switch to command mode if not already
    blueSmiRFInstance.processInput('$$$');

    const script = generateScript();
    script.forEach(cmd => {
      blueSmiRFInstance.processInput(cmd);
    });

    setStatusMessage('Configuration applied and saved to NVM successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
    if (onApplied) onApplied();
  };

  const handleCopyScript = () => {
    const text = generateScript().join('\r\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetDefaults = () => {
    setForm(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    blueSmiRFInstance.resetFactoryDefaults();
    setStatusMessage('Settings reset to factory defaults.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-500" />
              BlueSMiRF v2 Visual Configurator
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure Bluetooth parameters, serial baud rate, hardware flow control, and system timers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-red-600/25 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apply to BlueSMiRF</span>
            </button>

            <button
              onClick={handleCopyScript}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied AT Script!' : 'Copy AT Script'}</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-900 text-red-300 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bluetooth Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bluetooth className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Bluetooth Radio ('B')</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nickname (Broadcast Name)
              </label>
              <input
                type="text"
                maxLength={29}
                value={form.btNickname}
                onChange={e => handleChange('btNickname', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">AT-BluetoothNickname (max 29 chars)</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Radio Protocol</label>
              <select
                value={form.btType}
                onChange={e => handleChange('btType', parseInt(e.target.value, 10) as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value={0}>0 - Serial Port Profile (SPP - Classic)</option>
                <option value={1}>1 - Bluetooth Low Energy (BLE)</option>
                <option value={2}>2 - Radio Off</option>
              </select>
              <span className="text-[10px] text-slate-500">AT-BluetoothType</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Pairing PIN</label>
              <input
                type="text"
                maxLength={4}
                value={form.btPin}
                onChange={e => handleChange('btPin', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">AT-BluetoothPin (default 1234)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Connect Retries</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.btConnectRetries}
                  onChange={e => handleChange('btConnectRetries', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  min={100}
                  max={25000}
                  step={500}
                  value={form.btConnectTimeoutMs}
                  onChange={e => handleChange('btConnectTimeoutMs', parseInt(e.target.value, 10) || 1000)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Paired MAC Address</label>
              <input
                type="text"
                placeholder="XX:XX:XX:XX:XX:XX"
                value={form.btPairedMac}
                onChange={e => handleChange('btPairedMac', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">AT-BluetoothPairedMac</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">BT RX Buffer</label>
                <input
                  type="number"
                  value={form.btRxSize}
                  onChange={e => handleChange('btRxSize', parseInt(e.target.value, 10) || 1024)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">BT TX Buffer</label>
                <input
                  type="number"
                  value={form.btTxSize}
                  onChange={e => handleChange('btTxSize', parseInt(e.target.value, 10) || 1024)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Serial UART Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Binary className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Serial UART ('S')</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Serial Baud Rate (SerialSpeed)
              </label>
              <select
                value={form.baudRate}
                onChange={e => handleChange('baudRate', parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500 font-bold"
              >
                {SUPPORTED_BAUD_RATES.map(b => (
                  <option key={b} value={b}>
                    {b} bps {b === 115200 ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500">AT-SerialSpeed (up to 921600 bps)</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Hardware Flow Control</span>
                <input
                  type="checkbox"
                  checked={form.flowControl}
                  onChange={e => handleChange('flowControl', e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>
              <span className="text-[10px] text-slate-500 block">
                AT-FlowControl (CTS pin 2 / RTS pin 6)
              </span>

              {form.flowControl && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-400">Invert CTS Input</span>
                    <input
                      type="checkbox"
                      checked={form.invertCts}
                      onChange={e => handleChange('invertCts', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-0 w-3.5 h-3.5"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-400">Invert RTS Output</span>
                    <input
                      type="checkbox"
                      checked={form.invertRts}
                      onChange={e => handleChange('invertRts', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-0 w-3.5 h-3.5"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">RTS Start %</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.rtsStartSendingPercent}
                  onChange={e => handleChange('rtsStartSendingPercent', parseInt(e.target.value, 10) || 25)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-slate-500">Free buffer assert</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">RTS Stop %</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.rtsStopSendingPercent}
                  onChange={e => handleChange('rtsStopSendingPercent', parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-slate-500">Free buffer deassert</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Partial Frame Timeout (ms)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={form.serialPartialFrameTimeoutMs}
                onChange={e => handleChange('serialPartialFrameTimeoutMs', parseInt(e.target.value, 10) || 50)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">AT-PartialFrameTimeoutMs</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Serial RX Buffer Size</label>
              <input
                type="number"
                value={form.serialReceiveBufferSize}
                onChange={e => handleChange('serialReceiveBufferSize', parseInt(e.target.value, 10) || 512000)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* System & Timers Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">System & LED ('Y')</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">LED Indicator Style</label>
              <select
                value={form.ledStyle}
                onChange={e => handleChange('ledStyle', parseInt(e.target.value, 10) as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value={0}>0 - CLASSIC (Connect link status, Status blinks traffic)</option>
                <option value={1}>1 - SERIAL TRAFFIC (Connect blinks TX, Status blinks RX)</option>
                <option value={2}>2 - ALL OFF (Stealth mode - LEDs disabled)</option>
              </select>
              <span className="text-[10px] text-slate-500">AT-LedStyle</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Escape Char</label>
                <input
                  type="text"
                  maxLength={1}
                  value={form.escapeCharacter}
                  onChange={e => handleChange('escapeCharacter', e.target.value || '$')}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500 text-center font-bold"
                />
                <span className="text-[10px] text-slate-500">Default '$'</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Char Count</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.maxEscapeCharacters}
                  onChange={e => handleChange('maxEscapeCharacters', parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500 text-center"
                />
                <span className="text-[10px] text-slate-500">Default 3 ('$$$')</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Max Command Time Window (ms)
              </label>
              <input
                type="number"
                min={0}
                max={65000}
                step={5000}
                value={form.maxCommandTimeMs}
                onChange={e => handleChange('maxCommandTimeMs', parseInt(e.target.value, 10) || 60000)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">
                Command mode window after boot (default 60,000ms)
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Min Escape Quiet Time (ms)
              </label>
              <input
                type="number"
                min={0}
                max={20000}
                step={500}
                value={form.minEscapeTimeMs}
                onChange={e => handleChange('minEscapeTimeMs', parseInt(e.target.value, 10) || 2000)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">
                Required silence before escape code (prevents accidental trigger)
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-slate-300 font-medium">Wi-Fi for OTA Updates</label>
              <input
                type="text"
                placeholder="WiFi SSID"
                value={form.wifiSsid}
                onChange={e => handleChange('wifiSsid', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500 mb-2"
              />
              <input
                type="password"
                placeholder="WiFi Password"
                value={form.wifiPassword}
                onChange={e => handleChange('wifiPassword', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generated AT Command Script Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">Generated AT Command Sequence</h3>
          </div>
          <span className="text-xs text-slate-400">
            Commands to send over serial or Bluetooth terminal:
          </span>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto selection:bg-red-500/30">
          {generateScript().join('\n')}
        </pre>
      </div>
    </div>
  );
};
