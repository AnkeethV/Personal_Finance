import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import { Wallet, Receipt, TrendUp, Plus, ChartLineUp, Bank } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import PercentageStackedBar from '../components/PercentageStackedBar';
import './Dashboard.css';

export default function Dashboard() {
  const { activeMonth } = useAppContext();
  const [metrics, setMetrics] = useState({ income: 0, expense: 0, netWorth: 0, invest: 0, pf: 0 });
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
    const totalGrossIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);
    const totalInvest = investmentData.reduce((sum, item) => sum + item.amount, 0);
    const totalPf = incomeData.reduce((sum, item) => sum + (item.providentFund || 0), 0);
    
    const totalIncome = totalGrossIncome - totalInvest;
    const netWorth = totalGrossIncome - totalExpense + totalPf;

    setMetrics({ income: totalIncome, expense: totalExpense, netWorth: netWorth, invest: totalInvest, pf: totalPf });

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


  return (
    <div className="container dashboard-page">
      <div className="metrics-grid" style={{ marginTop: '24px' }}>
        <div className="metric-card metric-savings">
          <div className="metric-header">
            <span className="metric-icon"><TrendUp size={24} weight="duotone" /></span>
            <span className="metric-title">Net Worth</span>
          </div>
          <div className="metric-value font-mono">
            {metrics.netWorth >= 0 ? '+' : ''}{formatCurrency(metrics.netWorth)}
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

        <div className="metric-card metric-pf">
          <div className="metric-header">
            <span className="metric-icon"><Bank size={24} weight="duotone" /></span>
            <span className="metric-title">Provident Fund</span>
          </div>
          <div className="metric-value font-mono">
            {formatCurrency(metrics.pf)}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-chart">
          <PercentageStackedBar
            title="Expense Category"
            items={categoryBreakdown}
            formatCurrency={formatCurrency}
            emptyMessage="No expenses logged this month."
            headerAction={<Link to="/expenses" className="view-all-link">View All</Link>}
            baseColor="#E8612A"
            showLegend={false}
          />
        </div>

        <div className="card dashboard-chart">
          <PercentageStackedBar
            title="Investments"
            items={investmentBreakdown}
            formatCurrency={formatCurrency}
            emptyMessage="No investments logged this month."
            headerAction={<Link to="/investments" className="view-all-link">View All</Link>}
            baseColor="#9C27B0"
            showLegend={false}
          />
        </div>

        <div className="card dashboard-chart">
          <PercentageStackedBar
            title="Payment Methods"
            items={paymentBreakdown}
            formatCurrency={formatCurrency}
            emptyMessage="No payment data this month."
            baseColor="#1E4FA8"
            showLegend={false}
          />
        </div>
      </div>
    </div>
  );
}
