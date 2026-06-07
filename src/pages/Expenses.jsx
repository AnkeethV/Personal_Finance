import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import { evaluateMath } from '../utils/math';
import { Plus, Trash, X, PencilSimple } from '@phosphor-icons/react';
import './Income.css';
import './Expenses.css';

export default function Expenses() {
  const { activeMonth } = useAppContext();
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [budget, setBudget] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    typeId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '', // Merchant/Description
    paymentMethod: 'UPI',
    notes: ''
  });

  useEffect(() => {
    loadData();
    const cats = storage.getCategories();
    setCategories(cats.expense || []);
    if (cats.expense && cats.expense.length > 0) {
      setFormData(prev => ({ ...prev, typeId: cats.expense[0].id }));
    }

    const profile = storage.getProfile();
    if (profile && profile.monthlyBudget) {
      setBudget(Number(profile.monthlyBudget));
    } else {
      setBudget(0);
    }
  }, [activeMonth]);

  const loadData = () => {
    const data = storage.getExpenseEntries(activeMonth);
    // Sort by date descending
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(data);
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
      paymentMethod: 'UPI',
      notes: ''
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

  const handleEditCategory = () => {
    if (!formData.typeId) return;
    const cat = categories.find(c => c.id === formData.typeId);
    if (!cat) return;
    
    const newName = window.prompt("Rename Category:", cat.name);
    if (newName && newName.trim() !== '') {
      storage.renameCategory('expense', formData.typeId, newName.trim());
      // Refresh categories
      const cats = storage.getCategories();
      setCategories(cats.expense || []);
    }
  };

  const handleAddCategory = () => {
    const newName = window.prompt("Enter new category name:");
    if (newName && newName.trim() !== '') {
      const newId = storage.addCategory('expense', newName.trim());
      if (newId) {
        const cats = storage.getCategories();
        setCategories(cats.expense || []);
        setFormData(prev => ({ ...prev, typeId: newId }));
      }
    }
  };

  const handleDeleteCategory = () => {
    if (!formData.typeId) return;
    if (window.confirm("Are you sure you want to delete this category?")) {
      storage.deleteCategory('expense', formData.typeId);
      const cats = storage.getCategories();
      setCategories(cats.expense || []);
      
      // Update selected typeId if the deleted one was selected
      const currentList = cats.expense || [];
      if (currentList.length > 0) {
        setFormData(prev => ({ ...prev, typeId: currentList[0].id }));
      } else {
        setFormData(prev => ({ ...prev, typeId: '' }));
      }
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      typeId: entry.typeId,
      amount: (entry.amount / 100).toString(),
      date: entry.date,
      description: entry.description || '',
      paymentMethod: entry.paymentMethod || 'UPI',
      notes: entry.notes || ''
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

    const entry = {
      id: editingId || crypto.randomUUID(),
      month: activeMonth,
      typeId: formData.typeId,
      amount: Math.round(parseFloat(formData.amount) * 100), // convert to paise
      date: formData.date,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    storage.saveExpenseEntry(entry);
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      storage.deleteExpenseEntry(id, activeMonth);
      loadData();
    }
  };

  const totalExpense = entries.reduce((sum, entry) => sum + entry.amount, 0);

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
    <div className="container expenses-page">
      <div className="page-header">
        <h1 className="font-display">Expense Tracker</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={20} /> Add Expense
        </button>
      </div>

      <div className="card summary-card expense-summary">
        <div className="summary-label">Monthly Total</div>
        <div className="summary-amount font-mono">{formatCurrency(totalExpense)}</div>
      </div>

      {budget > 0 && (
        <div className="card budget-card" style={{ marginBottom: '24px' }}>
          <div className="budget-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
              Monthly Budget: <span className="font-mono">{formatCurrency(budget * 100)}</span>
            </span>
            <span style={{ fontWeight: '600', color: totalExpense > budget * 100 ? 'var(--error)' : 'var(--text-primary)' }}>
              {totalExpense > budget * 100 
                ? `${Math.round(((totalExpense - budget * 100) / (budget * 100)) * 100)}% Exceeded`
                : `${Math.round((totalExpense / (budget * 100)) * 100)}% Used`
              }
            </span>
          </div>
          <div className="chart-bar-bg" style={{ height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div 
              className="chart-bar-fill" 
              style={{ 
                width: `${Math.min(100, (totalExpense / (budget * 100)) * 100)}%`, 
                height: '100%',
                backgroundColor: 'var(--error)',
                transition: 'width 0.5s ease-out, background-color 0.3s ease'
              }}
            ></div>
          </div>
          {totalExpense > budget * 100 && (
            <p style={{ color: 'var(--error)', fontSize: '13px', marginTop: '12px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ You have exceeded your monthly budget limit!
            </p>
          )}
        </div>
      )}

      <div className="card list-card">
        {entries.length === 0 ? (
          <div className="empty-state">No expense entries for this month.</div>
        ) : (
          <div className="transaction-list">
            <div className="list-header">
              <div className="col-source">CATEGORY</div>
              <div className="col-date">DATE</div>
              <div className="col-notes">DETAILS</div>
              <div className="col-payment">PAYMENT</div>
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
                  <div className="col-date">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  <div className="col-notes">
                    <div className="note-text">{entry.description || '-'}</div>
                    <div className="note-subtext">
                      {entry.notes && `${entry.notes}`}
                    </div>
                  </div>
                  <div className="col-payment font-mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {entry.paymentMethod}
                  </div>
                  <div className="col-amount font-mono expense-text">
                    -{formatCurrency(entry.amount)}
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
              <h2 className="font-display">{editingId ? 'Edit' : 'Add'} Expense Entry</h2>
              <button className="icon-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Category *</span>
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
                <label>Amount (₹) *</label>
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
                <label>Merchant / Description</label>
                <input type="text" className="input" name="description" value={formData.description} onChange={handleInputChange} maxLength="100" placeholder="e.g., Zomato, Amazon, Uber" />
              </div>
              
              <div className="form-group">
                <label>Payment Method</label>
                <select className="input" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input type="text" className="input" name="notes" value={formData.notes} onChange={handleInputChange} maxLength="200" placeholder="Optional details..." />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Save'} Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
