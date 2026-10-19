import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { TerminalView } from './components/TerminalView';
import { ConfiguratorView } from './components/ConfiguratorView';
import { DualBridgeSimulator } from './components/DualBridgeSimulator';
import { HardwareViewer } from './components/HardwareViewer';
import { DocumentationView } from './components/DocumentationView';
import { RealDeviceBridge } from './components/RealDeviceBridge';
import { blueSmiRFInstance } from './core/blueSmiRFEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');
  const [mode, setMode] = useState(blueSmiRFInstance.getMode());
  const [connectLed, setConnectLed] = useState(blueSmiRFInstance.connectLed);
  const [statusLed, setStatusLed] = useState(blueSmiRFInstance.statusLed);

  useEffect(() => {
    const unsubscribe = blueSmiRFInstance.subscribe(() => {
      setMode(blueSmiRFInstance.getMode());
      setConnectLed(blueSmiRFInstance.connectLed);
      setStatusLed(blueSmiRFInstance.statusLed);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectCommandFromDoc = (cmd: string) => {
    setActiveTab('terminal');
    // If not in command mode and it's an AT command, enter command mode first
    if (cmd !== '$$$' && blueSmiRFInstance.getMode() !== 'COMMAND') {
      blueSmiRFInstance.processInput('$$$');
    }
    setTimeout(() => {
      blueSmiRFInstance.processInput(cmd);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={mode}
        connectLed={connectLed}
        statusLed={statusLed}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'terminal' && (
          <TerminalView onQuickConfigure={() => setActiveTab('configurator')} />
        )}

        {activeTab === 'configurator' && (
          <ConfiguratorView onApplied={() => setActiveTab('terminal')} />
        )}

        {activeTab === 'bridge' && <DualBridgeSimulator />}

        {activeTab === 'hardware' && <HardwareViewer />}

        {activeTab === 'docs' && (
          <DocumentationView onSelectCommand={handleSelectCommandFromDoc} />
        )}

        {activeTab === 'real_device' && <RealDeviceBridge />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SparkFun BlueSMiRF v2 Open Source Hardware Companion • Powered by ESP32-PICO-MINI-02
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://www.sparkfun.com/sparkfun-bluesmirf-v2.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 transition"
            >
              SparkFun Product Page
            </a>
            <span>•</span>
            <a
              href="https://github.com/sparkfun/SparkFun_BlueSMiRF-v2"
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-400 transition"
            >
              GitHub Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
