import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, TrendingUp, Loader2, CheckCircle2, AlertCircle, Users, Rocket } from 'lucide-react';

function ComposeModal({ isOpen, onClose, balance, setBalance }) {
  const [step, setStep] = useState(1); // 1: Form, 2: Negotiating, 3: Quote, 4: Sending, 5: Success
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [quoteStake, setQuoteStake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  const fakeRecipients = [
    '0xAgentAlice...',
    '0xAgentBob...',
    '0xAgentCharlie...',
    '0xResearcherMK...'
  ];

  if (!isOpen) return null;

  const toggleRecipient = (recipient) => {
    if (selectedRecipients.includes(recipient)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== recipient));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const handleGetQuote = async () => {
    if (!subject || !message || selectedRecipients.length === 0) return;
    setLoading(true);
    setStep(2); // Show negotiating screen
    
    // Simulate agent negotiation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const simulatedQuote = Math.floor(Math.random() * 8 + 3);
    setQuoteStake(simulatedQuote);
    setStep(3); // Show quote
    setLoading(false);
  };

  const handleSend = async () => {
    setLoading(true);
    setStep(4); // Show sending screen
    
    // Generate fake tx hash
    const fakeHash = '0x' + Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    setTxHash(fakeHash);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBalance(prev => Math.max(0, prev - quoteStake));
    setStep(5); // Show success
    
    // Auto close after 3 seconds
    setTimeout(() => {
      setStep(1);
      setSubject('');
      setMessage('');
      setSelectedRecipients([]);
      setQuoteStake(0);
      setTxHash('');
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    setStep(1);
    setSubject('');
    setMessage('');
    setSelectedRecipients([]);
    setQuoteStake(0);
    setTxHash('');
    onClose();
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#d1d5db', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              style={{ width: '100%', background: '#262626', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '1rem', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#d1d5db', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>To</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {fakeRecipients.map(recipient => (
                <button
                  key={recipient}
                  onClick={() => toggleRecipient(recipient)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: selectedRecipients.includes(recipient) ? '2px solid #00ffd1' : '1px solid rgba(255,255,255,0.2)',
                    background: selectedRecipients.includes(recipient) ? 'rgba(0,255,209,0.1)' : '#262626',
                    color: selectedRecipients.includes(recipient) ? '#00ffd1' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Users style={{ width: '16px', height: '16px' }} />
                  {recipient}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
              {selectedRecipients.length} selected
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#d1d5db', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              style={{ width: '100%', background: '#262626', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '1rem', minHeight: '10rem', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          
          <button
            onClick={handleGetQuote}
            disabled={loading || !message || !subject || selectedRecipients.length === 0}
            style={{ 
              width: '100%', 
              background: loading || !message || !subject || selectedRecipients.length === 0 ? '#374151' : 'linear-gradient(to right, #9333ea, #ec4899)', 
              color: '#fff',
              border: 'none',
              padding: '0.875rem',
              borderRadius: '8px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading || !message || !subject || selectedRecipients.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || !message || !subject || selectedRecipients.length === 0 ? 0.5 : 1,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem'
            }}
          >
            <TrendingUp style={{ width: '20px', height: '20px' }} />
            Get Quote
          </button>
        </>
      );
    }
    
    if (step === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', textAlign: 'center' }}>
          <Loader2 style={{ width: '64px', height: '64px', color: '#00ffd1', animation: 'spin 1s linear infinite', marginBottom: '2rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>Agent Negotiating...</h3>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
            Agent is negotiating optimal stake with recipients...
          </p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(0,255,209,0.7)', marginTop: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>
            Analyzing engagement patterns...
          </p>
        </div>
      );
    }
    
    if (step === 3) {
      return (
        <>
          <div style={{ background: 'linear-gradient(to right, rgba(147,51,234,0.3), rgba(147,51,234,0.2))', border: '1px solid rgba(147,51,234,0.3)', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 style={{ width: '24px', height: '24px', color: '#fff' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>Quote Received</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>Agent negotiation complete</p>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem', fontFamily: 'JetBrains Mono, monospace' }}>Stake Required</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#9333ea', fontFamily: 'JetBrains Mono, monospace' }}>{quoteStake} ATT</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', fontFamily: 'JetBrains Mono, monospace' }}>Your balance: {balance} ATT</div>
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={loading || quoteStake > balance}
            style={{ 
              width: '100%', 
              background: loading || quoteStake > balance ? '#374151' : 'linear-gradient(to right, #16a34a, #10b981)', 
              color: '#fff',
              border: 'none',
              padding: '0.875rem',
              borderRadius: '8px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: loading || quoteStake > balance ? 'not-allowed' : 'pointer',
              opacity: loading || quoteStake > balance ? 0.5 : 1,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem'
            }}
          >
            <Send style={{ width: '20px', height: '20px' }} />
            Stake & Send
          </button>
        </>
      );
    }
    
    if (step === 4) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', textAlign: 'center' }}>
          <Rocket style={{ width: '64px', height: '64px', color: '#00ffd1', marginBottom: '2rem', animation: 'pulse 2s infinite' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>Broadcasting Transaction...</h3>
          <p style={{ fontSize: '0.875rem', color: 'rgba(0,255,209,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
            {txHash.substring(0, 20)}...
          </p>
        </div>
      );
    }
    
    if (step === 5) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', textAlign: 'center' }}>
          <CheckCircle2 style={{ width: '64px', height: '64px', color: '#16a34a', marginBottom: '2rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>Email Staked Successfully!</h3>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
            Awaiting engagement...
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
            Redirecting to inbox...
          </p>
        </div>
      );
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,209,0.3)', borderRadius: '1rem', maxWidth: '48rem', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 0 30px rgba(0,255,209,0.2)' }}
      >
        {step <= 3 && (
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0,255,209,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0a0a0a' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00ffd1', fontFamily: 'JetBrains Mono, monospace' }}>Compose Email</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(0,255,209,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>Stake your attention</p>
            </div>
            <button onClick={handleClose} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        )}
        
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}

export default ComposeModal;