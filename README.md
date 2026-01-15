# authenticator-pro
A powerful multi-factor authenticator app similar to Google Authenticator. Generate TOTP/HOTP codes, manage accounts, and secure your digital identity. Full-stack TypeScript app with React frontend and Node.js backend. PWA-ready for mobile use.

## Features

- 🔐 Generate TOTP/HOTP codes
- 📱 PWA-ready for mobile devices
- 🎨 Beautiful React frontend
- ⚡ Fast Node.js backend
- 🔒 End-to-end encryption
- 🌙 Dark mode support
- 📊 Account analytics
- 🔄 Real-time synchronization

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/realarpan/authenticator-pro.git
   cd authenticator-pro
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   npm install
   cd apps/backend && npm install
   cd ../frontend && npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Add Account**: Click the "+" button to add a new account
2. **Scan QR Code**: Use your device camera to scan the QR code
3. **Verify Code**: Enter the code shown in your authenticator app
4. **Backup**: Save your backup codes in a secure location
5. **Manage**: Edit or delete accounts as needed
