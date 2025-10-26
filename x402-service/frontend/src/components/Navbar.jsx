import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, BarChart3, Send, Wallet } from 'lucide-react';
import ComposeModal from './ComposeModal';

function Navbar({ activeTab, setActiveTab, balance, setBalance }) {
  const [showCompose, setShowCompose] = useState(false);
  
  const CursorBlink = () => (
    <span className="inline-block w-2 h-4 ml-0.5 bg-neon-teal animate-cursor-blink">|</span>
  );

  return (
      <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={{ borderBottom: '1px solid rgba(0,255,209,0.2)', background: 'rgba(0,0,0,0.8)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🧠</span>
                <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#00ffd1', textShadow: '0 0 10px rgba(0,255,209,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                  THE ATTENTION PROTOCOL
                </h1>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(0,255,209,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
                exploring new incentive mechanisms for attention/trust @ encode
                <CursorBlink />
              </p>
            </div>
          </div>

          {/* Navigation - Hide Inbox/Metrics tabs since they're in sidebar now */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
            {/* Balance */}
            <div style={{ 
              background: 'rgba(0,255,209,0.1)', 
              border: '1px solid rgba(0,255,209,0.3)', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 15px rgba(0,255,209,0.2)'
            }}>
              <Wallet style={{ width: '16px', height: '16px', color: '#00ffd1' }} />
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>ATT</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#00ffd1' }}>{balance}</span>
              <span style={{ fontSize: '1rem' }}>🪙</span>
            </div>

            {/* Staked Amount */}
            <div style={{ 
              background: 'rgba(147,51,234,0.1)', 
              border: '1px solid rgba(147,51,234,0.3)', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 15px rgba(147,51,234,0.2)'
            }}>
              <BarChart3 style={{ width: '16px', height: '16px', color: '#9333ea' }} />
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Staked</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#9333ea' }}>{Math.floor(Math.random() * 20 + 35)}.2</span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>ATT</span>
            </div>
          </div>
        </div>
      </div>

      <ComposeModal 
        isOpen={showCompose} 
        onClose={() => setShowCompose(false)}
        balance={balance}
        setBalance={setBalance}
      />
    </motion.header>
  );
}

export default Navbar;
