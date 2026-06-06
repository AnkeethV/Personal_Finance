import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import './Tax.css';

export default function Tax() {
  const { activeMonth } = useAppContext();
  const [regime, setRegime] = useState('new');
  
  const [taxData, setTaxData] = useState({
    fyString: '',
    grossIncome: 0,
    total80C: 0,
    standardDeduction: 50000,
  });

  const [manualData, setManualData] = useState({
    deduction80D: 0,
    deductionHRA: 0,
    stcg: 0,
    ltcg: 0
  });

  useEffect(() => {
    // Load profile preference
    const profile = storage.getProfile();
    if (profile && profile.taxRegime) {
      setRegime(profile.taxRegime);
    }
  }, []);

  useEffect(() => {
    calculateFYData();
  }, [activeMonth]);

  const handleRegimeChange = (newRegime) => {
    setRegime(newRegime);
    const profile = storage.getProfile() || {};
    profile.taxRegime = newRegime;
    storage.setProfile(profile);
  };

  const calculateFYData = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;
    const fyString = `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`;

    let totalIncome = 0;
    let totalInvestments = 0;

    // Loop through April to March
    for (let m = 4; m <= 15; m++) {
      const calcYear = m > 12 ? fyEndYear : fyStartYear;
      const calcMonth = m > 12 ? m - 12 : m;
      const monthStr = `${calcYear}-${String(calcMonth).padStart(2, '0')}`;
      
      const incomes = storage.getIncomeEntries(monthStr);
      totalIncome += incomes.reduce((sum, e) => sum + e.amount, 0);

      const investments = storage.getInvestmentEntries(monthStr);
      // Assuming all tracked investments fall under 80C for simplicity in this MVP
      totalInvestments += investments.reduce((sum, e) => sum + e.amount, 0);
    }

    const savedManual = storage.getTaxData(fyString);
    setManualData(savedManual);

    setTaxData({
      fyString,
      grossIncome: totalIncome / 100, // convert paise to INR
      total80C: totalInvestments / 100,
      standardDeduction: 50000 // Fixed for salaried
    });
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualData(prev => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleManualSave = () => {
    storage.saveTaxData(taxData.fyString, manualData);
  };

  const calculateTax = () => {
    const { grossIncome, total80C, standardDeduction } = taxData;
    
    let deductions = standardDeduction;
    if (regime === 'old') {
      deductions += Math.min(total80C, 150000); // 80C cap is 1.5L
      deductions += manualData.deduction80D;
      deductions += manualData.deductionHRA;
    }

    let taxableIncome = Math.max(0, grossIncome - deductions);
    let tax = 0;
    
    // Calculate Capital Gains Tax independently
    const stcgTax = manualData.stcg * 0.20; // 20% flat STCG
    const ltcgTax = Math.max(0, manualData.ltcg - 125000) * 0.125; // 12.5% over 1.25L
    const totalCgTax = stcgTax + ltcgTax;

    if (regime === 'old') {
      // Basic Old Regime Slabs (without cess for simplicity)
      if (taxableIncome > 1000000) {
        tax += (taxableIncome - 1000000) * 0.30;
        taxableIncome = 1000000;
      }
      if (taxableIncome > 500000) {
        tax += (taxableIncome - 500000) * 0.20;
        taxableIncome = 500000;
      }
      if (taxableIncome > 250000) {
        tax += (taxableIncome - 250000) * 0.05;
      }
      
      // 87A Rebate: if taxable <= 5L, tax is 0
      if (grossIncome - deductions <= 500000) {
        tax = 0;
      }
    } else {
      // New Regime Slabs (FY 2023-24 onwards)
      if (taxableIncome > 1500000) {
        tax += (taxableIncome - 1500000) * 0.30;
        taxableIncome = 1500000;
      }
      if (taxableIncome > 1200000) {
        tax += (taxableIncome - 1200000) * 0.20;
        taxableIncome = 1200000;
      }
      if (taxableIncome > 900000) {
        tax += (taxableIncome - 900000) * 0.15;
        taxableIncome = 900000;
      }
      if (taxableIncome > 600000) {
        tax += (taxableIncome - 600000) * 0.10;
        taxableIncome = 600000;
      }
      if (taxableIncome > 300000) {
        tax += (taxableIncome - 300000) * 0.05;
      }
      
      // 87A Rebate: if taxable <= 7L, tax is 0
      if (grossIncome - deductions <= 700000) {
        tax = 0;
      }
    }

    // Add capital gains tax back after rebate
    tax += totalCgTax;

    // Add 4% Health & Education Cess
    if (tax > 0) {
      tax = tax * 1.04;
    }

    return {
      deductions,
      taxableIncome: Math.max(0, grossIncome - deductions),
      cgTax: totalCgTax,
      tax: Math.round(tax)
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const results = calculateTax();

  return (
    <div className="container tax-page">
      <div className="tax-header">
        <h1 className="font-display">Tax Computation</h1>
        <div className="fy-badge">{taxData.fyString}</div>
      </div>

      <div className="regime-toggle">
        <button 
          className={`toggle-btn ${regime === 'new' ? 'active' : ''}`}
          onClick={() => handleRegimeChange('new')}
        >
          New Tax Regime
        </button>
        <button 
          className={`toggle-btn ${regime === 'old' ? 'active' : ''}`}
          onClick={() => handleRegimeChange('old')}
        >
          Old Tax Regime
        </button>
      </div>

      <div className="tax-grid">
        <div className="card tax-card">
          <div className="tax-card-header">Income & Deductions</div>
          
          <div className="tax-row">
            <span className="label">Gross Total Income</span>
            <span className="amount">{formatCurrency(taxData.grossIncome)}</span>
          </div>
          
          <div className="tax-row deduction">
            <span className="label">Standard Deduction</span>
            <span className="amount">-{formatCurrency(taxData.standardDeduction)}</span>
          </div>

          {regime === 'old' && (
            <div className="tax-row deduction">
              <span className="label">80C Investments (Max 1.5L)</span>
              <span className="amount">-{formatCurrency(Math.min(taxData.total80C, 150000))}</span>
            </div>
          )}
          {regime === 'old' && manualData.deduction80D > 0 && (
            <div className="tax-row deduction">
              <span className="label">80D (Medical Ins.)</span>
              <span className="amount">-{formatCurrency(manualData.deduction80D)}</span>
            </div>
          )}
          {regime === 'old' && manualData.deductionHRA > 0 && (
            <div className="tax-row deduction">
              <span className="label">HRA Exemption</span>
              <span className="amount">-{formatCurrency(manualData.deductionHRA)}</span>
            </div>
          )}

          <div className="tax-row highlight">
            <span className="label">Net Taxable Income</span>
            <span className="amount">{formatCurrency(results.taxableIncome)}</span>
          </div>
        </div>

        <div className="card tax-card">
          <div className="tax-card-header">Tax Calculation</div>
          
          <div className="tax-row">
            <span className="label">Tax as per slabs</span>
            <span className="amount">{formatCurrency((results.tax - results.cgTax) / 1.04)}</span>
          </div>
          
          {results.cgTax > 0 && (
            <div className="tax-row">
              <span className="label">Capital Gains Tax</span>
              <span className="amount">{formatCurrency(results.cgTax)}</span>
            </div>
          )}
          
          <div className="tax-row">
            <span className="label">Health & Education Cess (4%)</span>
            <span className="amount">{formatCurrency(results.tax - (results.tax / 1.04))}</span>
          </div>

          <div className="tax-row highlight">
            <span className="label">Total Tax Liability</span>
            <span className={`amount ${results.tax === 0 ? 'zero-tax' : ''}`}>
              {formatCurrency(results.tax)}
            </span>
          </div>
        </div>
      </div>

      <div className="card manual-adjustments">
        <div className="tax-card-header">Manual Adjustments ({taxData.fyString})</div>
        <div className="form-grid">
          <div className="form-group">
            <label>80D Medical (₹)</label>
            <input type="number" className="input" name="deduction80D" value={manualData.deduction80D || ''} onChange={handleManualChange} onBlur={handleManualSave} />
            <small className="hint">Only for Old Regime</small>
          </div>
          <div className="form-group">
            <label>HRA Exemption (₹)</label>
            <input type="number" className="input" name="deductionHRA" value={manualData.deductionHRA || ''} onChange={handleManualChange} onBlur={handleManualSave} />
            <small className="hint">Only for Old Regime</small>
          </div>
          <div className="form-group">
            <label>Realized STCG (₹)</label>
            <input type="number" className="input" name="stcg" value={manualData.stcg || ''} onChange={handleManualChange} onBlur={handleManualSave} />
            <small className="hint">Taxed flat 20%</small>
          </div>
          <div className="form-group">
            <label>Realized LTCG (₹)</label>
            <input type="number" className="input" name="ltcg" value={manualData.ltcg || ''} onChange={handleManualChange} onBlur={handleManualSave} />
            <small className="hint">Taxed 12.5% over 1.25L</small>
          </div>
        </div>
      </div>

      <div className="card tax-summary-banner">
        <div className="summary-details">
          <h3>Tax Summary for {taxData.fyString}</h3>
          <p>
            {results.tax === 0 
              ? 'Great! Your income is fully exempt from tax under Section 87A.' 
              : `You are liable to pay ${formatCurrency(results.tax)} under the ${regime === 'new' ? 'New' : 'Old'} Regime.`}
          </p>
        </div>
        <div className="final-tax">
          <div className="label">Estimated Tax</div>
          <div className={`amount font-mono ${results.tax === 0 ? 'zero-tax' : ''}`}>
            {formatCurrency(results.tax)}
          </div>
        </div>
      </div>

    </div>
  );
}
