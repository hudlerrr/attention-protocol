import { motion } from 'framer-motion';
import { Award, TrendingUp, DollarSign, Users, BarChart3, Zap } from 'lucide-react';
import { metricsMock } from '../data/inboxMock';

function Metrics() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(236,72,153,0.1) 100%)',
        border: '1px solid rgba(147,51,234,0.3)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ fontSize: '0.75rem', color: '#9333ea', marginBottom: '0.5rem' }}>[METRICS] Attention Economy Analytics</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9333ea', textShadow: '0 0 10px rgba(147,51,234,0.5)' }}>📊 State of the Attention Protocol</h2>
        <div style={{ fontSize: '0.875rem', color: 'rgba(147,51,234,0.7)' }}>real-time on-chain data • last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Protocol Info Section */}
      <div style={{ 
        background: 'rgba(0,255,209,0.05)',
        border: '1px solid rgba(0,255,209,0.3)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '1rem' }}>🧠 How It Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '0.5rem' }}>💎 Attention Staking</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              Senders stake to prove their content deserves engagement, recipients claim value back if it's useful.
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '0.5rem' }}>⭐ Trust Scoring</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              Use staking as a decentralized reputation system for legitimate senders.
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '0.5rem' }}>🤖 AI Agent Layer</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              Agents auto-filter, claim, or refund based on user preferences.
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,209,0.15) 0%, rgba(0,255,209,0.05) 100%)',
            border: '1px solid rgba(0,255,209,0.3)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,255,209,0.15)',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <DollarSign style={{ width: '32px', height: '32px', color: '#00ffd1' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(0,255,209,0.7)' }}>This Week</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '0.25rem' }}>{metricsMock.totalStaked}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Total ATT Staked</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(16,185,129,0.15)',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <TrendingUp style={{ width: '32px', height: '32px', color: '#10b981' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(16,185,129,0.7)' }}>Global</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem' }}>{metricsMock.engagementRate}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Engagement Rate</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(147,51,234,0.05) 100%)',
            border: '1px solid rgba(147,51,234,0.3)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(147,51,234,0.15)',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <Users style={{ width: '32px', height: '32px', color: '#9333ea' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(147,51,234,0.7)' }}>Active</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#9333ea', marginBottom: '0.25rem' }}>{metricsMock.activeAgents}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>AI Agents</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(239,68,68,0.15)',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <Zap style={{ width: '32px', height: '32px', color: '#ef4444' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(239,68,68,0.7)' }}>Today</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '0.25rem' }}>{metricsMock.emailsToday}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Emails Processed</div>
        </motion.div>
      </div>


      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left Column - Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Leaderboard */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(10,10,10,0.6) 100%)',
            border: '1px solid rgba(0,255,209,0.3)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,255,209,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
              <Award style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
              Top Agents by Proof-of-Attention Score
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metricsMock.topSenders.map((agent, idx) => (
                <motion.div
                  key={agent.name}
                  whileHover={{ x: 5 }}
                  style={{
                    background: 'rgba(0,255,209,0.05)',
                    border: '1px solid rgba(0,255,209,0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : idx === 1 ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : 'linear-gradient(135deg, #78350f, #854d0e)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#00ffd1' }}>{agent.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                        {agent.score}% valuable • {agent.emails} emails
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>+{agent.earned}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>ATT earned</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(10,10,10,0.8) 0%, rgba(26,26,26,0.5) 100%)',
            border: '1px solid rgba(0,255,209,0.2)',
            padding: '1.5rem',
            borderRadius: '12px',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 style={{ width: '20px', height: '20px' }} />
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metricsMock.recentActivity.map((activity, idx) => (
                <div key={idx} style={{ 
                  fontSize: '0.875rem', 
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: idx < metricsMock.recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}>
                  <span style={{ color: 'rgba(0,255,209,0.6)' }}>{activity.time}</span>
                  <span>{activity.action}</span>
                  <span style={{ color: activity.change.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {activity.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Meme Cards Stacked */}
        <div>
          {/* Meme Cards - Stacked on Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '2rem' }}>
            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              style={{
                background: 'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(236,72,153,0.2) 100%)',
                border: '1px solid rgba(147,51,234,0.4)',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 4px 20px rgba(147,51,234,0.2)'
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#9333ea', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                "You're not broke, you're just attention-poor."
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                Save your attention — it's an endangered resource 🧠
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,209,0.2) 0%, rgba(0,255,209,0.05) 100%)',
                border: '1px solid rgba(0,255,209,0.4)',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 4px 20px rgba(0,255,209,0.2)'
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00ffd1', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                "Stake wisely. Spam dies fast."
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                Quality content pays. Engagement matters. 🤝
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
                border: '1px solid rgba(239,68,68,0.4)',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 4px 20px rgba(239,68,68,0.2)'
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                "Attention is the new oil."
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                Mine it wisely, spend it well. ⛽
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Metrics;