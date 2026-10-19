import {
  BlueSMiRFSettings,
  DEFAULT_SETTINGS,
  BlueSMiRFMode,
  SUPPORTED_BAUD_RATES,
  BluetoothRadioType,
  LedStyleType
} from '../types/bluesmirf';

const STORAGE_KEY = 'sparkfun_bluesmirf_v2_nvm';

export class BlueSMiRFEngine {
  private settings: BlueSMiRFSettings;
  private savedSettings: BlueSMiRFSettings;
  private mode: BlueSMiRFMode = 'DATA';
  private macAddress = '24:0A:C4:88:4B:2E';
  private firmwareVersion = 'BlueSMiRF v2.0.4 (ESP32-PICO-MINI-02)';
  private commandTimeRemaining = 60000;
  private isConnected = false;
  private listeners: Array<() => void> = [];
  private terminalOutputCallback: ((text: string, type: 'rx' | 'system' | 'error') => void) | null = null;

  // LED indicators state
  public connectLed = false;
  public statusLed = false;
  private ledInterval: any = null;
  private pulsePhase = 0;

  constructor() {
    this.savedSettings = this.loadFromNVM();
    this.settings = JSON.parse(JSON.stringify(this.savedSettings));
    this.startLedService();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public setOutputCallback(cb: (text: string, type: 'rx' | 'system' | 'error') => void) {
    this.terminalOutputCallback = cb;
  }

  private output(text: string, type: 'rx' | 'system' | 'error' = 'rx') {
    if (this.terminalOutputCallback) {
      this.terminalOutputCallback(text, type);
    }
  }

  private loadFromNVM(): BlueSMiRFSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_SETTINGS };
  }

  public saveToNVM(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.savedSettings = JSON.parse(JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save to NVM', e);
    }
  }

  public getSettings(): BlueSMiRFSettings {
    return { ...this.settings };
  }

  public getSavedSettings(): BlueSMiRFSettings {
    return { ...this.savedSettings };
  }

  public getMode(): BlueSMiRFMode {
    return this.mode;
  }

  public getMacAddress(): string {
    return this.macAddress;
  }

  public getFirmwareVersion(): string {
    return this.firmwareVersion;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public setIsConnected(connected: boolean): void {
    this.isConnected = connected;
    this.notify();
  }

  public triggerTxActivity(): void {
    if (this.settings.ledStyle === 0) {
      // Classic: status LED blinks on TX/RX
      this.statusLed = true;
      setTimeout(() => {
        this.statusLed = false;
        this.notify();
      }, 60);
    } else if (this.settings.ledStyle === 1) {
      // Serial traffic: connect LED blinks on TX
      this.connectLed = true;
      setTimeout(() => {
        this.connectLed = false;
        this.notify();
      }, 60);
    }
    this.notify();
  }

  public triggerRxActivity(): void {
    if (this.settings.ledStyle === 0) {
      this.statusLed = true;
      setTimeout(() => {
        this.statusLed = false;
        this.notify();
      }, 60);
    } else if (this.settings.ledStyle === 1) {
      this.statusLed = true;
      setTimeout(() => {
        this.statusLed = false;
        this.notify();
      }, 60);
    }
    this.notify();
  }

  // Button interactions
  public handleButtonShortPress(): void {
    if (this.mode === 'COMMAND') {
      this.output('\r\nExit Command Mode\r\n', 'system');
      this.mode = 'DATA';
    } else {
      this.mode = 'PAIRING';
      this.output('\r\nPair button pressed. Scanning for friendly BlueSMiRF devices...\r\n', 'system');
      setTimeout(() => {
        this.mode = 'DATA';
        this.isConnected = true;
        this.output('Paired successfully with remote BlueSMiRF! Connection established.\r\n', 'system');
        this.notify();
      }, 3000);
    }
    this.notify();
  }

  public handleButtonLongPress3s(): void {
    this.mode = 'PAIRING';
    this.output('\r\n[3s HOLD] Pair Mode triggered. Actively scanning for devices...\r\n', 'system');
    setTimeout(() => {
      this.mode = 'DATA';
      this.isConnected = true;
      this.output('[Bluetooth] Paired and connected.\r\n', 'system');
      this.notify();
    }, 3500);
    this.notify();
  }

  public handleButtonLongPress8s(): void {
    this.output('\r\n[8s HOLD] Restoring factory defaults and rebooting...\r\n', 'system');
    this.resetFactoryDefaults();
  }

  public reboot(): void {
    this.mode = 'REBOOTING';
    this.output('\r\nRebooting BlueSMiRF v2...\r\n', 'system');
    this.notify();

    setTimeout(() => {
      this.settings = JSON.parse(JSON.stringify(this.savedSettings));
      this.mode = 'DATA';
      this.commandTimeRemaining = this.settings.maxCommandTimeMs;
      this.output(`\r\nSparkFun BlueSMiRF v2 Booting...\r\nFirmware: ${this.firmwareVersion}\r\nMAC: ${this.macAddress}\r\nBaud: ${this.settings.baudRate}\r\nReady.\r\n`, 'system');
      this.notify();
    }, 1200);
  }

  public resetFactoryDefaults(): void {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.saveToNVM();
    this.reboot();
  }

  // Process incoming raw string from Serial or Bluetooth
  public processInput(rawInput: string): void {
    const input = rawInput.trim();

    if (this.mode === 'DATA') {
      // Check for escape character sequence, e.g. "$$$"
      const escapePattern = this.settings.escapeCharacter.repeat(this.settings.maxEscapeCharacters);
      if (input === escapePattern || input.toUpperCase() === '$$$') {
        this.mode = 'COMMAND';
        this.output('\r\nOK\r\n', 'rx');
        this.notify();
        return;
      }

      // If in data mode and not escape code, just route through data pipe
      this.triggerTxActivity();
      return;
    }

    if (this.mode === 'COMMAND') {
      this.triggerRxActivity();
      this.handleCommand(input);
    }
  }

  private handleCommand(cmd: string): void {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const upper = trimmed.toUpperCase();

    // Standard AT Commands
    if (upper === 'AT') {
      this.output('OK\r\n', 'rx');
      return;
    }

    if (upper === 'AT?' || upper === 'HELP') {
      const help = [
        'Command summary:',
        '  AT? - Print the command summary',
        '  ATA - Display all settings',
        '  ATB - Display Bluetooth settings',
        '  ATC - Check for new firmware',
        '  ATD - Display the debug settings',
        '  ATF - Restore factory settings',
        '  ATM - Display MAC address',
        '  ATP - Start pairing process',
        '  ATS - Display serial settings',
        '  ATU - Update Firmware',
        '  ATV - Display firmware version',
        '  ATW - Save current settings to NVM',
        '  ATX - Exit command mode',
        '  ATY - Display system settings',
        '  ATZ - Reboot the system',
        '  AT-<Param>=<value> - Set parameter value by name',
        '  AT-<Param>? - Print parameter current value',
        '  AT-? - Display all parameter names and values',
        'OK\r\n'
      ].join('\r\n');
      this.output(help, 'rx');
      return;
    }

    if (upper === 'ATA') {
      this.output(this.formatAllSettings(), 'rx');
      return;
    }

    if (upper === 'ATB') {
      this.output(this.formatBluetoothSettings(), 'rx');
      return;
    }

    if (upper === 'ATS') {
      this.output(this.formatSerialSettings(), 'rx');
      return;
    }

    if (upper === 'ATY') {
      this.output(this.formatSystemSettings(), 'rx');
      return;
    }

    if (upper === 'ATD') {
      this.output(this.formatDebugSettings(), 'rx');
      return;
    }

    if (upper === 'ATM') {
      this.output(`MAC: ${this.macAddress}\r\nOK\r\n`, 'rx');
      return;
    }

    if (upper === 'ATV') {
      this.output(`${this.firmwareVersion}\r\nOK\r\n`, 'rx');
      return;
    }

    if (upper === 'ATP') {
      this.output('Starting Bluetooth pairing inquiry...\r\n', 'rx');
      this.mode = 'PAIRING';
      this.notify();
      setTimeout(() => {
        this.mode = 'COMMAND';
        this.output('Pairing complete. Remote device stored.\r\nOK\r\n', 'rx');
        this.notify();
      }, 2500);
      return;
    }

    if (upper === 'ATW') {
      this.saveToNVM();
      this.output('Settings saved to NVM successfully.\r\nOK\r\n', 'rx');
      this.notify();
      return;
    }

    if (upper === 'ATX') {
      this.mode = 'DATA';
      this.output('Exiting command mode.\r\nOK\r\n', 'rx');
      this.notify();
      return;
    }

    if (upper === 'ATZ') {
      this.output('Rebooting system...\r\nOK\r\n', 'rx');
      this.reboot();
      return;
    }

    if (upper === 'ATF') {
      this.output('Restoring factory settings...\r\nOK\r\n', 'rx');
      this.resetFactoryDefaults();
      return;
    }

    if (upper === 'ATC') {
      this.output('Connecting to WiFi to check firmware...\r\nFirmware is up to date (v2.0.4 is latest).\r\nOK\r\n', 'rx');
      return;
    }

    if (upper === 'ATU') {
      this.output('Checking OTA updates...\r\nAlready running latest firmware v2.0.4.\r\nOK\r\n', 'rx');
      return;
    }

    if (upper === 'AT-?' || upper === 'AT-') {
      this.output(this.formatAllParameters(), 'rx');
      return;
    }

    // Parameter query: AT-<Param>? or AT-<Param>
    if (upper.startsWith('AT-')) {
      const rest = trimmed.substring(3);

      if (rest.includes('=')) {
        // Set parameter: AT-<Param>=<value>
        const [paramName, ...valParts] = rest.split('=');
        const paramVal = valParts.join('=');
        const result = this.setParameter(paramName.trim(), paramVal.trim());
        if (result.success) {
          this.output('OK\r\n', 'rx');
          this.notify();
        } else {
          this.output(`ERROR: ${result.error}\r\n`, 'error');
        }
        return;
      }

      // Query parameter: AT-<Param>? or AT-<Param>
      const paramName = rest.endsWith('?') ? rest.slice(0, -1) : rest;
      const result = this.getParameter(paramName.trim());
      if (result.success) {
        this.output(`${result.value}\r\nOK\r\n`, 'rx');
      } else {
        this.output(`ERROR: ${result.error}\r\n`, 'error');
      }
      return;
    }

    this.output(`ERROR: Unknown command '${trimmed}'. Send 'AT?' for help.\r\n`, 'error');
  }

  private setParameter(name: string, value: string): { success: boolean; error?: string } {
    const key = name.toLowerCase();

    // Bluetooth
    if (key === 'bluetoothconnectretries') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0 || val > 100) return { success: false, error: 'Value must be 0-100' };
      this.settings.btConnectRetries = val;
      return { success: true };
    }
    if (key === 'bluetoothconnecttimeoutms') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 100 || val > 25000) return { success: false, error: 'Value must be 100-25000' };
      this.settings.btConnectTimeoutMs = val;
      return { success: true };
    }
    if (key === 'bluetoothescapecharacter') {
      if (value.length !== 1) return { success: false, error: 'Must be a single ASCII character' };
      this.settings.btEscapeCharacter = value;
      return { success: true };
    }
    if (key === 'bluetoothnickname') {
      if (value.length > 29) return { success: false, error: 'Nickname max 29 characters' };
      this.settings.btNickname = value;
      return { success: true };
    }
    if (key === 'bluetoothpairedmac') {
      this.settings.btPairedMac = value;
      return { success: true };
    }
    if (key === 'bluetoothpairedname') {
      if (value.length > 50) return { success: false, error: 'Paired name max 50 characters' };
      this.settings.btPairedName = value;
      return { success: true };
    }
    if (key === 'bluetoothpin') {
      if (value.length > 4) return { success: false, error: 'PIN max 4 characters' };
      this.settings.btPin = value;
      return { success: true };
    }
    if (key === 'bluetoothrxsize') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1024 || val > 1000000) return { success: false, error: 'Buffer size 1024-1000000' };
      this.settings.btRxSize = val;
      return { success: true };
    }
    if (key === 'bluetoothtxsize') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1024 || val > 1000000) return { success: false, error: 'Buffer size 1024-1000000' };
      this.settings.btTxSize = val;
      return { success: true };
    }
    if (key === 'bluetoothtype') {
      const val = parseInt(value, 10);
      if (val !== 0 && val !== 1 && val !== 2) return { success: false, error: 'Type must be 0 (SPP), 1 (BLE), or 2 (OFF)' };
      this.settings.btType = val as BluetoothRadioType;
      return { success: true };
    }

    // Serial
    if (key === 'flowcontrol') {
      const val = value === '1' || value.toLowerCase() === 'true';
      this.settings.flowControl = val;
      return { success: true };
    }
    if (key === 'invertcts') {
      const val = value === '1' || value.toLowerCase() === 'true';
      this.settings.invertCts = val;
      return { success: true };
    }
    if (key === 'invertrts') {
      const val = value === '1' || value.toLowerCase() === 'true';
      this.settings.invertRts = val;
      return { success: true };
    }
    if (key === 'partialframetimeoutms') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0 || val > 1000) return { success: false, error: 'Value must be 0-1000' };
      this.settings.serialPartialFrameTimeoutMs = val;
      return { success: true };
    }
    if (key === 'rtsstartsendingpercent') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1 || val > 99) return { success: false, error: 'Value must be 1-99' };
      this.settings.rtsStartSendingPercent = val;
      return { success: true };
    }
    if (key === 'rtsstopsendingpercent') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1 || val > 99) return { success: false, error: 'Value must be 1-99' };
      this.settings.rtsStopSendingPercent = val;
      return { success: true };
    }
    if (key === 'serialreceivebuffersize') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1024 || val > 1000000) return { success: false, error: 'Value must be 1024-1000000' };
      this.settings.serialReceiveBufferSize = val;
      return { success: true };
    }
    if (key === 'serialtransmitbuffersize') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 1024 || val > 1000000) return { success: false, error: 'Value must be 1024-1000000' };
      this.settings.serialTransmitBufferSize = val;
      return { success: true };
    }
    if (key === 'serialspeed' || key === 'baudrate') {
      const val = parseInt(value, 10);
      if (!SUPPORTED_BAUD_RATES.includes(val as any)) {
        return { success: false, error: `Invalid baud rate. Supported: ${SUPPORTED_BAUD_RATES.join(', ')}` };
      }
      this.settings.baudRate = val;
      return { success: true };
    }

    // System
    if (key === 'escapecharacter') {
      if (value.length !== 1) return { success: false, error: 'Must be 1 character' };
      this.settings.escapeCharacter = value;
      return { success: true };
    }
    if (key === 'escapecharactercount') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0 || val > 255) return { success: false, error: 'Count must be 0-255' };
      this.settings.maxEscapeCharacters = val;
      return { success: true };
    }
    if (key === 'ledstyle') {
      const val = parseInt(value, 10);
      if (val !== 0 && val !== 1 && val !== 2) return { success: false, error: '0=CLASSIC, 1=SERIAL_TRAFFIC, 2=ALL_OFF' };
      this.settings.ledStyle = val as LedStyleType;
      return { success: true };
    }
    if (key === 'maxcommandtimems') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0 || val > 65000) return { success: false, error: 'Must be 0-65000' };
      this.settings.maxCommandTimeMs = val;
      return { success: true };
    }
    if (key === 'minescapetimems') {
      const val = parseInt(value, 10);
      if (isNaN(val) || val < 0 || val > 20000) return { success: false, error: 'Must be 0-20000' };
      this.settings.minEscapeTimeMs = val;
      return { success: true };
    }
    if (key === 'wifissid') {
      this.settings.wifiSsid = value;
      return { success: true };
    }
    if (key === 'wifipassword') {
      this.settings.wifiPassword = value;
      return { success: true };
    }

    // Debug
    if (key === 'debugserial') {
      this.settings.debugSerial = value === '1' || value.toLowerCase() === 'true';
      return { success: true };
    }
    if (key === 'debugbluetooth') {
      this.settings.debugBluetooth = value === '1' || value.toLowerCase() === 'true';
      return { success: true };
    }
    if (key === 'debugheap') {
      this.settings.debugHeap = value === '1' || value.toLowerCase() === 'true';
      return { success: true };
    }

    return { success: false, error: `Unknown parameter '${name}'` };
  }

  private getParameter(name: string): { success: boolean; value?: string; error?: string } {
    const key = name.toLowerCase();

    const lookup: Record<string, any> = {
      bluetoothconnectretries: this.settings.btConnectRetries,
      bluetoothconnecttimeoutms: this.settings.btConnectTimeoutMs,
      bluetoothescapecharacter: this.settings.btEscapeCharacter,
      bluetoothnickname: this.settings.btNickname,
      bluetoothpairedmac: this.settings.btPairedMac,
      bluetoothpairedname: this.settings.btPairedName,
      bluetoothpin: this.settings.btPin,
      bluetoothrxsize: this.settings.btRxSize,
      bluetoothtxsize: this.settings.btTxSize,
      bluetoothtype: this.settings.btType,

      flowcontrol: this.settings.flowControl ? '1' : '0',
      invertcts: this.settings.invertCts ? '1' : '0',
      invertrts: this.settings.invertRts ? '1' : '0',
      partialframetimeoutms: this.settings.serialPartialFrameTimeoutMs,
      rtsstartsendingpercent: this.settings.rtsStartSendingPercent,
      rtsstopsendingpercent: this.settings.rtsStopSendingPercent,
      serialreceivebuffersize: this.settings.serialReceiveBufferSize,
      serialtransmitbuffersize: this.settings.serialTransmitBufferSize,
      serialspeed: this.settings.baudRate,
      baudrate: this.settings.baudRate,

      escapecharacter: this.settings.escapeCharacter,
      escapecharactercount: this.settings.maxEscapeCharacters,
      ledstyle: this.settings.ledStyle,
      maxcommandtimems: this.settings.maxCommandTimeMs,
      minescapetimems: this.settings.minEscapeTimeMs,
      wifissid: this.settings.wifiSsid,
      wifipassword: this.settings.wifiPassword ? '******' : '',

      debugserial: this.settings.debugSerial ? '1' : '0',
      debugbluetooth: this.settings.debugBluetooth ? '1' : '0',
      debugheap: this.settings.debugHeap ? '1' : '0'
    };

    if (key in lookup) {
      return { success: true, value: String(lookup[key]) };
    }

    return { success: false, error: `Unknown parameter '${name}'` };
  }

  private formatBluetoothSettings(): string {
    return [
      '--- Bluetooth Settings ---',
      `BluetoothConnectRetries: ${this.settings.btConnectRetries}`,
      `BluetoothConnectTimeoutMs: ${this.settings.btConnectTimeoutMs}`,
      `BluetoothEscapeCharacter: '${this.settings.btEscapeCharacter}'`,
      `BluetoothNickname: "${this.settings.btNickname}"`,
      `BluetoothPairedMac: ${this.settings.btPairedMac}`,
      `BluetoothPairedName: "${this.settings.btPairedName}"`,
      `BluetoothPin: "${this.settings.btPin}"`,
      `BluetoothRxSize: ${this.settings.btRxSize}`,
      `BluetoothTxSize: ${this.settings.btTxSize}`,
      `BluetoothType: ${this.settings.btType} (${['SPP (Serial Port Profile)', 'BLE (Low Energy)', 'OFF'][this.settings.btType]})`,
      'OK\r\n'
    ].join('\r\n');
  }

  private formatSerialSettings(): string {
    return [
      '--- Serial Settings ---',
      `SerialSpeed (baud): ${this.settings.baudRate}`,
      `FlowControl (CTS/RTS): ${this.settings.flowControl ? 'Enabled' : 'Disabled'}`,
      `InvertCts: ${this.settings.invertCts}`,
      `InvertRts: ${this.settings.invertRts}`,
      `PartialFrameTimeoutMs: ${this.settings.serialPartialFrameTimeoutMs}`,
      `RtsStartSendingPercent: ${this.settings.rtsStartSendingPercent}%`,
      `RtsStopSendingPercent: ${this.settings.rtsStopSendingPercent}%`,
      `SerialReceiveBufferSize: ${this.settings.serialReceiveBufferSize}`,
      `SerialTransmitBufferSize: ${this.settings.serialTransmitBufferSize}`,
      'OK\r\n'
    ].join('\r\n');
  }

  private formatSystemSettings(): string {
    return [
      '--- System Settings ---',
      `EscapeCharacter: '${this.settings.escapeCharacter}'`,
      `EscapeCharacterCount: ${this.settings.maxEscapeCharacters}`,
      `LedStyle: ${this.settings.ledStyle} (${['CLASSIC', 'SERIAL_TRAFFIC', 'ALL_OFF'][this.settings.ledStyle]})`,
      `MaxCommandTimeMs: ${this.settings.maxCommandTimeMs} ms`,
      `MinEscapeTimeMs: ${this.settings.minEscapeTimeMs} ms`,
      `WiFiSSID: "${this.settings.wifiSsid}"`,
      `WiFiPassword: "${this.settings.wifiPassword ? '******' : ''}"`,
      'OK\r\n'
    ].join('\r\n');
  }

  private formatDebugSettings(): string {
    return [
      '--- Debug Settings ---',
      `DebugSerial: ${this.settings.debugSerial}`,
      `DebugBluetooth: ${this.settings.debugBluetooth}`,
      `DebugHeap: ${this.settings.debugHeap}`,
      'OK\r\n'
    ].join('\r\n');
  }

  private formatAllSettings(): string {
    return [
      '================ SparkFun BlueSMiRF v2 Settings ================\r\n',
      this.formatBluetoothSettings(),
      this.formatSerialSettings(),
      this.formatSystemSettings(),
      this.formatDebugSettings()
    ].join('\r\n');
  }

  private formatAllParameters(): string {
    return [
      'Available Parameters (AT-<Param>=<value> / AT-<Param>?):',
      '  BluetoothConnectRetries, BluetoothConnectTimeoutMs, BluetoothEscapeCharacter',
      '  BluetoothNickname, BluetoothPairedMac, BluetoothPairedName, BluetoothPin',
      '  BluetoothRxSize, BluetoothTxSize, BluetoothType',
      '  FlowControl, InvertCts, InvertRts, PartialFrameTimeoutMs',
      '  RtsStartSendingPercent, RtsStopSendingPercent, SerialReceiveBufferSize',
      '  SerialTransmitBufferSize, SerialSpeed',
      '  EscapeCharacter, EscapeCharacterCount, LedStyle, MaxCommandTimeMs',
      '  MinEscapeTimeMs, WiFiSSID, WiFiPassword',
      '  DebugSerial, DebugBluetooth, DebugHeap',
      'OK\r\n'
    ].join('\r\n');
  }

  // Periodic LED service
  private startLedService(): void {
    if (this.ledInterval) clearInterval(this.ledInterval);

    this.ledInterval = setInterval(() => {
      this.pulsePhase = (this.pulsePhase + 1) % 100;

      if (this.settings.ledStyle === 2) {
        // LEDS_ALL_OFF
        this.connectLed = false;
        this.statusLed = false;
        this.notify();
        return;
      }

      if (this.mode === 'COMMAND') {
        // Fade both LEDs back and forth
        const duty = (Math.sin(this.pulsePhase * 0.2) + 1) / 2;
        this.connectLed = duty > 0.45;
        this.statusLed = duty > 0.45;
      } else if (this.mode === 'PAIRING') {
        // Alternate blink
        const flip = Math.floor(this.pulsePhase / 5) % 2 === 0;
        this.connectLed = flip;
        this.statusLed = !flip;
      } else if (this.mode === 'REBOOTING') {
        this.connectLed = true;
        this.statusLed = true;
      } else {
        // DATA MODE
        if (this.settings.ledStyle === 0) {
          // CLASSIC
          if (this.isConnected) {
            this.connectLed = true;
          } else {
            // Blink Connect LED at 1Hz (every 10 ticks @ 100ms)
            this.connectLed = Math.floor(this.pulsePhase / 5) % 2 === 0;
          }
        }
      }
      this.notify();
    }, 100);
  }
}

// Global singleton instance for the applet
export const blueSmiRFInstance = new BlueSMiRFEngine();
