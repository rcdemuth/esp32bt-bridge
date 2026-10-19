export type HardwareVariant = 'pth' | 'headers' | 'jst';

export type BluetoothRadioType = 0 | 1 | 2; // 0 = SPP, 1 = BLE, 2 = OFF
export type LedStyleType = 0 | 1 | 2; // 0 = CLASSIC, 1 = SERIAL_TRAFFIC, 2 = ALL_OFF

export interface BlueSMiRFSettings {
  // Bluetooth parameters ('B')
  btConnectRetries: number;       // default 5 (0-100)
  btConnectTimeoutMs: number;     // default 3000 (100-25000)
  btEscapeCharacter: string;      // default '+'
  btNickname: string;             // default "BlueSMiRF-ABCD" (max 29 chars)
  btPairedMac: string;            // MAC address "XX:XX:XX:XX:XX:XX"
  btPairedName: string;           // max 50 chars
  btPin: string;                  // default "1234" (max 4 chars)
  btRxSize: number;               // default 10240
  btTxSize: number;               // default 10240
  btType: BluetoothRadioType;     // 0=SPP, 1=BLE, 2=OFF
  btReadTaskCore: number;
  btReadTaskPriority: number;
  btWriteTaskCore: number;
  btWriteTaskPriority: number;

  // Serial parameters ('S')
  flowControl: boolean;           // default false
  invertCts: boolean;             // default false
  invertRts: boolean;             // default false
  rtsStartSendingPercent: number; // default 25 (1-99)
  rtsStopSendingPercent: number;  // default 5 (1-99)
  serialReceiveBufferSize: number;// default 512000
  serialTransmitBufferSize: number;// default 512000
  baudRate: number;               // default 115200 (SerialSpeed)
  serialPartialFrameTimeoutMs: number; // default 50

  // System parameters ('Y')
  escapeCharacter: string;        // default '$'
  maxEscapeCharacters: number;    // default 3
  ledStyle: LedStyleType;         // default 0 (CLASSIC)
  maxCommandTimeMs: number;       // default 60000
  minEscapeTimeMs: number;        // default 2000
  wifiSsid: string;
  wifiPassword: string;

  // Debug parameters ('D')
  debugSerial: boolean;
  debugBluetooth: boolean;
  debugHeap: boolean;
}

export const DEFAULT_SETTINGS: BlueSMiRFSettings = {
  btConnectRetries: 5,
  btConnectTimeoutMs: 3000,
  btEscapeCharacter: '+',
  btNickname: 'BlueSMiRF-4B2E',
  btPairedMac: '00:00:00:00:00:00',
  btPairedName: '',
  btPin: '1234',
  btRxSize: 10240,
  btTxSize: 10240,
  btType: 0,
  btReadTaskCore: 1,
  btReadTaskPriority: 1,
  btWriteTaskCore: 1,
  btWriteTaskPriority: 1,

  flowControl: false,
  invertCts: false,
  invertRts: false,
  rtsStartSendingPercent: 25,
  rtsStopSendingPercent: 5,
  serialReceiveBufferSize: 512000,
  serialTransmitBufferSize: 512000,
  baudRate: 115200,
  serialPartialFrameTimeoutMs: 50,

  escapeCharacter: '$',
  maxEscapeCharacters: 3,
  ledStyle: 0,
  maxCommandTimeMs: 60000,
  minEscapeTimeMs: 2000,
  wifiSsid: '',
  wifiPassword: '',

  debugSerial: false,
  debugBluetooth: false,
  debugHeap: false,
};

export const SUPPORTED_BAUD_RATES = [
  2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600
] as const;

export type BlueSMiRFMode = 'DATA' | 'COMMAND' | 'PAIRING' | 'REBOOTING';

export interface TerminalLine {
  id: string;
  timestamp: string;
  type: 'tx' | 'rx' | 'system' | 'error' | 'info';
  text: string;
  source?: 'serial' | 'bluetooth';
}
