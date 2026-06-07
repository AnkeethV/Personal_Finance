import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import './Settings.css';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setProfile(storage.getProfile());
    setSettings(storage.getSettings());
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    storage.setProfile(profile);
    storage.setSettings(settings);
    setSavedMessage('Settings saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleExport = () => {
    const dataStr = storage.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        for (const [key, value] of Object.entries(importedData)) {
          if (key.startsWith('paisa_')) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        }
        alert('Data imported successfully! App will now reload.');
        window.location.reload();
      } catch (err) {
        alert('Failed to import data. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (!profile || !settings) return <div>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <div className="settings-grid">
        <div className="card">
          <h2 className="font-display">Profile</h2>
          
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              className="input" 
              name="name" 
              value={profile.name} 
              onChange={handleProfileChange} 
              placeholder="Your Name" 
            />
          </div>

          <div className="form-group">
            <label>Monthly Budget Goal (₹)</label>
            <input 
              type="number" 
              className="input" 
              name="monthlyBudget" 
              value={profile.monthlyBudget || ''} 
              onChange={handleProfileChange}
              placeholder="e.g. 50000"
            />
          </div>

          <div className="form-group">
            <label>Employment Type</label>
            <select 
              className="input" 
              name="employmentType" 
              value={profile.employmentType} 
              onChange={handleProfileChange}
            >
              <option value="salaried">Salaried</option>
              <option value="self-employed">Self-Employed</option>
              <option value="both">Both</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Preferred Tax Regime</label>
            <select 
              className="input" 
              name="taxRegime" 
              value={profile.taxRegime} 
              onChange={handleProfileChange}
            >
              <option value="new">New Regime</option>
              <option value="old">Old Regime</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display">Appearance & Preferences</h2>

          <div className="form-group">
            <label>Currency Display Format</label>
            <input 
              type="text" 
              className="input" 
              value="Indian (₹1,00,000)" 
              disabled 
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            />
          </div>

          <div className="form-group">
            <label>Financial Year Start</label>
            <input 
              type="text" 
              className="input" 
              value="April (Indian FY)" 
              disabled 
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            />
          </div>

          <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: '16px' }}>
            Save Settings
          </button>
          
          {savedMessage && <p className="success-msg">{savedMessage}</p>}
        </div>

        <div className="card">
          <h2 className="font-display">Data Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Backup your data or restore from a previous backup. All data is stored locally in your browser.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              Export Backup (JSON)
            </button>
            
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Import Backup
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
