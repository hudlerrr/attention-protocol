import React, { useState } from 'react';
import { X, Send, TrendingUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { subject: string; message: string; stake: string }) => Promise<void>;
  balance: number;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend, balance }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [stake, setStake] = useState('5');
  const [showQuote, setShowQuote] = useState(false);
  const [quoteStake, setQuoteStake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGetQuote = async () => {
    if (!subject || !message) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    
    // Simulate agent negotiation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const simulatedQuote = Math.floor(Math.random() * 8 + 3);
    setQuoteStake(simulatedQuote);
    setShowQuote(true);
    setLoading(false);
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      await onSend({ subject, message, stake: quoteStake.toString() });
      setShowQuote(false);
      setSubject('');
      setMessage('');
      setStake('5');
      onClose();
    } catch (err) {
      setError('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowQuote(false);
    setSubject('');
    setMessage('');
    setStake('5');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold">Compose Email</h2>
            <p className="text-sm text-gray-400">Stake your attention</p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {!showQuote ? (
            <>
              {error && (
                <div className="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 transition-colors"
                  placeholder="Enter subject..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 h-40 focus:outline-none focus:border-purple-600 transition-colors resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Stake Estimate (ATT)</label>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-600 transition-colors"
                  placeholder="5"
                />
              </div>
              
              <button
                onClick={handleGetQuote}
                disabled={loading || !message || !subject}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-3.5 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Agent is negotiating optimal stake...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Get Quote
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-700/30 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Quote Received</h3>
                    <p className="text-sm text-gray-400">Agent negotiation complete</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Your content has been analyzed. Optimal stake determined based on recipient engagement patterns.
                </p>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Stake Required</div>
                  <div className="text-4xl font-bold text-purple-300">{quoteStake} ATT</div>
                  <div className="text-xs text-gray-500 mt-1">Your balance: {balance} ATT</div>
                </div>
              </div>
              
              {parseInt(quoteStake.toString()) > balance && (
                <div className="bg-yellow-900/20 border border-yellow-700 text-yellow-300 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Insufficient balance. You need {quoteStake - balance} more ATT.
                </div>
              )}
              
              <button
                onClick={handleSend}
                disabled={loading || parseInt(quoteStake.toString()) > balance}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-3.5 rounded-lg font-medium transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Stake & Send
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
