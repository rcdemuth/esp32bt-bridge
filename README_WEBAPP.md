# SparkFun BlueSMiRF v2 - React Application

A full-featured modern React application companion, emulator, and visual configurator for the **SparkFun BlueSMiRF v2** wireless Bluetooth® serial link.

## Overview

The SparkFun BlueSMiRF v2 is a wireless serial link powered by the Espressif ESP32-PICO-MINI-02. This React web application emulates the BlueSMiRF v2 firmware, provides an interactive serial terminal with live AT command execution, offers a visual configuration manager, a virtual wireless dual-bridge testbench (simulating GPS/sensor data over Bluetooth to a SerLCD 16x2 display), interactive Three.js 3D CAD board viewers, pinouts, and complete hookup guides.

## Features

- **Interactive VT100 Serial & AT Command Terminal**:
  - Emulates authentic BlueSMiRF-v2 AT command firmware parser (`$$$`, `AT`, `AT?`, `ATA`, `ATB`, `ATS`, `ATY`, `ATD`, `ATV`, `ATM`, `ATP`, `ATW`, `ATX`, `ATZ`, `ATF`, `ATC`, `ATU`).
  - Realistic LED emulation: CONNECT (Blue) and STATUS (Green) with authentic blinking and fade effects for Classic, Traffic, and Command modes.
  - Interactive PAIR push button with tap, 3-second hold (pairing), and 8-second hold (factory reset).
  - Non-Volatile Memory (NVM) persistence via localStorage for saved parameters across reboots.

- **Visual Parameter Configurator**:
  - GUI for Bluetooth settings (nickname, protocol, PIN, buffers, timeouts).
  - GUI for Serial settings (baud rates from 2400 to 921600 bps, hardware flow control CTS/RTS, thresholds).
  - GUI for System settings (escape characters, quiet guard timers, LED styles, Wi-Fi OTA credentials).
  - Live batch AT command sequence generator with one-click "Apply to BlueSMiRF" and clipboard export.

- **Virtual Wireless Dual-Bridge Simulator**:
  - Simulates point-to-point wireless transmission between two BlueSMiRF v2 modules.
  - Streaming data sources: SparkFun GPS/GNSS NMEA `$GNGGA`, BME280 Environmental sensor JSON, or Arduino telemetry.
  - Configurable RF latency and signal strength (RSSI dBm).
  - Framing error detection on UART baud rate mismatches.
  - Live SparkFun SerLCD 16x2 alphanumeric display emulation.

- **3D CAD & Pinout Explorer**:
  - Interactive Three.js 3D viewer for all 3 hardware variants:
    - **PTH (WRL-24113)**
    - **Headers (WRL-23287)**
    - **JST-GH (WRL-30414)**
  - Pinout explorer with detailed logic-level and electrical specifications for GND, CTS, VCC, TXO, RXI, RTS.
  - Solder jumpers guide (PWR bypass and BTN disable jumpers).

- **Hardware Bridge (Web Serial & Web Bluetooth)**:
  - Connect physical BlueSMiRF v2 hardware directly via browser Web Serial API or Web Bluetooth API.

- **Comprehensive Hookup Guides & Documentation**:
  - Detailed assembly instructions, wiring diagrams (Arduino Pro Mini, IoT RedBoard, SerLCD, FTDI), troubleshooting, and FAQs.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Three.js (3D GLTF/GLB models & Orbit Controls)
- Lucide React Icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
