import { CaretLeft, CaretRight, Moon, Sun, ShieldCheck, List } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { storage } from '../utils/storage';
import { useAppContext } from '../context/AppContext';
import './TopBar.css';

export default function TopBar({ toggleTheme, isDark, toggleSidebar }) {
  const { activeMonth, setActiveMonth } = useAppContext();
  const location = useLocation();

  // Helper to display nicely
  const displayMonth = new Date(activeMonth + '-01').toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  const handlePrevMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1); // -2 because month is 1-indexed and we want prev month
    setActiveMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const date = new Date(year, month, 1); // month is 1-indexed, so passing it directly gives next month
    setActiveMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="icon-btn hamburger-btn" onClick={toggleSidebar}>
          <List size={24} />
        </button>
      {location.pathname === '/' ? (
        <h1 className="font-display" style={{ margin: 0, fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>Finance Status</h1>
      ) : (
        <div className="month-selector">
          <button className="icon-btn" onClick={handlePrevMonth}><CaretLeft size={20} /></button>
          <span className="current-month font-display">{displayMonth}</span>
          <button className="icon-btn" onClick={handleNextMonth}><CaretRight size={20} /></button>
        </div>
      )}
      </div>
      <div className="topbar-actions">
        <div className="privacy-badge">
          <ShieldCheck size={20} weight="duotone" />
          <span>Privacy First</span>
        </div>
        <button className="icon-btn" onClick={toggleTheme}>
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
    </div>
  );
}
