import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Square,
  RefreshCw,
  Tv,
  Terminal,
  Activity,
  Sliders,
  AlertTriangle,
  Zap,
  ArrowRight,
  Database
} from 'lucide-react';

export const DualBridgeSimulator: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [generatorType, setGeneratorType] = useState<'gps' | 'weather' | 'arduino' | 'custom'>('gps');
  const [customText, setCustomText] = useState('SparkFun BlueSMiRF v2 Wireless Bridge Demo!');
  const [sendRateHz, setSendRateHz] = useState<number>(2);

  // BlueSMiRF Link Configuration
  const [baudA, setBaudA] = useState<number>(115200);
  const [baudB, setBaudB] = useState<number>(115200);
  const [linkLatencyMs, setLinkLatencyMs] = useState<number>(20);
  const [rssiDbm, setRssiDbm] = useState<number>(-58);

  // Statistics
  const [packetsSent, setPacketsSent] = useState(0);
  const [bytesSent, setBytesSent] = useState(0);
  const [baudMismatch, setBaudMismatch] = useState(false);

  // SerLCD Screen buffer (16x2)
  const [lcdLine1, setLcdLine1] = useState('SparkFun SerLCD ');
  const [lcdLine2, setLcdLine2] = useState('BlueSMiRF Ready ');

  // Target Terminal Log
  const [terminalLog, setTerminalLog] = useState<{ id: string; time: string; text: string; corrupted?: boolean }[]>([]);

  const intervalRef = useRef<any>(null);
  const tickCounter = useRef(0);
  const termScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setBaudMismatch(baudA !== baudB);
  }, [baudA, baudB]);

  useEffect(() => {
    if (termScrollRef.current) {
      termScrollRef.current.scrollTop = termScrollRef.current.scrollHeight;
    }
  }, [terminalLog]);

  const generateDataPayload = (): string => {
    tickCounter.current += 1;
    const t = tickCounter.current;

    if (generatorType === 'gps') {
      // Realistic NMEA sentence
      const lat = (4001.2345 + (t % 100) * 0.0001).toFixed(4);
      const lon = (10515.6789 + (t % 100) * 0.0001).toFixed(4);
      return `$GNGGA,175329.00,${lat},N,${lon},W,1,09,1.1,1655.4,M,-21.4,M,,*4A`;
    }

    if (generatorType === 'weather') {
      const temp = (22.5 + Math.sin(t * 0.1) * 2).toFixed(1);
      const hum = (42 + Math.cos(t * 0.1) * 5).toFixed(1);
      const press = (1013.2 + Math.sin(t * 0.05) * 1.5).toFixed(1);
      return `{"temp_c":${temp},"hum_%":${hum},"press_hpa":${press}}`;
    }

    if (generatorType === 'arduino') {
      return `Tick:${t} | AnalogA0:${450 + (t * 7) % 500} | Volt:3.28V`;
    }

    return customText;
  };

  const transmitPacket = () => {
    const payload = generateDataPayload();
    setPacketsSent(p => p + 1);
    setBytesSent(b => b + payload.length);

    // Simulate link latency and potential framing corruption on baud mismatch
    setTimeout(() => {
      let receivedText = payload;
      let corrupted = false;

      if (baudA !== baudB) {
        corrupted = true;
        // Generate framing error gibberish
        receivedText = payload
          .split('')
          .map(char => (Math.random() > 0.4 ? String.fromCharCode(Math.floor(Math.random() * 90) + 33) : char))
          .join('');
      }

      // Update SerLCD display
      if (generatorType === 'gps') {
        setLcdLine1('GPS FIX: 9 SATS ');
        setLcdLine2(`LAT:${(40.0123).toFixed(4)} LON `);
      } else if (generatorType === 'weather') {
        const temp = (22.5 + Math.sin(tickCounter.current * 0.1) * 2).toFixed(1);
        const hum = (42 + Math.cos(tickCounter.current * 0.1) * 5).toFixed(1);
        setLcdLine1(`TEMP: ${temp} C     `);
        setLcdLine2(`HUM:  ${hum} %     `);
      } else {
        setLcdLine1(receivedText.slice(0, 16).padEnd(16, ' '));
        setLcdLine2(receivedText.slice(16, 32).padEnd(16, ' '));
      }

      // Append to target terminal
      setTerminalLog(prev => [
        ...prev.slice(-40),
        {
          id: `${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString(),
          text: receivedText,
          corrupted
        }
      ]);
    }, linkLatencyMs);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        transmitPacket();
      }, 1000 / sendRateHz);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, sendRateHz, generatorType, customText, baudA, baudB, linkLatencyMs]);

  const handleReset = () => {
    setRunning(false);
    setPacketsSent(0);
    setBytesSent(0);
    setTerminalLog([]);
    setLcdLine1('SparkFun SerLCD ');
    setLcdLine2('BlueSMiRF Ready ');
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              Virtual Wireless Dual-Bridge Testbench
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Simulates two BlueSMiRF v2 modules paired point-to-point via Bluetooth SPP wireless RF pipe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning(!running)}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md ${
                running
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {running ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Transmission</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Live Stream</span>
                </>
              )}
            </button>

            <button
              onClick={transmitPacket}
              disabled={running}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Step Single Packet</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Reset Testbench"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Baud Mismatch Warning Banner */}
      {baudMismatch && (
        <div className="p-4 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-200 text-xs flex items-start gap-3 shadow-lg animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300 text-sm">UART Baud Rate Mismatch Detected!</div>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              Device A UART is configured at <strong className="font-mono">{baudA} bps</strong>, but BlueSMiRF #2 UART is configured at <strong className="font-mono">{baudB} bps</strong>. This simulates framing errors and bit-shift corruption across the physical serial UART lines. Align both bauds to restore clean data transmission.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Bridge Visual Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Device A (Source) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white text-sm">Device A (Transmitter)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                UART TX
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source Data Stream</label>
                <select
                  value={generatorType}
                  onChange={e => setGeneratorType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="gps">SparkFun GPS / GNSS (NMEA $GNGGA)</option>
                  <option value="weather">BME280 Environmental Sensor (JSON)</option>
                  <option value="arduino">Arduino Pro Mini Sensor Telemetry</option>
                  <option value="custom">Custom Plain Text Message</option>
                </select>
              </div>

              {generatorType === 'custom' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Message Payload</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">UART Baud Rate</label>
                  <select
                    value={baudA}
                    onChange={e => setBaudA(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(b => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Rate (Hz)</label>
                  <select
                    value={sendRateHz}
                    onChange={e => setSendRateHz(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value={1}>1 Hz (1 pkt/s)</option>
                    <option value={2}>2 Hz (2 pkt/s)</option>
                    <option value={5}>5 Hz (5 pkt/s)</option>
                    <option value={10}>10 Hz (10 pkt/s)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Module 1 Physical Card Mockup */}
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between font-mono font-bold text-red-300">
              <span>BlueSMiRF #1 (TX Unit)</span>
              <span className="text-[10px] text-slate-400">MAC: 24:0A:C4:88:4B:2E</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 text-[11px] pt-1">
              <span>Connect LED: <strong className="text-blue-400">SOLID (Linked)</strong></span>
              <span>Status LED: <strong className={running ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}>{running ? 'TX FLASH' : 'IDLE'}</strong></span>
            </div>
          </div>
        </div>

        {/* Center Column: Wireless 2.4GHz RF Link */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500" />
                <span className="font-bold text-white text-sm">2.4GHz Bluetooth SPP Pipe</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {rssiDbm} dBm
              </span>
            </div>

            {/* Wireless Tunnel Animation */}
            <div className="my-5 p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="flex items-center justify-between w-full px-4 z-10">
                <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-700 flex items-center justify-center font-mono font-bold text-red-400 text-xs shadow">
                  #1 TX
                </div>

                <div className="flex-1 mx-4 flex items-center justify-center relative">
                  <div className="w-full border-t-2 border-dashed border-red-500/40" />
                  {running && (
                    <div className="absolute animate-ping w-2 h-2 rounded-full bg-red-400" />
                  )}
                  <ArrowRight className="w-4 h-4 text-red-400 absolute" />
                </div>

                <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-700 flex items-center justify-center font-mono font-bold text-red-400 text-xs shadow">
                  #2 RX
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono mt-3 text-center">
                Transparent Wireless UART Tunnel (No line drop)
              </div>
            </div>

            {/* RF Parameters Sliders */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>RF Latency:</span>
                  <span className="font-mono text-slate-200">{linkLatencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={linkLatencyMs}
                  onChange={e => setLinkLatencyMs(parseInt(e.target.value, 10))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Signal Strength (RSSI):</span>
                  <span className="font-mono text-slate-200">{rssiDbm} dBm</span>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={-30}
                  step={1}
                  value={rssiDbm}
                  onChange={e => setRssiDbm(parseInt(e.target.value, 10))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Link Metrics */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">PACKETS SENT</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{packetsSent}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">TOTAL BYTES</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{bytesSent} B</span>
            </div>
          </div>
        </div>

        {/* Right Column: Device B (Target / Receiver) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Device B (Receiver / SerLCD)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                UART RX
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Receiver UART Baud Rate</label>
                <select
                  value={baudB}
                  onChange={e => setBaudB(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500 font-bold"
                >
                  {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(b => (
                    <option key={b} value={b}>
                      {b} bps
                    </option>
                  ))}
                </select>
              </div>

              {/* SparkFun SerLCD Alphanumeric 16x2 Display Mockup */}
              <div>
                <span className="block text-slate-400 mb-1.5 font-medium flex items-center justify-between">
                  <span>SparkFun SerLCD 16x2 Display</span>
                  <span className="text-[10px] text-emerald-400 font-mono">LCD-16397</span>
                </span>
                <div className="bg-[#0b1c10] border-4 border-[#1e3a24] rounded-lg p-3 font-mono shadow-inner select-none">
                  <div className="text-emerald-400 text-sm tracking-widest font-bold h-6 flex items-center drop-shadow-[0_0_8px_#10b981]">
                    {lcdLine1}
                  </div>
                  <div className="text-emerald-400 text-sm tracking-widest font-bold h-6 flex items-center drop-shadow-[0_0_8px_#10b981]">
                    {lcdLine2}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2 Physical Card Mockup */}
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between font-mono font-bold text-red-300">
              <span>BlueSMiRF #2 (RX Unit)</span>
              <span className="text-[10px] text-slate-400">MAC: 24:0A:C4:88:99:FF</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 text-[11px] pt-1">
              <span>Connect LED: <strong className="text-blue-400">SOLID</strong></span>
              <span>Status LED: <strong className={running ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}>{running ? 'RX FLASH' : 'IDLE'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Terminal Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              Device B Physical UART Terminal Monitor
            </span>
          </div>
          <button
            onClick={() => setTerminalLog([])}
            className="text-xs text-slate-400 hover:text-white"
          >
            Clear Log
          </button>
        </div>

        <div
          ref={termScrollRef}
          className="p-4 bg-slate-950 font-mono text-xs max-h-52 overflow-y-auto space-y-1"
        >
          {terminalLog.length === 0 ? (
            <div className="text-slate-600 italic py-6 text-center">
              Awaiting wireless packets from BlueSMiRF #1...
            </div>
          ) : (
            terminalLog.map(item => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-slate-600 select-none">[{item.time}]</span>
                <span className={item.corrupted ? 'text-red-400 font-bold' : 'text-emerald-300'}>
                  {item.text}
                </span>
                {item.corrupted && (
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1 rounded">
                    Framing Error (Baud Mismatch)
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
