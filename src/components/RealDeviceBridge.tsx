import React, { useState } from 'react';
import {
  Usb,
  Bluetooth,
  CheckCircle,
  AlertCircle,
  Power,
  RefreshCw,
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';
import { blueSmiRFInstance } from '../core/blueSmiRFEngine';
import { SUPPORTED_BAUD_RATES } from '../types/bluesmirf';

export const RealDeviceBridge: React.FC = () => {
  const [serialConnected, setSerialConnected] = useState(false);
  const [portInfo, setPortInfo] = useState<string | null>(null);
  const [selectedBaud, setSelectedBaud] = useState(115200);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  const hasWebBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleConnectSerial = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!hasWebSerial) {
      setErrorMessage('Web Serial API is not supported in this browser (available on Chrome, Edge, and Opera). You can continue using the built-in emulator.');
      return;
    }

    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: selectedBaud });

      setSerialConnected(true);
      setPortInfo(`Connected at ${selectedBaud} baud`);
      setStatusMessage('Physical serial link established with BlueSMiRF v2!');
      blueSmiRFInstance.setIsConnected(true);

      // Start reader loop
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              reader.releaseLock();
              break;
            }
            if (value) {
              blueSmiRFInstance.processInput(value);
            }
          }
        } catch (e) {
          console.warn('Serial read error', e);
        }
      })();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setErrorMessage(`Serial connection failed: ${err.message}`);
      }
    }
  };

  const handleConnectBLE = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!hasWebBluetooth) {
      setErrorMessage('Web Bluetooth API is not supported in this browser (available on Chrome, Edge, and Android Chrome).');
      return;
    }

    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });

      setStatusMessage(`Paired with BLE Device: ${device.name || 'BlueSMiRF'}`);
      blueSmiRFInstance.setIsConnected(true);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setErrorMessage(`Bluetooth connection failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Usb className="w-5 h-5 text-red-500" />
          Physical Hardware Bridge (Web Serial & Web Bluetooth)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Connect your physical SparkFun BlueSMiRF v2 hardware directly to this app via USB-UART adapter or wireless Bluetooth.
        </p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Connection Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Web Serial Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Usb className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">USB Serial Connection</h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  hasWebSerial ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hasWebSerial ? 'Web Serial Ready' : 'Browser Unsupported'}
              </span>
            </div>

            <p className="text-xs text-slate-400 my-3 leading-relaxed">
              Connect your SparkFun BlueSMiRF v2 to your computer using an FTDI Basic Breakout (DEV-09716) or CH340 serial adapter.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Port Baud Rate</label>
                <select
                  value={selectedBaud}
                  onChange={e => setSelectedBaud(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-red-500"
                >
                  {SUPPORTED_BAUD_RATES.map(b => (
                    <option key={b} value={b}>
                      {b} bps {b === 115200 ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {serialConnected && (
                <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Status:</span>
                  <span className="text-emerald-400 font-mono font-bold">{portInfo}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleConnectSerial}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow transition"
          >
            <Usb className="w-4 h-4" />
            <span>{serialConnected ? 'Change / Reconnect Port' : 'Connect Physical USB Serial Port'}</span>
          </button>
        </div>

        {/* Web Bluetooth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Wireless BLE Connection</h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  hasWebBluetooth ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hasWebBluetooth ? 'Web BLE Ready' : 'Browser Unsupported'}
              </span>
            </div>

            <p className="text-xs text-slate-400 my-3 leading-relaxed">
              Connect wirelessly to BlueSMiRF v2 over Bluetooth Low Energy (BLE). Ensure the BlueSMiRF is configured for BLE protocol (<code className="text-slate-300 font-mono">AT-BluetoothType=1</code>).
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-300 font-medium block">Pairing Steps:</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                1. Power your BlueSMiRF v2 module.<br />
                2. Tap the PAIR push button to enter advertising mode.<br />
                3. Click below to scan and pair directly from your web browser.
              </p>
            </div>
          </div>

          <button
            onClick={handleConnectBLE}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow transition"
          >
            <Bluetooth className="w-4 h-4" />
            <span>Scan for BlueSMiRF BLE Device</span>
          </button>
        </div>
      </div>
    </div>
  );
};
