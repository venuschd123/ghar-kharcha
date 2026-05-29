import { Component } from 'react';
import { db } from '../db';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Catch unhandled promise rejections (async/DB errors)
    this._handler = (e) => {
      console.error('Unhandled rejection:', e.reason);
    };
    window.addEventListener('unhandledrejection', this._handler);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this._handler);
  }

  componentDidCatch(error, info) {
    console.error('Ghar Kharcha error:', error, info);
  }

  handleEmergencyExport = async () => {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        emergency: true,
        projects: await db.projects.toArray(),
        categories: await db.categories.toArray(),
        expenses: await db.expenses.toArray(),
        vendors: await db.vendors.toArray(),
        phases: await db.phases.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ghar-kharcha-emergency-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Emergency export failed:', err);
      alert('Could not export data. Your data is still saved in the browser.');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: '#111827',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          background: '#F4F5FB',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
            Your data is safe. Please refresh the page to try again.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 14,
                padding: '14px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Refresh App
            </button>
            <button
              onClick={this.handleEmergencyExport}
              style={{
                background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB',
                borderRadius: 14, padding: '12px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Export Data (Safety Backup)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
