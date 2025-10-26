import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import Navbar from './components/Navbar';
import Inbox from './pages/Inbox';
import Metrics from './pages/Metrics';
import ComposeModal from './components/ComposeModal';

function App() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [balance, setBalance] = useState(120);
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%)', color: '#f2f2f2' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} balance={balance} setBalance={setBalance} />
      
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar */}
        <aside style={{ 
          width: '260px', 
          borderRight: '1px solid rgba(0,255,209,0.2)', 
          padding: '1.5rem',
          background: 'rgba(10,10,10,0.5)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCompose(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #9333ea, #ec4899)',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 'bold',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(147,51,234,0.4)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem'
            }}
          >
            <Send style={{ width: '20px', height: '20px' }} />
            Compose
          </motion.button>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '📥', label: 'Inbox', count: 8, id: 'inbox' },
              { icon: '📊', label: 'Protocol Metrics', count: 0, id: 'metrics' },
              { icon: '⭐', label: 'Starred', count: 0, id: 'starred' },
              { icon: '📤', label: 'Sent', count: 0, id: 'sent' },
              { icon: '📝', label: 'Drafts', count: 3, id: 'drafts' },
              { icon: '🗑️', label: 'Trash', count: 0, id: 'trash' },
              { icon: '⚠️', label: 'Spam', count: 2, id: 'spam' },
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => item.id === 'inbox' || item.id === 'metrics' ? setActiveTab(item.id) : null}
                style={{ 
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: (item.id === 'inbox' || item.id === 'metrics') ? 'pointer' : 'default',
                  background: (item.id === 'inbox' && activeTab === 'inbox') || (item.id === 'metrics' && activeTab === 'metrics') ? 'rgba(0,255,209,0.1)' : 'transparent',
                  border: (item.id === 'inbox' && activeTab === 'inbox') || (item.id === 'metrics' && activeTab === 'metrics') ? '1px solid rgba(0,255,209,0.3)' : '1px solid transparent',
                  color: (item.id === 'inbox' && activeTab === 'inbox') || (item.id === 'metrics' && activeTab === 'metrics') ? '#00ffd1' : 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.count > 0 && (
                  <span style={{ 
                    background: 'rgba(0,255,209,0.2)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: '#00ffd1'
                  }}>
                    {item.count}
                  </span>
                )}
              </div>
            ))}

            <div style={{ marginTop: '2rem', padding: '0.75rem', borderTop: '1px solid rgba(0,255,209,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(0,255,209,0.5)', marginBottom: '0.75rem' }}>MEET</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { icon: '📹', label: 'New meeting' },
                  { icon: '📅', label: 'Join a meeting' },
                ].map(item => (
                  <div 
                    key={item.label}
                    style={{ 
                      padding: '0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'inbox' && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              <Inbox balance={balance} setBalance={setBalance} />
            </motion.div>
          )}
          
          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              <Metrics />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <ComposeModal 
        isOpen={showCompose} 
        onClose={() => setShowCompose(false)}
        balance={balance}
        setBalance={setBalance}
      />
    </div>
  );
}

export default App;