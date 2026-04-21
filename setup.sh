#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────
#  Luma — Setup Script
# ─────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}"
echo "  ██╗     ██╗   ██╗███╗   ███╗ █████╗ "
echo "  ██║     ██║   ██║████╗ ████║██╔══██╗"
echo "  ██║     ██║   ██║██╔████╔██║███████║"
echo "  ██║     ██║   ██║██║╚██╔╝██║██╔══██║"
echo "  ███████╗╚██████╔╝██║ ╚═╝ ██║██║  ██║"
echo "  ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${BOLD}  IPTV Streaming App for Android TV & FireStick${NC}"
echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# ── Step 1: Install server dependencies ──────────────────
echo -e "${CYAN}[1/4]${NC} Installing server dependencies..."
if [ -d "server" ]; then
  cd server
  npm install
  cd ..
  echo -e "${GREEN}  ✓ Server dependencies installed${NC}"
else
  echo -e "${RED}  ✗ /server directory not found!${NC}"
  exit 1
fi

echo ""

# ── Step 2: Install app dependencies ────────────────────
echo -e "${CYAN}[2/4]${NC} Installing app dependencies..."
npm install
echo -e "${GREEN}  ✓ App dependencies installed${NC}"

echo ""

# ── Step 3: Create .env if it doesn't exist ─────────────
echo -e "${CYAN}[3/4]${NC} Checking environment file..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}  ✓ Created .env from .env.example${NC}"
    echo -e "${YELLOW}  → Edit .env to set your FireStick IP address${NC}"
  else
    echo -e "${YELLOW}  ⚠ No .env.example found — skipping${NC}"
  fi
else
  echo -e "${GREEN}  ✓ .env already exists${NC}"
fi

echo ""

# ── Step 4: Check ADB ───────────────────────────────────
echo -e "${CYAN}[4/4]${NC} Checking ADB installation..."
if command -v adb &> /dev/null; then
  ADB_VERSION=$(adb version | head -n 1)
  echo -e "${GREEN}  ✓ ADB found: ${ADB_VERSION}${NC}"
else
  echo -e "${RED}  ✗ ADB not found!${NC}"
  echo ""
  echo -e "${YELLOW}  ADB is required to deploy to Android TV / FireStick.${NC}"
  echo -e "${YELLOW}  Install it via one of these methods:${NC}"
  echo ""
  echo "    ${BOLD}Option 1: Android Studio${NC}"
  echo "      Install Android Studio → SDK Manager → SDK Platform-Tools"
  echo "      Add to PATH: <Android SDK>/platform-tools"
  echo ""
  echo "    ${BOLD}Option 2: Standalone Platform Tools${NC}"
  echo "      Windows: https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
  echo "      macOS:   brew install android-platform-tools"
  echo "      Linux:   sudo apt install android-tools-adb"
  echo ""
fi

# ── Done ─────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo ""
echo -e "${GREEN}${BOLD}  ✓ You're ready to build Luma!${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo ""
echo -e "    ${CYAN}1.${NC} Edit ${BOLD}.env${NC} with your FireStick IP"
echo -e "    ${CYAN}2.${NC} Run  ${BOLD}npm start${NC}  to launch server + Metro"
echo -e "    ${CYAN}3.${NC} Run  ${BOLD}npm run android-tv${NC}  to deploy to your device"
echo ""
echo -e "  ${BOLD}Other commands:${NC}"
echo -e "    ${CYAN}npm run server${NC}        — Run only the proxy server"
echo -e "    ${CYAN}npm run build-apk${NC}     — Build release APK"
echo -e "    ${CYAN}npm run install-firestick${NC} — Install APK on FireStick"
echo ""
echo "─────────────────────────────────────────────────────────"
echo ""
