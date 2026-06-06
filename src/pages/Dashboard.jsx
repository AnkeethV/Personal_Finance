import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import { Wallet, Receipt, TrendUp, Plus, ChartLineUp } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const { activeMonth } = useAppContext();
  const [metrics, setMetrics] = useState({ income: 0, expense: 0, savings: 0, invest: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [investmentBreakdown, setInvestmentBreakdown] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [budget, setBudget] = useState(0);

  useEffect(() => {
    const incomeData = storage.getAllIncomeEntries();
    const expenseData = storage.getAllExpenseEntries();
    const investmentData = storage.getAllInvestmentEntries();
    const categories = storage.getCategories();

    // Calculate totals
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);
    const totalInvest = investmentData.reduce((sum, item) => sum + item.amount, 0);
    const netSavings = totalIncome - totalExpense;

    setMetrics({ income: totalIncome, expense: totalExpense, savings: netSavings, invest: totalInvest });

    // Calculate Category Breakdown for Expenses
    const breakdown = {};
    expenseData.forEach(item => {
      if (!breakdown[item.typeId]) {
        const cat = categories.expense.find(c => c.id === item.typeId) || { name: 'Unknown', color: '#999' };
        breakdown[item.typeId] = { name: cat.name, color: cat.color, amount: 0 };
      }
      breakdown[item.typeId].amount += item.amount;
    });

    const breakdownArray = Object.values(breakdown).sort((a, b) => b.amount - a.amount);
    setCategoryBreakdown(breakdownArray);

    // Calculate Payment Method Breakdown for Expenses
    const payBreakdown = {};
    const paymentColors = {
      'UPI': '#4CAF50',
      'Credit Card': '#2196F3',
      'Debit Card': '#FF9800',
      'Cash': '#9C27B0',
      'Net Banking': '#607D8B',
      'Other': '#9E9E9E'
    };
    expenseData.forEach(item => {
      const pm = item.paymentMethod || 'Other';
      if (!payBreakdown[pm]) {
        payBreakdown[pm] = { name: pm, amount: 0, color: paymentColors[pm] || paymentColors['Other'] };
      }
      payBreakdown[pm].amount += item.amount;
    });
    
    const payBreakdownArray = Object.values(payBreakdown).sort((a, b) => b.amount - a.amount);
    setPaymentBreakdown(payBreakdownArray);

    // Calculate Breakdown for Investments
    const invBreakdown = {};
    investmentData.forEach(item => {
      if (!invBreakdown[item.typeId]) {
        const cat = categories.investment.find(c => c.id === item.typeId) || { name: 'Unknown', color: '#999' };
        invBreakdown[item.typeId] = { name: cat.name, color: cat.color, amount: 0 };
      }
      invBreakdown[item.typeId].amount += item.amount;
    });

    const invBreakdownArray = Object.values(invBreakdown).sort((a, b) => b.amount - a.amount);
    setInvestmentBreakdown(invBreakdownArray);

  }, [activeMonth]);

  const formatCurrency = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(paise / 100);
  };

  const getPercentage = (amount, total) => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100);
  };

  const maxCategoryAmount = categoryBreakdown.length > 0 ? categoryBreakdown[0].amount : 1;
  const maxInvAmount = investmentBreakdown.length > 0 ? investmentBreakdown[0].amount : 1;
  const maxPayAmount = paymentBreakdown.length > 0 ? paymentBreakdown[0].amount : 1;

  return (
    <div className="container dashboard-page">
      <div className="page-header">
        <h1 className="font-display">Finance Status</h1>
      </div>

      <div className="metrics-grid">
        <div className="metric-card metric-savings">
          <div className="metric-header">
            <span className="metric-icon"><TrendUp size={24} weight="duotone" /></span>
            <span className="metric-title">Net Savings</span>
          </div>
          <div className="metric-value font-mono">
            {metrics.savings >= 0 ? '+' : ''}{formatCurrency(metrics.savings)}
          </div>
        </div>

        <div className="metric-card metric-income">
          <div className="metric-header">
            <span className="metric-icon"><Wallet size={24} weight="duotone" /></span>
            <span className="metric-title">Total Income</span>
          </div>
          <div className="metric-value font-mono">
            {formatCurrency(metrics.income)}
          </div>
        </div>

        <div className="metric-card metric-expense">
          <div className="metric-header">
            <span className="metric-icon"><Receipt size={24} weight="duotone" /></span>
            <span className="metric-title">Total Expenses</span>
          </div>
          <div className="metric-value font-mono">
            {formatCurrency(metrics.expense)}
          </div>
        </div>

        <div className="metric-card metric-invest">
          <div className="metric-header">
            <span className="metric-icon"><ChartLineUp size={24} weight="duotone" /></span>
            <span className="metric-title">Investments</span>
          </div>
          <div className="metric-value font-mono">
            {formatCurrency(metrics.invest)}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-chart">
          <div className="section-header">
            <h2 className="font-display section-title">Category Breakdown</h2>
            <Link to="/expenses" className="view-all-link">View All</Link>
          </div>
          
          {categoryBreakdown.length === 0 ? (
            <div className="empty-chart">No expenses logged this month.</div>
          ) : (
            <div className="chart-container">
              {categoryBreakdown.map((cat, index) => {
                const widthPercent = Math.max((cat.amount / maxCategoryAmount) * 100, 2);
                return (
                  <div className="chart-row" key={index}>
                    <div className="chart-label">
                      <span className="chart-dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="chart-name">{cat.name}</span>
                      <span className="chart-amount font-mono">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="chart-bar-bg">
                      <div 
                        className="chart-bar-fill" 
                        style={{ width: `${widthPercent}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card dashboard-chart">
          <h2 className="font-display section-title">Investment Breakdown</h2>
          
          {investmentBreakdown.length === 0 ? (
            <div className="empty-chart">No investments logged this month.</div>
          ) : (
            <div className="chart-container">
              {investmentBreakdown.map((cat, index) => {
                const widthPercent = Math.max((cat.amount / maxInvAmount) * 100, 2);
                return (
                  <div className="chart-row" key={index}>
                    <div className="chart-label">
                      <span className="chart-dot" style={{ backgroundColor: cat.color }}></span>
                      <span className="chart-name">{cat.name}</span>
                      <span className="chart-amount font-mono">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="chart-bar-bg">
                      <div 
                        className="chart-bar-fill" 
                        style={{ width: `${widthPercent}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card dashboard-chart">
          <h2 className="font-display section-title">Payment Methods</h2>
          
          {paymentBreakdown.length === 0 ? (
            <div className="empty-chart">No payment data this month.</div>
          ) : (
            <div className="chart-container">
              {paymentBreakdown.map((pm, index) => {
                const widthPercent = Math.max((pm.amount / maxPayAmount) * 100, 2);
                return (
                  <div className="chart-row" key={index}>
                    <div className="chart-label">
                      <span className="chart-dot" style={{ backgroundColor: pm.color }}></span>
                      <span className="chart-name">{pm.name}</span>
                      <span className="chart-amount font-mono">{formatCurrency(pm.amount)}</span>
                    </div>
                    <div className="chart-bar-bg">
                      <div 
                        className="chart-bar-fill" 
                        style={{ width: `${widthPercent}%`, backgroundColor: pm.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
