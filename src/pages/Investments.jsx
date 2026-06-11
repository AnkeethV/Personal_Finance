import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import { evaluateMath } from '../utils/math';
import { Plus, Trash, X, PencilSimple } from '@phosphor-icons/react';
import './Income.css';
import './Investments.css';

export default function Investments() {
  const { activeMonth } = useAppContext();
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    typeId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    platform: '',
    notes: '',
    accountSource: 'expense'
  });

  useEffect(() => {
    loadData();
    const cats = storage.getCategories();
    setCategories(cats.investment || []);
    if (cats.investment && cats.investment.length > 0) {
      setFormData(prev => ({ ...prev, typeId: cats.investment[0].id }));
    }
  }, [activeMonth]);

  const loadData = () => {
    const data = storage.getInvestmentEntries(activeMonth);
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(data);
  };

  const handleEditCategory = () => {
    if (!formData.typeId) return;
    const cat = categories.find(c => c.id === formData.typeId);
    if (!cat) return;
    
    const newName = window.prompt("Rename Category:", cat.name);
    if (newName && newName.trim() !== '') {
      storage.renameCategory('investment', formData.typeId, newName.trim());
      const cats = storage.getCategories();
      setCategories(cats.investment || []);
    }
  };

  const handleDeleteCategory = () => {
    if (!formData.typeId) return;
    if (window.confirm("Are you sure you want to delete this category?")) {
      storage.deleteCategory('investment', formData.typeId);
      const cats = storage.getCategories();
      setCategories(cats.investment || []);
      
      const currentList = cats['investment'] || [];
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
      const newId = storage.addCategory('investment', newName.trim());
      if (newId) {
        const cats = storage.getCategories();
        setCategories(cats.investment || []);
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
      platform: '',
      notes: '',
      accountSource: 'expense'
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
      amount: (entry.amount / 100).toString(),
      date: entry.date,
      platform: entry.platform || '',
      notes: entry.notes || '',
      accountSource: entry.accountSource || 'expense'
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
      amount: Math.round(parseFloat(formData.amount) * 100),
      date: formData.date,
      platform: formData.platform,
      notes: formData.notes,
      accountSource: formData.accountSource
    };

    storage.saveInvestmentEntry(entry);
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this investment?")) {
      storage.deleteInvestmentEntry(id, activeMonth);
      loadData();
    }
  };

  const totalInvestment = entries.reduce((sum, entry) => sum + entry.amount, 0);

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
    <div className="container investments-page">
      <div className="page-header">
        <h1 className="font-display">Investments</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={20} /> Add Investment
        </button>
      </div>

      <div className="card summary-card investment-summary">
        <div className="summary-label">Monthly Investment</div>
        <div className="summary-amount font-mono">{formatCurrency(totalInvestment)}</div>
      </div>

      <div className="card list-card">
        {entries.length === 0 ? (
          <div className="empty-state">No investments logged this month.</div>
        ) : (
          <div className="transaction-list">
            <div className="list-header">
              <div className="col-source">CATEGORY</div>
              <div className="col-account">ACCOUNT</div>
              <div className="col-date">DATE</div>
              <div className="col-notes">DETAILS</div>
              <div className="col-payment">PLATFORM</div>
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
                    {entry.accountSource === 'savings' ? 'Savings Acct' : 'Expense Acct'}
                  </div>
                  <div className="col-date">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  <div className="col-notes">
                    <div className="note-text">{entry.platform || '-'}</div>
                    <div className="note-subtext">
                      {entry.notes && `${entry.notes}`}
                    </div>
                  </div>
                  <div className="col-payment font-mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {entry.platform}
                  </div>
                  <div className="col-amount font-mono investment-text">
                    {formatCurrency(entry.amount)}
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
              <h2 className="font-display">{editingId ? 'Edit' : 'Add'} Investment</h2>
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
                <label>Platform / Broker</label>
                <input type="text" className="input" name="platform" value={formData.platform} onChange={handleInputChange} maxLength="100" placeholder="e.g., Zerodha, Groww, SBI" />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input type="text" className="input" name="notes" value={formData.notes} onChange={handleInputChange} maxLength="200" placeholder="e.g., AAPL stock, SIP" />
              </div>
              
              <div className="form-group">
                <label>Funded From Account</label>
                <select className="input" name="accountSource" value={formData.accountSource} onChange={handleInputChange}>
                  <option value="expense">Expense Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Save'} Investment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
