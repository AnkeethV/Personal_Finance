import { defaultCategories } from './defaultCategories';

const CURRENT_SCHEMA_VERSION = 3;

export const storage = {
  init() {
    // Check if meta exists
    const metaStr = localStorage.getItem('paisa_meta');
    if (!metaStr) {
      // First launch
      const now = new Date().toISOString();
      const meta = {
        version: CURRENT_SCHEMA_VERSION,
        createdAt: now,
        lastModified: now,
        currency: 'INR'
      };
      localStorage.setItem('paisa_meta', JSON.stringify(meta));
      
      // Default profile
      const profile = {
        name: '',
        taxRegime: 'new', // new or old
        age: 30,
        employmentType: 'salaried',
        financialYearStart: 4, // April
        monthlyBudget: 0 // Global monthly budget
      };
      localStorage.setItem('paisa_profile', JSON.stringify(profile));

      // Default categories
      const categories = {
        expense: defaultCategories.filter(c => c.type === 'expense'),
        income: defaultCategories.filter(c => c.type === 'income'),
        investment: defaultCategories.filter(c => c.type === 'investment'),
        custom: []
      };
      localStorage.setItem('paisa_categories', JSON.stringify(categories));

      // Default settings
      const settings = {
        theme: 'system',
        locale: 'en-IN',
        currencyFormat: 'indian'
      };
      localStorage.setItem('paisa_settings', JSON.stringify(settings));
    } else {
      // Check for migrations if needed in future
      const meta = JSON.parse(metaStr);
      if (meta.version < 3) {
        const catsStr = localStorage.getItem('paisa_categories');
        if (catsStr) {
          const cats = JSON.parse(catsStr);
          if (!cats.investment) cats.investment = [];
          
          const defaultInvCats = defaultCategories.filter(c => c.type === 'investment');
          for (const dc of defaultInvCats) {
            // Add if a category with this name doesn't already exist
            if (!cats.investment.find(c => c.name.toLowerCase() === dc.name.toLowerCase() || c.id === dc.id)) {
              cats.investment.push(dc);
            }
          }
          localStorage.setItem('paisa_categories', JSON.stringify(cats));
        }
      }

      meta.version = CURRENT_SCHEMA_VERSION;
      meta.lastModified = new Date().toISOString();
      localStorage.setItem('paisa_meta', JSON.stringify(meta));
    }
  },

  getProfile() {
    const data = localStorage.getItem('paisa_profile');
    return data ? JSON.parse(data) : null;
  },

  setProfile(profile) {
    localStorage.setItem('paisa_profile', JSON.stringify(profile));
    this.updateLastModified();
  },

  getSettings() {
    const data = localStorage.getItem('paisa_settings');
    return data ? JSON.parse(data) : null;
  },

  setSettings(settings) {
    localStorage.setItem('paisa_settings', JSON.stringify(settings));
    this.updateLastModified();
  },

  getCategories() {
    const data = localStorage.getItem('paisa_categories');
    return data ? JSON.parse(data) : { expense: [], income: [], investment: [], custom: [] };
  },

  renameCategory(type, id, newName) {
    const cats = this.getCategories();
    if (cats[type]) {
      const item = cats[type].find(c => c.id === id);
      if (item) {
        item.name = newName;
        localStorage.setItem('paisa_categories', JSON.stringify(cats));
        this.updateLastModified();
      }
    }
  },

  deleteCategory(type, id) {
    const cats = this.getCategories();
    if (cats[type]) {
      cats[type] = cats[type].filter(c => c.id !== id);
      localStorage.setItem('paisa_categories', JSON.stringify(cats));
      this.updateLastModified();
    }
  },

  addCategory(type, name, icon = '📌', color = '#9E9E9E') {
    const cats = this.getCategories();
    if (cats[type]) {
      const newCat = {
        id: `cat_custom_${crypto.randomUUID()}`,
        name,
        icon,
        color,
        type,
        group: 'CUSTOM'
      };
      cats[type].push(newCat);
      localStorage.setItem('paisa_categories', JSON.stringify(cats));
      this.updateLastModified();
      return newCat.id;
    }
    return null;
  },

  getIncomeEntries(monthStr) {
    // monthStr format: "YYYY-MM"
    const data = localStorage.getItem(`paisa_income_${monthStr}`);
    return data ? JSON.parse(data) : [];
  },

  saveIncomeEntry(entry) {
    const monthStr = entry.month; // "YYYY-MM"
    const entries = this.getIncomeEntries(monthStr);
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      entries.push({ ...entry, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(`paisa_income_${monthStr}`, JSON.stringify(entries));
    this.updateLastModified();
  },

  deleteIncomeEntry(id, monthStr) {
    let entries = this.getIncomeEntries(monthStr);
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem(`paisa_income_${monthStr}`, JSON.stringify(entries));
    this.updateLastModified();
  },

  getExpenseEntries(monthStr) {
    const data = localStorage.getItem(`paisa_expense_${monthStr}`);
    return data ? JSON.parse(data) : [];
  },

  saveExpenseEntry(entry) {
    const monthStr = entry.month; // "YYYY-MM"
    const entries = this.getExpenseEntries(monthStr);
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      entries.push({ ...entry, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(`paisa_expense_${monthStr}`, JSON.stringify(entries));
    this.updateLastModified();
  },

  deleteExpenseEntry(id, monthStr) {
    let entries = this.getExpenseEntries(monthStr);
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem(`paisa_expense_${monthStr}`, JSON.stringify(entries));
    this.updateLastModified();
  },

  getInvestmentEntries(monthStr) {
    const data = localStorage.getItem(`paisa_investment_${monthStr}`);
    return data ? JSON.parse(data) : [];
  },

  saveInvestmentEntry(entry) {
    const monthStr = entry.month; // "YYYY-MM"
    const entries = this.getInvestmentEntries(monthStr);
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      entries.push({ ...entry, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(`paisa_investment_${monthStr}`, JSON.stringify(entries));
    this.updateLastModified();
  },

  deleteInvestmentEntry(id, monthStr) {
    let entries = this.getInvestmentEntries(monthStr);
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem(`paisa_investment_${monthStr}`, JSON.stringify(entries));
    this.updateLastModified();
  },

  getTaxData(fyString) {
    const data = localStorage.getItem(`paisa_tax_${fyString}`);
    return data ? JSON.parse(data) : { deduction80D: 0, deductionHRA: 0, stcg: 0, ltcg: 0 };
  },

  saveTaxData(fyString, taxData) {
    localStorage.setItem(`paisa_tax_${fyString}`, JSON.stringify(taxData));
    this.updateLastModified();
  },

  exportData() {
    const exportObj = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('paisa_')) {
        exportObj[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return JSON.stringify(exportObj, null, 2);
  },

  getAllIncomeEntries() {
    let allEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('paisa_income_')) {
        allEntries = allEntries.concat(JSON.parse(localStorage.getItem(key)));
      }
    }
    return allEntries;
  },

  getAllExpenseEntries() {
    let allEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('paisa_expense_')) {
        allEntries = allEntries.concat(JSON.parse(localStorage.getItem(key)));
      }
    }
    return allEntries;
  },

  getAllInvestmentEntries() {
    let allEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('paisa_investment_')) {
        allEntries = allEntries.concat(JSON.parse(localStorage.getItem(key)));
      }
    }
    return allEntries;
  },

  updateLastModified() {
    const metaStr = localStorage.getItem('paisa_meta');
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      meta.lastModified = new Date().toISOString();
      localStorage.setItem('paisa_meta', JSON.stringify(meta));
    }
  }
};
