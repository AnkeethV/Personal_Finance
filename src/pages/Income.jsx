import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
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
    tdsDeducted: ''
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
      tdsDeducted: ''
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
      amount: (entry.amount / 100).toString(), // convert back to rupees
      date: entry.date,
      description: entry.description || '',
      payer: entry.payer || '',
      tdsDeducted: entry.tdsDeducted ? (entry.tdsDeducted / 100).toString() : ''
    });
    setEditingId(entry.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    const entry = {
      id: editingId || crypto.randomUUID(),
      month: activeMonth,
      typeId: formData.typeId,
      amount: Math.round(parseFloat(formData.amount) * 100), // convert to paise
      date: formData.date,
      description: formData.description,
      payer: formData.payer,
      tdsDeducted: formData.tdsDeducted ? Math.round(parseFloat(formData.tdsDeducted) * 100) : 0,
      isRecurring: false
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

  const totalIncome = entries.reduce((sum, entry) => sum + entry.amount, 0);

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

      <div className="card summary-card">
        <div className="summary-label">Monthly Total</div>
        <div className="summary-amount font-mono">{formatCurrency(totalIncome)}</div>
      </div>

      <div className="card list-card">
        {entries.length === 0 ? (
          <div className="empty-state">No income entries for this month.</div>
        ) : (
          <div className="transaction-list">
            <div className="list-header">
              <div className="col-source">SOURCE</div>
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
                <label>Amount (₹) *</label>
                <input type="number" className="input" name="amount" value={formData.amount} onChange={handleInputChange} min="1" step="any" required />
              </div>
              
              <div className="form-group">
                <label>Date *</label>
                <input type="date" className="input" name="date" value={formData.date} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} required />
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
