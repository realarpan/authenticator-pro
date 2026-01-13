const express = require('express');
const cors = require('cors');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'accounts.json');

async function loadAccounts() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveAccounts(accounts) {
  await fs.writeFile(DATA_FILE, JSON.stringify(accounts, null, 2));
}

app.get('/api/accounts', async (req, res) => {
  const accounts = await loadAccounts();
  const safeAccounts = accounts.map(({ secret, ...rest }) => rest);
  res.json(safeAccounts);
});

app.post('/api/accounts/generate', async (req, res) => {
  try {
    const { issuer, accountName } = req.body;
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${accountName})`,
      issuer: issuer,
    });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.json({
      secret: secret.base32,
      qrCode,
      manualEntry: secret.base32,
      accountName,
      issuer,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/verify', async (req, res) => {
  try {
    const { secret, token } = req.body;
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2,
    });
    if (verified) {
      const accounts = await loadAccounts();
      const newAccount = {
        id: Date.now(),
        issuer: req.body.issuer || 'Account',
        accountName: req.body.accountName,
        secret: secret,
        createdAt: new Date().toISOString(),
      };
      accounts.push(newAccount);
      await saveAccounts(accounts);
      res.json({ success: true, account: { ...newAccount, secret: undefined } });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/token', async (req, res) => {
  try {
    const { secret } = req.body;
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
    });
    const timeRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    res.json({ token, timeRemaining });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const accounts = await loadAccounts();
    const filtered = accounts.filter((acc) => acc.id !== parseInt(req.params.id));
    await saveAccounts(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/export', async (req, res) => {
  try {
    const accounts = await loadAccounts();
    res.json({ data: accounts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/import', async (req, res) => {
  try {
    const { data } = req.body;
    const accounts = await loadAccounts();
    const imported = data.filter((newAcc) => !accounts.some((acc) => acc.id === newAcc.id));
    const merged = [...accounts, ...imported];
    await saveAccounts(merged);
    res.json({ success: true, imported: imported.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 API ready at http://localhost:${PORT}/api`);
});
