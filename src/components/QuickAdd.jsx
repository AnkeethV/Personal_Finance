import { useState } from 'react';
import { Plus, X, PencilSimple, PlusCircle, Trash } from '@phosphor-icons/react';
import { storage } from '../utils/storage';
import { useAppContext } from '../context/AppContext';
import './QuickAdd.css';

export default function QuickAdd() {
  const { activeMonth } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('expense'); // 'expense' or 'investment'
  
  const categories = storage.getCategories();
  
  const [formData, setFormData] = useState({
    typeId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleOpenModal = () => {
    try {
      const cats = storage.getCategories() || { expense: [], income: [], investment: [] };
      const currentList = cats[type] || [];
      const defaultId = currentList.length > 0 ? currentList[0].id : '';

      setFormData({
        typeId: defaultId,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setIsOpen(true);
    } catch (err) {
      alert("Error opening Quick Add: " + err.message);
      setIsOpen(true);
    }
  };

  const handleEditCategory = () => {
    if (!formData.typeId) return;
    const list = categories[type] || [];
    const cat = list.find(c => c.id === formData.typeId);
    if (!cat) return;
    
    const newName = window.prompt("Rename Category:", cat.name);
    if (newName && newName.trim() !== '') {
      storage.renameCategory(type, formData.typeId, newName.trim());
      // Reload is required because QuickAdd reads storage directly on render
      window.location.reload(); 
    }
  };

  const handleDeleteCategory = () => {
    if (!formData.typeId) return;
    if (window.confirm("Are you sure you want to delete this category?")) {
      storage.deleteCategory(type, formData.typeId);
      window.location.reload();
    }
  };

  const handleAddCategory = () => {
    const newName = window.prompt("Enter new category name:");
    if (newName && newName.trim() !== '') {
      const newId = storage.addCategory(type, newName.trim());
      if (newId) {
        setFormData(prev => ({ ...prev, typeId: newId }));
        window.location.reload();
      }
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setFormData(prev => ({
      ...prev,
      typeId: categories[newType]?.[0]?.id || ''
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;

    const entryMonth = formData.date ? formData.date.substring(0, 7) : activeMonth;

    const entry = {
      id: crypto.randomUUID(),
      month: entryMonth,
      typeId: formData.typeId,
      amount: Math.round(parseFloat(formData.amount) * 100),
      date: formData.date,
      description: formData.description,
      paymentMethod: 'UPI',
      notes: ''
    };

    if (type === 'expense') {
      storage.saveExpenseEntry(entry);
    } else if (type === 'investment') {
      entry.platform = '';
      storage.saveInvestmentEntry(entry);
    }

    setIsOpen(false);
    // Force reload window to update pages without complex state management for now
    window.location.reload();
  };

  return (
    <>
      <button className="btn btn-primary quick-add-btn" onClick={handleOpenModal}>
        <PlusCircle size={20} weight="bold" /> Quick Add
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content card quick-add-modal">
            <div className="modal-header">
              <h2 className="font-display">Quick Add</h2>
              <button className="icon-btn" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="type-toggle">
              <button 
                className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => handleTypeChange('expense')}
              >
                Expense
              </button>
              <button 
                className={`toggle-btn ${type === 'investment' ? 'active investment' : ''}`}
                onClick={() => handleTypeChange('investment')}
              >
                Investment
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input type="number" className="input" name="amount" value={formData.amount} onChange={handleInputChange} min="1" step="any" required autoFocus />
              </div>
              
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
                  {(categories[type] || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Date *</label>
                <input type="date" className="input" name="date" value={formData.date} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} required />
              </div>
              
              <div className="form-group">
                <label>Note</label>
                <input type="text" className="input" name="description" value={formData.description} onChange={handleInputChange} maxLength="100" />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Save {type === 'expense' ? 'Expense' : 'Investment'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
