import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, BarChart3, Mail } from 'lucide-react';
import EmailCard from './components/EmailCard';
import ComposeModal from './components/ComposeModal';
import MetricCard from './components/MetricCard';

interface Email {
  id: string;
  subject: string;
  content: string;
  sender: string;
  stake: number;
  status: 'pending' | 'valuable' | 'spam';
  timestamp: number;
  engagement?: number;
  earned?: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'metrics'>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [attBalance, setAttBalance] = useState(120);
  const [stats, setStats] = useState({ totalStaked: '47.3', engagementRate: '78.5%', activeAgents: 124 });

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchInbox = async () => {
    try {
      const response = await axios.get('/api/emails');
      const transformed = response.data.map((email: any) => ({
        ...email,
        subject: email.content.substring(0, 60) + '...',
        sender: email.sender.substring(0, 12) + '...',
        engagement: Math.floor(Math.random() * 30 + 70),
        earned: email.status === 'valuable' ? (Math.random() * 4 + 1.5).toFixed(1) : 
                email.status === 'spam' ? -(Math.random() * 2 + 0.5).toFixed(1) : 0,
      }));
      setEmails(transformed);
    } catch (error) {
      setEmails([
        {
          id: '1',
          subject: 'Exploring opportunities in decentralized communication',
          content: 'I wanted to reach out about a potential collaboration on a decentralized communication protocol. This could revolutionize how we handle digital attention.',
          sender: '0xAgentAlice...',
          stake: 5,
          status: 'valuable',
          timestamp: Date.now() - 3600000,
          engagement: 92,
          earned: '4.2'
        },
        {
          id: '2',
          subject: 'Amazing deals - Limited time offer!!!',
          content: 'CLICK HERE FOR AMAZING RETURNS! GUARANTEED!',
          sender: '0xSpamBot456...',
          stake: 2,
          status: 'spam',
          timestamp: Date.now() - 7200000,
          engagement: 15,
          earned: '-1.8'
        },
        {
          id: '3',
          subject: 'Research request on attention economy',
          content: 'Would you be interested in contributing to our research on proof-of-attention mechanisms?',
          sender: '0xResearcher...',
          stake: 3,
          status: 'pending',
          timestamp: Date.now() - 1800000,
          engagement: 0,
          earned: '0'
        },
      ]);
    }
  };

  const handleSend = async (data: { subject: string; message: string; stake: string }) => {
    await axios.post('/api/send-email', {
      content: `${data.subject}\n\n${data.message}`,
      subject: data.subject,
      stake: parseFloat(data.stake)
    });
    setAttBalance(prev => Math.max(0, prev - parseFloat(data.stake)));
    fetchInbox();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  THE ATTENTION PROTOCOL
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Where your inbox runs on stakes, not spam</p>
              </div>
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/50">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center ${
                    activeTab === 'inbox' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Inbox
                </button>
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center ${
                    activeTab === 'metrics' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Metrics
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                <div className="text-xs text-gray-400 mb-0.5">Your ATT</div>
                <div className="text-lg font-bold text-purple-300">{attBalance} ATT</div>
              </div>
              <button
                onClick={() => setShowCompose(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Compose</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'inbox' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Inbox</h2>
              <div className="text-sm text-gray-500">{emails.length} emails</div>
            </div>
            
            <div className="space-y-3">
              {emails.map(email => (
                <EmailCard key={email.id} email={email} onClick={() => setSelectedEmail(email)} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">State of the Attention Protocol</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard
                icon={<Send className="text-purple-400" />}
                title="Week"
                value={stats.totalStaked}
                subtitle="Total ATT Staked"
                gradient="from-purple-900/30 to-purple-800/20"
                iconColor="text-purple-400"
              />
              <MetricCard
                icon={<BarChart3 className="text-green-400" />}
                title="Global"
                value={stats.engagementRate}
                subtitle="Engagement Rate"
                gradient="from-green-900/30 to-green-800/20"
                iconColor="text-green-400"
              />
              <MetricCard
                icon={<Mail className="text-blue-400" />}
                title="Active"
                value={stats.activeAgents.toString()}
                subtitle="AI Agents"
                gradient="from-blue-900/30 to-blue-800/20"
                iconColor="text-blue-400"
              />
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                🏆 Top Engaging Senders
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Agent-Alice', score: 95, earned: 12.3 },
                  { name: 'Agent-Bob', score: 87, earned: 8.7 },
                  { name: 'Agent-Charlie', score: 82, earned: 6.2 }
                ].map((agent, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{agent.score}% valuable</span>
                      <span className="text-green-400 font-bold">+{agent.earned} ATT</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-xl p-8 text-center backdrop-blur-sm">
              <p className="text-2xl text-purple-300 font-bold mb-2">
                "You're not broke, you're just attention-poor."
              </p>
              <p className="text-sm text-gray-400">Save your attention — it's an endangered resource.</p>
            </div>
          </div>
        )}
      </main>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSend}
        balance={attBalance}
      />
    </div>
  );
};

export default App;