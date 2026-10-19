import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  Terminal,
  Zap,
  Cpu,
  Radio,
  Sliders,
  ExternalLink,
  HelpCircle,
  History,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { blueSmiRFInstance } from '../core/blueSmiRFEngine';

interface DocumentationViewProps {
  onSelectCommand?: (cmd: string) => void;
}

interface DocSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({ onSelectCommand }) => {
  const [activeSectionId, setActiveSectionId] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const executeCommand = (cmd: string) => {
    if (onSelectCommand) {
      onSelectCommand(cmd);
    } else {
      blueSmiRFInstance.processInput(cmd);
    }
  };

  const SECTIONS: DocSection[] = [
    {
      id: 'overview',
      title: 'Introduction & Overview',
      icon: BookOpen,
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-white mb-2">SparkFun BlueSMiRF v2 Hookup Guide</h3>
          <p>
            The <strong>SparkFun BlueSMiRF v2</strong> is a wireless Bluetooth® serial link. These boards work as a transparent wireless UART pipe and are a drop-in replacement for traditional serial cables. Simply pair, connect, and transmit serial data between your TX and RX lines! Any serial stream from <strong>2,400 to 921,600 baud</strong> can be passed seamlessly between two devices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-white block mb-1">Duplex 921,600 bps</span>
              <p className="text-xs text-slate-400">
                Correctly buffers, transmits, and delivers full-duplex high-speed serial data without dropped bytes.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-white block mb-1">3.3V - 5V Logic Tolerant</span>
              <p className="text-xs text-slate-400">
                On-board bidirectional level shifters protect the ESP32 while communicating with 5V Arduino boards.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-white block mb-1">Dual Mode Classic & BLE</span>
              <p className="text-xs text-slate-400">
                Supports Bluetooth Classic Serial Port Profile (SPP) for Android/PC and BLE for iOS devices.
              </p>
            </div>
          </div>

          <h4 className="text-base font-bold text-white mt-6 mb-2">Key Hardware Improvements over BlueSMiRF v1</h4>
          <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
            <li>Powered by Espressif ESP32-PICO-MINI-02 module replacing obsolete RN-41.</li>
            <li>Same standard 1x6 FTDI pinout (GND, CTS, VCC, TXO, RXI, RTS) for direct header mating.</li>
            <li>Hardware PAIR push button on board for automatic 1-touch pairing between 2 BlueSMiRFs.</li>
            <li>Over-The-Air (OTA) firmware updates via 2.4GHz Wi-Fi using simple AT commands.</li>
            <li>On-board AP2112K 3.3V 600mA low-dropout voltage regulator with solder bypass jumper.</li>
            <li>Customizable LED blinking styles: Classic, Serial Traffic, or Stealth (All Off).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'at_commands',
      title: 'AT Command Reference',
      icon: Terminal,
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xl font-bold text-white">BlueSMiRF v2 AT Command Set</h3>
              <p className="text-xs text-slate-400">
                Send <code className="text-amber-400">$$$</code> within 60s of power-on to enter Command Mode. Commands are case-insensitive.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-amber-200 text-xs">
            <strong>Timing Note:</strong> Command mode requires <strong>MinEscapeTimeMs (2000ms)</strong> of quiet serial time before entering <code className="font-mono">$$$</code>. Both CONNECT and STATUS LEDs fade in and out when in Command Mode.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-950 text-slate-200 uppercase font-mono">
                <tr>
                  <th className="p-2.5 border-b border-slate-800">Command</th>
                  <th className="p-2.5 border-b border-slate-800">Description</th>
                  <th className="p-2.5 border-b border-slate-800">Default</th>
                  <th className="p-2.5 border-b border-slate-800 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {[
                  { cmd: '$$$', desc: 'Enter AT Command Mode', def: '-' },
                  { cmd: 'AT', desc: 'Checks link status (Returns OK)', def: '-' },
                  { cmd: 'AT?', desc: 'Display command summary help text', def: '-' },
                  { cmd: 'ATA', desc: 'Display all current device settings', def: '-' },
                  { cmd: 'ATB', desc: 'Display Bluetooth settings', def: '-' },
                  { cmd: 'ATS', desc: 'Display Serial UART settings', def: '-' },
                  { cmd: 'ATY', desc: 'Display System & LED settings', def: '-' },
                  { cmd: 'ATM', desc: 'Display BlueSMiRF MAC address', def: '-' },
                  { cmd: 'ATP', desc: 'Start Bluetooth pairing routine', def: '-' },
                  { cmd: 'ATV', desc: 'Display firmware version string', def: '-' },
                  { cmd: 'ATW', desc: 'Save settings to Non-Volatile Memory (NVM)', def: '-' },
                  { cmd: 'ATX', desc: 'Exit command mode back to data pipe', def: '-' },
                  { cmd: 'ATZ', desc: 'Reboot module', def: '-' },
                  { cmd: 'ATF', desc: 'Restore factory default settings', def: '-' },
                  { cmd: 'ATC', desc: 'Check for OTA firmware updates over WiFi', def: '-' },
                  { cmd: 'AT-SerialSpeed=115200', desc: 'Set baud rate (2400-921600)', def: '115200' },
                  { cmd: 'AT-FlowControl=1', desc: 'Enable CTS/RTS hardware flow control', def: '0 (Off)' },
                  { cmd: 'AT-BluetoothNickname=MyRadio', desc: 'Set Bluetooth broadcast name', def: 'BlueSMiRF-XXXX' },
                  { cmd: 'AT-BluetoothType=0', desc: '0=SPP Classic, 1=BLE, 2=Off', def: '0' },
                  { cmd: 'AT-LedStyle=0', desc: '0=Classic, 1=Traffic, 2=Off', def: '0' },
                  { cmd: 'AT-MaxCommandTimeMs=60000', desc: 'Command entry window after boot', def: '60000 ms' }
                ].map(item => (
                  <tr key={item.cmd} className="hover:bg-slate-900/60">
                    <td className="p-2.5 text-red-400 font-bold whitespace-nowrap">{item.cmd}</td>
                    <td className="p-2.5 text-slate-300 font-sans">{item.desc}</td>
                    <td className="p-2.5 text-slate-400 whitespace-nowrap">{item.def}</td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => executeCommand(item.cmd)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 text-[11px] transition"
                      >
                        Try in Terminal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'assembly',
      title: 'Hardware Assembly & Wiring',
      icon: Zap,
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-white">Hardware Assembly & Connections</h3>
          <p>
            The SparkFun BlueSMiRF v2 header pinout directly matches standard 6-pin serial converters (FTDI Basic) and Arduino Pro / Pro Mini boards.
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-white text-sm">Arduino Pro / Pro Mini Connection</h4>
            <p className="text-xs text-slate-400">
              Simply align the pins directly: GND to GND, VCC to VCC, RXI to TX, and TXO to RX. If your Arduino board has a female header, use the <strong>BlueSMiRF v2 - Headers (WRL-23287)</strong> variant for direct plug-in.
            </p>
            <div className="p-2.5 bg-slate-900 rounded font-mono text-xs text-emerald-400">
              Arduino TX (Pin 1) ----&gt; BlueSMiRF RXI (Pin 5) [5V tolerant]<br />
              Arduino RX (Pin 0) &lt;---- BlueSMiRF TXO (Pin 4) [3.3V logic]<br />
              Arduino VCC        ----&gt; BlueSMiRF VCC (Pin 3) [3.3V - 5V]<br />
              Arduino GND        ----&gt; BlueSMiRF GND (Pin 1)
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-white text-sm">SparkFun SerLCD Display Wireless Link</h4>
            <p className="text-xs text-slate-400">
              To drive an LCD display remotely over Bluetooth, connect the BlueSMiRF TXO pin to the SerLCD RX pin. Any characters transmitted to the paired BlueSMiRF will instantly appear on the LCD screen!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pairing',
      title: 'Button Pairing & Operation Modes',
      icon: Radio,
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-white">Pairing Two BlueSMiRFs</h3>
          <p>
            Connecting two BlueSMiRFs together without a computer is easy thanks to the onboard <strong>PAIR</strong> push button.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-amber-400 block mb-1">Step 1: Power Both Units</span>
              <p className="text-slate-400">
                Connect 3.3V to 5V power to both BlueSMiRF modules. The CONNECT LEDs will begin blinking at 1Hz indicating they are waiting for a connection.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-amber-400 block mb-1">Step 2: Press PAIR Button on Unit 1</span>
              <p className="text-slate-400">
                Press and hold the PAIR button on the first BlueSMiRF for <strong>3 seconds</strong> until the LEDs alternate flash. The module enters active discovery and looks for friendly BlueSMiRF units.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-amber-400 block mb-1">Step 3: Press PAIR Button on Unit 2</span>
              <p className="text-slate-400">
                Press the PAIR button on the second unit. The two units will exchange Bluetooth MAC addresses and establish a paired SPP link. The CONNECT LEDs on both boards will turn solid Blue!
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-red-400 block mb-1">Factory Reset (8 Second Hold)</span>
              <p className="text-slate-400">
                Holding the PAIR button for 8 seconds triggers a full factory reset (erases stored paired MAC, restores 115200 baud, and resets all parameters to defaults).
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting & FAQs',
      icon: HelpCircle,
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-white">Common Questions & Troubleshooting</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-white block mb-1">
                Q: Why won't my BlueSMiRF respond to <code className="text-amber-400">$$$</code>?
              </span>
              <p className="text-slate-400">
                1. Make sure less than 60 seconds has passed since power-on. (After 60s, command mode is locked out to prevent accidental triggers).<br />
                2. BlueSMiRF enforces a 2-second silence guard time (<code className="text-slate-300">MinEscapeTimeMs</code>). Stop sending characters for 2 seconds before sending <code className="text-amber-400">$$$</code>.<br />
                3. Verify your serial terminal baud rate matches the BlueSMiRF baud rate (default 115,200 baud).
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-white block mb-1">
                Q: Does BlueSMiRF work with Apple iPhone / iPad?
              </span>
              <p className="text-slate-400">
                Yes! While iOS does not support Bluetooth Classic SPP without MFi certification, BlueSMiRF v2 has built-in <strong>BLE (Bluetooth Low Energy)</strong>. Configure <code className="text-slate-300">AT-BluetoothType=1</code> to use BLE with apps like LightBlue or Web Bluetooth.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="font-bold text-white block mb-1">
                Q: Can I connect BlueSMiRF directly to a 5V Arduino Uno?
              </span>
              <p className="text-slate-400">
                Yes. The RXI and CTS pins have integrated bidirectional logic level shifting circuitry safe for up to 5V logic. VCC can accept 3.3V to 5.0V.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-500" />
            Hookup Guide & Documentation
          </h2>
          <span className="text-[11px] text-slate-400">SparkFun BlueSMiRF v2 Knowledge Base</span>
        </div>

        <nav className="space-y-1">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = s.id === activeSectionId;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSectionId(s.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition ${
                  active
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{s.title}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        {currentSection.content}
      </div>
    </div>
  );
};
