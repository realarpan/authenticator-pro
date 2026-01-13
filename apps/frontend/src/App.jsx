import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000';

const App = () => {
  const [accounts, setAccounts] = useState([]);
  const [view, setView] = useState('accounts');
  const [tokens, setTokens] = useState({});
  const [darkMode, setDarkMode] = useState(true);
  const [newAccountData, setNewAccountData] = useState({issuer: '', accountName: '', secret: '', qrCode: ''});
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refreshTokens(), 1000);
    return () => clearInterval(interval);
  }, [accounts]);

  const loadAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/accounts`);
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const refreshTokens = async () => {
    try {
      const newTokens = {};
      for (const account of accounts) {
        const response = await axios.post(`${API_BASE}/api/accounts/token`, {secret: account.secret});
        newTokens[account.id] = response.data;
      }
      setTokens(newTokens);
    } catch (err) {
      // Silently fail
    }
  };

  const generateNewAccount = async () => {
    if (!newAccountData.issuer || !newAccountData.accountName) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/accounts/generate`, newAccountData);
      setNewAccountData({...newAccountData, secret: response.data.secret, qrCode: response.data.qrCode});
    } catch (err) {
      setError('Failed to generate account');
    }
    setLoading(false);
  };

  const verifyAndSaveAccount = async () => {
    if (!verificationToken) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/accounts/verify`, {
        secret: newAccountData.secret,
        token: verificationToken,
        issuer: newAccountData.issuer,
        accountName: newAccountData.accountName
      });
      setNewAccountData({issuer: '', accountName: '', secret: '', qrCode: ''});
      setVerificationToken('');
      setView('accounts');
      await loadAccounts();
    } catch (err) {
      setError('Verification failed');
    }
    setLoading(false);
  };

  const deleteAccount = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      await axios.delete(`${API_BASE}/api/accounts/${id}`);
      await loadAccounts();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const exportData = async () => {
    try {
      const response = await axios.post(`${API_BASE}/api/accounts/export`);
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `authenticator-backup-${Date.now()}.json`;
      link.click();
    } catch (err) {
      setError('Export failed');
    }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="header">
        <div className="header-content">
          <h1>🔐 Authenticator Pro</h1>
          <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="container">
        {error && <div className="error-alert">{error}</div>}
        <div className="nav-tabs">
          <button className={`tab-btn ${view === 'accounts' ? 'active' : ''}`} onClick={() => setView('accounts')}>
            📱 Accounts ({accounts.length})
          </button>
          <button className={`tab-btn ${view === 'add' ? 'active' : ''}`} onClick={() => setView('add')}>
            ➕ Add Account
          </button>
          <button className="tab-btn export-btn" onClick={exportData}>📥 Export</button>
        </div>

        {view === 'accounts' && (
          <div className="accounts-view">
            {accounts.length === 0 ? (
              <div className="empty-state"><p>No accounts yet</p></div>
            ) : (
              <div className="accounts-grid">
                {accounts.map((account) => (
                  <div key={account.id} className="account-card">
                    <div className="card-header">
                      <h3>{account.issuer}</h3>
                      <button className="delete-btn" onClick={() => deleteAccount(account.id)}>✕</button>
                    </div>
                    <p className="card-name">{account.accountName}</p>
                    <div className="token-display">
                      {tokens[account.id] && (
                        <>
                          <code className="token">{tokens[account.id].token}</code>
                          <small>{tokens[account.id].timeRemaining}s</small>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'add' && (
          <div className="add-account-view">
            {!newAccountData.secret ? (
              <div className="form-section">
                <h2>Add New Account</h2>
                <div className="form-group">
                  <label>Issuer</label>
                  <input type="text" placeholder="e.g., GitHub" value={newAccountData.issuer} onChange={(e) => setNewAccountData({...newAccountData, issuer: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Account Name</label>
                  <input type="text" placeholder="e.g., yourname@email.com" value={newAccountData.accountName} onChange={(e) => setNewAccountData({...newAccountData, accountName: e.target.value})} />
                </div>
                <button className="btn-primary" onClick={generateNewAccount} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            ) : (
              <div className="form-section">
                <h2>Scan & Verify</h2>
                {newAccountData.qrCode && (
                  <div className="qr-section">
                    <img src={newAccountData.qrCode} alt="QR Code" className="qr-code" />
                    <p>Manual Entry:</p>
                    <code className="manual-entry">{newAccountData.secret}</code>
                  </div>
                )}
                <div className="form-group">
                  <label>Enter 6-digit code</label>
                  <input type="text" placeholder="000000" maxLength="6" value={verificationToken} onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </div>
                <button className="btn-primary" onClick={verifyAndSaveAccount} disabled={loading || verificationToken.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify & Save'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>🔒 Your accounts are stored securely</p>
      </footer>
    </div>
  );
};

export default App;
