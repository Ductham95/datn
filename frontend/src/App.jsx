import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NodeDetail from './pages/NodeDetail';
import Alerts from './pages/Alerts';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">🌿</div>
              <div>
                <h1>AirQuality</h1>
                <p>Monitoring System</p>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <span className="nav-link-icon">📊</span>
              Dashboard
            </NavLink>
            <NavLink to="/node/1" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-link-icon">📡</span>
              Node 01 - Trung tâm
            </NavLink>
            <NavLink to="/node/2" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-link-icon">📡</span>
              Node 02 - Công nghiệp
            </NavLink>
            <NavLink to="/node/3" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-link-icon">📡</span>
              Node 03 - Ngoại ô
            </NavLink>
            <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-link-icon">🔔</span>
              Cảnh báo
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <p>v1.0.0 • ĐATN 2026</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/node/:id" element={<NodeDetail />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
