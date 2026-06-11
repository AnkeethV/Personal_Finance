import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import { evaluateMath } from '../utils/math';
import { Plus, Trash, X, PencilSimple } from '@phosphor-icons/react';
import './Income.css';

export default function Income() {
  const { activeMonth } = useAppContext();
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    typeId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    payer: '',
    tdsDeducted: '',
    providentFund: '',
    professionalTax: '',
    savingsSplit: '',
    expenseSplit: '',
    accountTarget: 'savings'
  });

  useEffect(() => {
    loadData();
    const cats = storage.getCategories();
    setCategories(cats.income || []);
    if (cats.income && cats.income.length > 0) {
      setFormData(prev => ({ ...prev, typeId: cats.income[0].id }));
    }
  }, [activeMonth]);

  const loadData = () => {
    const data = storage.getIncomeEntries(activeMonth);
    // Sort by date descending
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(data);
  };

  const handleEditCategory = () => {
    if (!formData.typeId) return;
    const cat = categories.find(c => c.id === formData.typeId);
    if (!cat) return;
    
    const newName = window.prompt("Rename Category:", cat.name);
    if (newName && newName.trim() !== '') {
      storage.renameCategory('income', formData.typeId, newName.trim());
      // Refresh categories
      const cats = storage.getCategories();
      setCategories(cats.income || []);
    }
  };

  const handleDeleteCategory = () => {
    if (!formData.typeId) return;
    if (window.confirm("Are you sure you want to delete this category?")) {
      storage.deleteCategory('income', formData.typeId);
      const cats = storage.getCategories();
      setCategories(cats.income || []);
      
      const currentList = cats['income'] || [];
      if (currentList.length > 0) {
        setFormData(prev => ({ ...prev, typeId: currentList[0].id }));
      } else {
        setFormData(prev => ({ ...prev, typeId: '' }));
      }
    }
  };

  const handleAddCategory = () => {
    const newName = window.prompt("Enter new category name:");
    if (newName && newName.trim() !== '') {
      const newId = storage.addCategory('income', newName.trim());
      if (newId) {
        const cats = storage.getCategories();
        setCategories(cats.income || []);
        setFormData(prev => ({ ...prev, typeId: newId }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      typeId: categories.length > 0 ? categories[0].id : '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      payer: '',
      tdsDeducted: '',
      providentFund: '',
      professionalTax: '',
      savingsSplit: '',
      expenseSplit: '',
      accountTarget: 'savings'
    });
    setEditingId(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (entry) => {
    setFormData({
      typeId: entry.typeId,
      amount: entry.grossAmount ? (entry.grossAmount / 100).toString() : (entry.amount / 100).toString(), // show gross amount in input
      date: entry.date,
      description: entry.description || '',
      payer: entry.payer || '',
      tdsDeducted: entry.tdsDeducted ? (entry.tdsDeducted / 100).toString() : '',
      providentFund: entry.providentFund ? (entry.providentFund / 100).toString() : '',
      professionalTax: entry.professionalTax ? (entry.professionalTax / 100).toString() : '',
      savingsSplit: entry.savingsSplit ? (entry.savingsSplit / 100).toString() : '',
      expenseSplit: entry.expenseSplit ? (entry.expenseSplit / 100).toString() : '',
      accountTarget: entry.accountTarget || 'savings'
    });
    setEditingId(entry.id);
    setIsModalOpen(true);
  };

  const isDateInvalid = formData.date && formData.date.substring(0, 7) !== activeMonth;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    if (isDateInvalid) {
      alert("Please select a date within the currently viewed month.");
      return;
    }

    let parsedGross = parseFloat(formData.amount);
    let pf = formData.providentFund ? parseFloat(formData.providentFund) : 0;
    let pt = formData.professionalTax ? parseFloat(formData.professionalTax) : 0;
    
    // Only apply deductions if category is salary, to be safe
    const isSalary = formData.typeId === 'inc_salary';
    if (!isSalary) {
      pf = 0;
      pt = 0;
    }
    
    let netAmount = parsedGross - pf - pt;
    let sSplit = isSalary && formData.savingsSplit ? parseFloat(formData.savingsSplit) : (isSalary ? netAmount : 0);
    let eSplit = isSalary && formData.expenseSplit ? parseFloat(formData.expenseSplit) : 0;

    if (isSalary && Math.abs(sSplit + eSplit - netAmount) > 0.01) {
      alert("Savings Split and Expense Split must equal the Net Amount.");
      return;
    }

    const entry = {
      id: editingId || crypto.randomUUID(),
      month: activeMonth,
      typeId: formData.typeId,
      amount: Math.round(netAmount * 100), // convert to paise
      grossAmount: Math.round(parsedGross * 100), // convert to paise
      date: formData.date,
      description: formData.description,
      payer: formData.payer,
      tdsDeducted: formData.tdsDeducted ? Math.round(parseFloat(formData.tdsDeducted) * 100) : 0,
      providentFund: Math.round(pf * 100),
      professionalTax: Math.round(pt * 100),
      isRecurring: false,
      savingsSplit: isSalary ? Math.round(sSplit * 100) : 0,
      expenseSplit: isSalary ? Math.round(eSplit * 100) : 0,
      accountTarget: isSalary ? null : formData.accountTarget
    };

    storage.saveIncomeEntry(entry);
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      storage.deleteIncomeEntry(id, activeMonth);
      loadData();
    }
  };

  const expenseData = storage.getExpenseEntries(activeMonth);
  const investmentData = storage.getInvestmentEntries(activeMonth);

  let totalSavingsIncome = 0;
  let totalExpenseIncome = 0;

  entries.forEach(entry => {
    if (entry.typeId === 'inc_salary') {
      totalSavingsIncome += (entry.savingsSplit !== undefined ? entry.savingsSplit : entry.amount);
      totalExpenseIncome += (entry.expenseSplit || 0);
    } else if (entry.accountTarget === 'expense') {
      totalExpenseIncome += entry.amount;
    } else {
      totalSavingsIncome += entry.amount;
    }
  });

  let totalSavingsExpenses = 0;
  let totalExpenseExpenses = 0;
  expenseData.forEach(entry => {
    if (entry.accountSource === 'savings') {
      totalSavingsExpenses += entry.amount;
    } else {
      totalExpenseExpenses += entry.amount;
    }
  });

  let totalSavingsInvestments = 0;
  let totalExpenseInvestments = 0;
  investmentData.forEach(entry => {
    if (entry.accountSource === 'savings') {
      totalSavingsInvestments += entry.amount;
    } else {
      totalExpenseInvestments += entry.amount;
    }
  });

  const savingsBalance = totalSavingsIncome - totalSavingsExpenses - totalSavingsInvestments;
  const expenseBalance = totalExpenseIncome - totalExpenseExpenses - totalExpenseInvestments;
  const monthlyTotal = savingsBalance + expenseBalance;

  const formatCurrency = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(paise / 100);
  };

  const getCategoryDetails = (id) => {
    return categories.find(c => c.id === id) || { name: 'Unknown', icon: '❓', color: '#999' };
  };

  return (
    <div className="container income-page">
      <div className="page-header">
        <h1 className="font-display">Income Tracker</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={20} /> Add Income
        </button>
      </div>

      <div className="card summary-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="summary-label">Monthly Total</div>
          <div className="summary-amount font-mono">{formatCurrency(monthlyTotal)}</div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '0.9em' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Savings Account</span>
            <span className="font-mono" style={{ color: 'var(--income-color)', fontWeight: '600' }}>{formatCurrency(savingsBalance)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Expense Account</span>
            <span className="font-mono" style={{ color: 'var(--error)', fontWeight: '600' }}>{formatCurrency(expenseBalance)}</span>
          </div>
        </div>
        
        <div style={{ flex: 1 }}></div>
      </div>

      <div className="card list-card">
        {entries.length === 0 ? (
          <div className="empty-state">No income entries for this month.</div>
        ) : (
          <div className="transaction-list">
            <div className="list-header">
              <div className="col-source">SOURCE</div>
              <div className="col-account">ACCOUNT</div>
              <div className="col-date">DATE</div>
              <div className="col-notes">NOTES</div>
              <div className="col-amount">AMOUNT</div>
              <div className="col-actions"></div>
            </div>
            {entries.map(entry => {
              const cat = getCategoryDetails(entry.typeId);
              return (
                <div className="list-row" key={entry.id}>
                  <div className="col-source">
                    <span>{cat.name}</span>
                  </div>
                  <div className="col-account" style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {entry.typeId === 'inc_salary' ? 'Split' : (entry.accountTarget === 'expense' ? 'Expense Acct' : 'Savings Acct')}
                  </div>
                  <div className="col-date">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  <div className="col-notes">
                    <div className="note-text">{entry.description}</div>
                    {entry.payer && <div className="note-subtext">{entry.payer}</div>}
                  </div>
                  <div className="col-amount font-mono income-text">
                    +{formatCurrency(entry.amount)}
                  </div>
                  <div className="col-actions">
                    <button className="action-btn" onClick={() => handleEdit(entry)} title="Edit">
                      <PencilSimple size={18} />
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(entry.id)} title="Delete">
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h2 className="font-display">{editingId ? 'Edit' : 'Add'} Income Entry</h2>
              <button className="icon-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Source / Type *</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={handleAddCategory} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <Plus size={14} /> Add new
                    </button>
                    <button type="button" onClick={handleEditCategory} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <PencilSimple size={14} /> Edit selected
                    </button>
                    <button type="button" onClick={handleDeleteCategory} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                </label>
                <select className="input" name="typeId" value={formData.typeId} onChange={handleInputChange} required>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>{formData.typeId === 'inc_salary' ? 'Gross Amount (₹) *' : 'Amount (₹) *'}</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  className="input" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  onBlur={(e) => setFormData(prev => ({ ...prev, amount: evaluateMath(e.target.value) }))}
                  required 
                />
              </div>
              
              {formData.typeId === 'inc_salary' && (
                <>
                  <div className="form-group">
                    <label>Provident Fund (₹)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="input" 
                      name="providentFund" 
                      value={formData.providentFund} 
                      onChange={handleInputChange} 
                      onBlur={(e) => setFormData(prev => ({ ...prev, providentFund: evaluateMath(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Professional Tax (₹)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="input" 
                      name="professionalTax" 
                      value={formData.professionalTax} 
                      onChange={handleInputChange} 
                      onBlur={(e) => setFormData(prev => ({ ...prev, professionalTax: evaluateMath(e.target.value) }))}
                    />
                  </div>
                  
                  {formData.amount && (
                    <div className="form-group" style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Net Monthly Total:</span>
                        <span className="font-mono" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--income-color)' }}>
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                            Math.max(0, (parseFloat(formData.amount || 0) - parseFloat(formData.providentFund || 0) - parseFloat(formData.professionalTax || 0)))
                          )}
                        </span>
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <label style={{ fontSize: '13px', marginBottom: '8px' }}>Split Net Amount Between Accounts</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Savings Acct (₹)</label>
                            <input 
                              type="number" 
                              className="input" 
                              name="savingsSplit" 
                              value={formData.savingsSplit} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const net = Math.max(0, (parseFloat(formData.amount || 0) - parseFloat(formData.providentFund || 0) - parseFloat(formData.professionalTax || 0)));
                                setFormData(prev => ({ 
                                  ...prev, 
                                  savingsSplit: val,
                                  expenseSplit: val ? (net - parseFloat(val)).toString() : ''
                                }));
                              }}
                              step="any"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Expense Acct (₹)</label>
                            <input 
                              type="number" 
                              className="input" 
                              name="expenseSplit" 
                              value={formData.expenseSplit} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const net = Math.max(0, (parseFloat(formData.amount || 0) - parseFloat(formData.providentFund || 0) - parseFloat(formData.professionalTax || 0)));
                                setFormData(prev => ({ 
                                  ...prev, 
                                  expenseSplit: val,
                                  savingsSplit: val ? (net - parseFloat(val)).toString() : ''
                                }));
                              }}
                              step="any"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {formData.typeId !== 'inc_salary' && (
                <div className="form-group">
                  <label>Credit To Account</label>
                  <select className="input" name="accountTarget" value={formData.accountTarget} onChange={handleInputChange}>
                    <option value="savings">Savings Account</option>
                    <option value="expense">Expense Account</option>
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  className="input" 
                  style={isDateInvalid ? { borderColor: 'var(--error)', backgroundColor: 'rgba(244, 67, 54, 0.05)' } : {}}
                  name="date" 
                  value={formData.date} 
                  onChange={handleInputChange} 
                  max={new Date().toISOString().split('T')[0]} 
                  required 
                />
                {isDateInvalid && <span style={{ color: 'var(--error)', fontSize: '12px', marginTop: '4px', display: 'block' }}>Date must be in the active month.</span>}
              </div>
              
              <div className="form-group">
                <label>Description / Notes</label>
                <input type="text" className="input" name="description" value={formData.description} onChange={handleInputChange} maxLength="200" />
              </div>
              
              <div className="form-group">
                <label>Employer / Payer</label>
                <input type="text" className="input" name="payer" value={formData.payer} onChange={handleInputChange} maxLength="100" />
              </div>
              
              <div className="form-group">
                <label>TDS Deducted (₹)</label>
                <input type="number" className="input" name="tdsDeducted" value={formData.tdsDeducted} onChange={handleInputChange} min="0" step="any" />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Save'} Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
