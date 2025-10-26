import { motion } from 'framer-motion';
import { inboxMock } from '../data/inboxMock';
import { Mail, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

function Inbox({ balance, setBalance }) {
  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return new Date(timestamp).toLocaleDateString();
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const handleClickEmail = (email) => {
    if (email.status === 'valuable') {
      const earned = parseFloat(email.earned);
      setBalance(prev => Math.round((prev + earned) * 10) / 10);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(0,255,209,0.1) 0%, rgba(147,51,234,0.1) 100%)',
        border: '1px solid rgba(0,255,209,0.3)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#00ffd1', marginBottom: '0.5rem' }}>[SYSTEM] Inbox Protocol Active</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00ffd1', textShadow: '0 0 10px rgba(0,255,209,0.5)' }}>Inbox</h2>
            <div style={{ fontSize: '0.875rem', color: 'rgba(0,255,209,0.7)' }}>scanning messages...</div>
          </div>
          <div style={{ 
            background: 'rgba(0,255,209,0.1)', 
            border: '1px solid rgba(0,255,209,0.3)', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '8px',
            color: '#00ffd1',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(0,255,209,0.2)'
          }}>
            {inboxMock.length} emails
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {inboxMock.map(email => (
          <motion.div
            key={email.id}
            whileHover={{ scale: 1.01, x: 5 }}
            onClick={() => handleClickEmail(email)}
            className="email-card"
            style={{
              border: '1px solid rgba(0,255,209,0.3)',
              background: 'linear-gradient(135deg, rgba(10,10,10,0.9) 0%, rgba(26,26,26,0.6) 100%)',
              padding: '1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 20px rgba(0,255,209,0.15)',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', color: '#9333ea' }}>{email.sender}</span>
                  <span style={{ color: '#6b7280' }}>•</span>
                  <span style={{ color: '#e5e7eb' }}>{email.subject}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <DollarSign style={{ width: '12px' }} />
                    {email.stake} ATT staked
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <TrendingUp style={{ width: '12px' }} />
                    {email.engagement}% engaged
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock style={{ width: '12px' }} />
                    {formatTime(email.timestamp)}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem', 
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {email.content}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.5rem' }}>
                {email.status === 'valuable' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>
                    <CheckCircle2 style={{ width: '12px' }} /> +{email.earned} ATT
                  </span>
                )}
                {email.status === 'spam' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                    <XCircle style={{ width: '12px' }} /> {email.earned} ATT
                  </span>
                )}
                {email.status === 'pending' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', background: 'rgba(250,204,21,0.2)', color: '#fcd34d' }}>
                    <Clock style={{ width: '12px' }} /> Pending
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Inbox;