import { Link, useLocation } from 'react-router-dom';
import { 
  SquaresFour, 
  Wallet, 
  Receipt, 
  ChartLineUp, 
  Scales, 
  Gear,
  PlusCircle
} from '@phosphor-icons/react';
import QuickAdd from './QuickAdd';
import './Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: SquaresFour },
    { path: '/income', label: 'Income', icon: Wallet },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/investments', label: 'Investments', icon: ChartLineUp },
    { path: '/tax', label: 'Tax', icon: Scales },
    { path: '/settings', label: 'Settings', icon: Gear },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Personal Finance</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <item.icon size={24} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <QuickAdd />
        <div className="last-saved">Saved recently</div>
      </div>
    </div>
  );
}
