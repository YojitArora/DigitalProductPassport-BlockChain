import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { LuShieldCheck } from 'react-icons/lu';

export const App: React.FC = () => {
  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2.5rem',
          maxWidth: '560px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--accent-primary)',
            fontSize: '32px',
            marginBottom: '1.5rem'
          }}>
            <LuShieldCheck />
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            letterSpacing: '-0.025em'
          }}>
            Digital Product Passport
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: '1.6',
            marginBottom: '1.75rem'
          }}>
            Blockchain-Based Digital Product Passport System. Development environment initialized and ready for implementation.
          </p>

          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            color: 'var(--status-success)'
          }}>
            ● Foundation Ready
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
