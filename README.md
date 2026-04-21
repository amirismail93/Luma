# Luma

**IPTV Streaming App for Android TV & Amazon FireStick**

A Netflix-style IPTV client built with React Native (tvOS fork), featuring Live TV, Movies, Series, a full video player, search, favorites, and multi-profile support. Designed for D-pad navigation on big screens.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Runtime for Metro & proxy server |
| **npm** | 9+ | Package manager |
| **Java JDK** | 17 | Android build toolchain |
| **Android Studio** | Latest | SDK, emulator, Gradle |
| **Android SDK** | API 31+ | Target platform |
| **ADB** | Latest | Deploy to physical devices |

> **Android Studio** must have the Android TV system image installed if you want to use an emulator. For FireStick, only ADB is needed.

---

## Quick Start

### 1. Clone & Setup

```bash
git clone <repo-url> luma
cd luma
bash setup.sh
```

Or manually:

```bash
# Install all dependencies
npm run setup

# Create your environment file
cp .env.example .env
# Edit .env with your FireStick IP
```

### 2. Run Locally (Server + Metro)

```bash
npm start
```

This launches both the **Luma proxy server** (port 3001) and the **Metro bundler** concurrently with color-coded output.

### 3. Deploy to Device

In a separate terminal:

```bash
# Android TV emulator
npm run android

# Physical Android TV / FireStick (via ADB)
npm run android-tv
```

---

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `concurrently server + metro` | Run proxy server and Metro bundler together with labeled output |
| `npm run metro` | `react-native start` | Run only the Metro bundler |
| `npm run server` | `ts-node server/src/index.ts` | Run only the Luma proxy server |
| `npm run android` | `react-native run-android` | Build & deploy to default Android device/emulator |
| `npm run android-tv` | `react-native run-android --device` | Build & deploy to connected Android TV / FireStick |
| `npm run build-apk` | `gradlew assembleRelease` | Build a release APK and copy it to `/dist` |
| `npm run install-firestick` | `adb install -r dist/luma-release.apk` | Install the latest APK on a connected FireStick |
| `npm run setup` | Install deps for server + app | First-time project setup |
| `npm run clean` | `gradlew clean` | Clean Android build cache |
| `npm run lint` | `eslint .` | Run the linter |

---

## Environment Variables

Create a `.env` file at the project root (see `.env.example`):

```env
# Port for the Luma proxy server
SERVER_PORT=3001

# FireStick / Android TV IP (for ADB WiFi)
ADB_DEVICE_IP=192.168.1.100
```

---

## Building a Release APK

```bash
npm run build-apk
```

The signed APK will be copied to `dist/luma-release.apk`.

> **Note:** You need a signing config in `android/app/build.gradle` for a proper release build. For debug sideloading, `assembleDebug` works without signing.

---

## Sideloading to Amazon FireStick

### Step 1: Enable Developer Options on FireStick

1. Go to **Settings → My Fire TV → About**
2. Click on **Fire TV Stick** 7 times to enable Developer Options
3. Go back to **Settings → My Fire TV → Developer Options**
4. Enable **ADB Debugging**
5. Enable **Apps from Unknown Sources**

### Step 2: Find Your FireStick IP

1. Go to **Settings → My Fire TV → About → Network**
2. Note the IP address (e.g., `192.168.1.100`)
3. Update `ADB_DEVICE_IP` in your `.env` file

### Step 3: Connect ADB over WiFi

```bash
# Connect to the FireStick
adb connect 192.168.1.100:5555

# Verify connection
adb devices
# Should show: 192.168.1.100:5555    device
```

### Step 4: Install the APK

```bash
# Option A: Build and install in one go
npm run build-apk
npm run install-firestick

# Option B: Deploy directly via React Native
npm run android-tv
```

### Step 5: Launch

The app will appear in **Settings → Applications → Manage Installed Applications** on your FireStick. You can also find it via a sideload launcher app.

---

## Connecting ADB over WiFi (Step by Step)

If your FireStick and dev machine are on the **same WiFi network**:

```bash
# 1. Connect (first time — accept the prompt on your TV)
adb connect <FIRESTICK_IP>:5555

# 2. Verify
adb devices

# 3. If connection drops, reconnect
adb disconnect
adb connect <FIRESTICK_IP>:5555
```

**Troubleshooting ADB:**

- **"unable to connect"** → Ensure ADB Debugging is ON in FireStick Developer Options
- **"unauthorized"** → A prompt should appear on the TV — select "Always allow"
- **Connection drops** → FireStick may go to sleep; wake it first, then reconnect
- **Multiple devices** → Use `adb -s <DEVICE_IP>:5555 install ...` to target a specific device

---

## Project Structure

```
luma/
├── android/              # Android native project (Gradle)
├── server/               # Luma proxy server (Express + TypeScript)
│   └── src/
│       ├── index.ts      # API routes
│       └── portal.ts     # Stalker portal client
├── src/
│   ├── components/       # Reusable UI (ContentCard, HeroBanner, etc.)
│   ├── hooks/            # React Query data-fetching hooks
│   ├── navigation/       # React Navigation (tabs + stack)
│   ├── screens/          # All app screens
│   ├── services/         # API client, MMKV storage
│   ├── store/            # Zustand stores (profiles, favorites, history)
│   └── theme/            # Colors, typography, spacing
├── App.tsx               # Root component with QueryClientProvider
├── index.js              # Entry point
├── .env.example          # Environment template
├── setup.sh              # One-command setup script
└── package.json          # Scripts, dependencies
```

---

## Tech Stack

- **React Native** (tvOS fork) — UI framework for Android TV
- **React Navigation** — Stack + bottom tab navigation
- **React Query** — Data fetching and caching
- **Zustand + MMKV** — State management with persistent storage
- **react-native-video** — Video playback (ExoPlayer on Android)
- **Express** — Proxy server for Stalker portal APIs
- **TypeScript** — End-to-end type safety

---

## License

Private project. All rights reserved.
