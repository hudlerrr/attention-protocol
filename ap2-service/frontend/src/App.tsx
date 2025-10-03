import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSignTypedData, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Wallet, MessageSquare, DollarSign, CheckCircle, AlertCircle, ExternalLink, Cpu, X } from 'lucide-react';
import { apiClient } from './api';
import type { IntentMandate, ChatMessage, InferenceResponse } from './types';
import { parseUnits } from 'viem';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
const MERCHANT_ADDRESS = import.meta.env.VITE_MERCHANT_ADDRESS;

if (!USDC_ADDRESS) {
  throw new Error('VITE_USDC_ADDRESS environment variable is not set');
}
if (!MERCHANT_ADDRESS) {
  throw new Error('VITE_MERCHANT_ADDRESS environment variable is not set');
}

const APPROVAL_AMOUNT = parseUnits('5', 6); // 5 USDC approval

function App() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContract, data: hash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash });

  const [mandate, setMandate] = useState<IntentMandate | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingMandate, setIsCreatingMandate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasApproved, setHasApproved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const creationInProgressRef = useRef(false);
  const [settlementToast, setSettlementToast] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  // Check service health on mount
  useEffect(() => {
    apiClient.checkHealth()
      .then(setServiceHealth)
      .catch(err => console.error('Health check failed:', err));
  }, []);

  // create mandate when wallet connects, reset when disconnects
  useEffect(() => {
    if (isConnected && address && !mandate && !isCreatingMandate && !creationInProgressRef.current) {
      console.log('Triggering mandate creation...');
      createMandate();
    } else if (!isConnected) {
      // reset state when wallet disconnects
      setMandate(null);
      setMessages([]);
      setError(null);
      creationInProgressRef.current = false;
    }
  }, [isConnected, address, mandate, isCreatingMandate]);

  const createMandate = async () => {
    if (!address || isCreatingMandate || mandate || creationInProgressRef.current) return;

    try {
      creationInProgressRef.current = true;
      setIsCreatingMandate(true);
      setIsSigning(true);
      setError(null);
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // create unsigned mandate
      const result = await apiClient.createMandate({
        userAddress: address,
        sessionId,
      });

      // request user signature
      console.log('Requesting mandate signature from user...');
      // convert string values back to BigInt for signing
      const messageForSigning = {
        ...result.signingData.message,
        dailyCapMicroUsdc: BigInt(result.signingData.message.dailyCapMicroUsdc),
        pricePerMessageMicroUsdc: BigInt(result.signingData.message.pricePerMessageMicroUsdc),
        batchThreshold: BigInt(result.signingData.message.batchThreshold),
        expiresAt: BigInt(result.signingData.message.expiresAt),
      };
      
      const signature = await signTypedDataAsync({
        domain: result.signingData.domain,
        types: result.signingData.types,
        primaryType: result.signingData.primaryType,
        message: messageForSigning,
      });

      setIsSigning(false);

      // submit signed mandate
      const signedResult = await apiClient.submitSignedMandate({
        unsignedMandate: result.unsignedMandate,
        signature,
      });

      setMandate(signedResult.mandate);
      
      // welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Welcome! Each message costs $${(signedResult.mandate.pricePerMessageMicroUsdc / 1000000).toFixed(4)} USDC, and settlement will occur every ${signedResult.mandate.batchThreshold} messages.`,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setIsSigning(false);
      if (err instanceof Error && err.message.includes('User rejected')) {
        setError('You must sign the Intent Mandate to use the service');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create mandate');
      }
    } finally {
      creationInProgressRef.current = false;
      setIsCreatingMandate(false);
    }
  };

  const approveUSDC = () => {
    writeContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: [{
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      }],
      functionName: 'approve',
      args: [MERCHANT_ADDRESS as `0x${string}`, APPROVAL_AMOUNT],
    });
  };

  // track approval success
  useEffect(() => {
    if (isApproved) {
      setHasApproved(true);
    }
  }, [isApproved]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !mandate || !address || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response: InferenceResponse = await apiClient.sendInference({
        mandateId: mandate.mandateId,
        userAddress: address,
        prompt: inputMessage,
      });

      const assistantMessage: ChatMessage = {
        id: response.eventId,
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
        eventId: response.eventId,
        priceMicroUsdc: response.priceMicroUsdc,
        settlementInfo: response.settlementTriggered && response.transactionHash ? {
          batchId: response.batchId!,
          transactionHash: response.transactionHash,
          explorerUrl: response.explorerUrl!,
        } : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // show settlement toast notification if triggered
      if (response.settlementTriggered && response.transactionHash && response.explorerUrl) {
        setSettlementToast({
          txHash: response.transactionHash,
          explorerUrl: response.explorerUrl,
        });
        
        // auto-dismiss after 10 seconds
        setTimeout(() => setSettlementToast(null), 10000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // check if on correct network
  const isCorrectNetwork = chain?.id === 421614;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-950 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-8 h-8 text-[#28A0F0]" />
              <div>
                <h1 className="text-2xl font-bold text-white">Private AI with Intent-Based Payments</h1>
                <p className="text-sm text-slate-400">AP2 x x402 Demo on Arbitrum Sepolia</p>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {serviceHealth && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    serviceHealth.services.ollama === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-slate-300">Ollama</span>
                </div>
              )}

              {isConnected ? (
                <div className="flex items-center space-x-3">
                  {!isCorrectNetwork && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Switch to Arbitrum Sepolia</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 px-4 py-2 bg-[#28A0F0]/10 text-[#28A0F0] rounded-lg border border-[#28A0F0]/20">
                    <Wallet className="w-4 h-4" />
                    <span className="font-mono text-sm">
                      {address?.substring(0, 6)}...{address?.substring(38)}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="flex items-center space-x-2 px-6 py-2 bg-[#28A0F0] hover:bg-[#12AAFF] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#28A0F0]/20"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Wallet className="w-16 h-16 text-[#28A0F0] mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-300 text-center max-w-md">
              Connect your Arbitrum Sepolia wallet to start chatting with AI. Each message is metered and settled onchain via the x402 protocol.
            </p>
          </div>
        ) : isSigning ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-pulse mb-6">
              <CheckCircle className="w-20 h-20 text-[#28A0F0]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sign Intent Mandate</h2>
            <p className="text-slate-300 text-center max-w-md">
              Please sign the Intent Mandate in your wallet to authorize AI inference payments. This is a one-time signature that enables gasless settlements via EIP-3009.
            </p>
          </div>
        ) : isCreatingMandate ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin mb-6">
              <Cpu className="w-20 h-20 text-[#28A0F0]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Creating Mandate...</h2>
            <p className="text-slate-300 text-center max-w-md">
              Setting up your Intent Mandate for AI inference payments.
            </p>
          </div>
        ) : !mandate ? (
          <div className="py-12">
            {/* Section Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-white mb-3">How It Works</h2>
              <p className="text-slate-400 text-lg">Understanding the technology powering this demo</p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2" />
                  AP2 Metered AI
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-white">Agent Payments Protocol (AP2)</strong> is an open protocol for secure agent commerce. 
                  It uses verifiable digital credentials (Intent Mandates) to enable AI agents to make payments on your behalf.
                  <br /><br />
                  <span className="text-slate-400 italic">In this demo:</span> Each message costs $0.0001 USDC, metered and batched for settlement.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  x402 Settlement
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-white">x402 protocol</strong> is an open standard for internet-native payments built around HTTP 402. 
                  It enables instant, blockchain-agnostic settlements with zero protocol fees.
                  <br /><br />
                  <span className="text-slate-400 italic">In this demo:</span> Every 5 messages, your payment is settled onchain in seconds via a facilitator.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                  <Wallet className="w-6 h-6 mr-2" />
                  Intent Mandates
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-white">Intent Mandates</strong> are verifiable digital credentials that capture conditions under which an AI agent can make purchases on your behalf. 
                  They enable "human-not-present" transactions with pre-authorized spending limits.
                  <br /><br />
                  <span className="text-slate-400 italic">In this demo:</span> Your mandate is cryptographically signed and caps spending at 5 USDC daily.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                  <Cpu className="w-6 h-6 mr-2" />
                  Local AI Model
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong className="text-white">Complete privacy.</strong> All AI processing happens locally via Ollama. 
                  No data leaves your machine - your conversations remain private.
                  <br /><br />
                  <span className="text-slate-400 italic">In this demo:</span> Running llama3.1:8b via Docker for fast, private responses.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-slate-400 mb-4">Ready to start? Connect your wallet above to begin.</p>
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 text-blue-400 bg-blue-400/10 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Step 1: Sign Intent Mandate (AP2 compliant)</span>
                </div>
                <div className="inline-flex items-center space-x-2 text-purple-400 bg-purple-400/10 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Step 2: Approve USDC (one-time)</span>
                </div>
                <div className="inline-flex items-center space-x-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Step 3: Chat - automatic settlements!</span>
                </div>
              </div>
            </div>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Wrong Network</h2>
            <p className="text-slate-300 text-center max-w-md">
              Please switch to Arbitrum Sepolia (Chain ID: 421614) in your wallet.
            </p>
          </div>
        ) : !hasApproved && !isApproved ? (
          <div className="py-12">
            {/* Section Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-white mb-3">How It Works</h2>
              <p className="text-slate-400 text-lg">Understanding the technology powering this demo</p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* explanation cards */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                      <MessageSquare className="w-6 h-6 mr-2" />
                      AP2 Metered AI
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">Agent Payments Protocol (AP2)</strong> is an open protocol for secure agent commerce. 
                      It uses verifiable digital credentials to enable AI agents to make payments on your behalf.
                      <br /><br />
                      <span className="text-slate-400 italic">In this demo:</span> Each message costs $0.0001 USDC, metered and batched for settlement.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                      <CheckCircle className="w-6 h-6 mr-2" />
                      x402 Settlement
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">x402 protocol</strong> is an open standard for internet-native payments built around HTTP 402. 
                      It enables instant, blockchain-agnostic settlements with zero protocol fees.
                      <br /><br />
                      <span className="text-slate-400 italic">In this demo:</span> Every 5 messages, your payment is settled onchain in seconds via a facilitator.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                      <Wallet className="w-6 h-6 mr-2" />
                      Intent Mandates
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">Intent Mandates</strong> are verifiable digital credentials that capture conditions under which an AI agent can make purchases on your behalf. 
                      They enable "human-not-present" transactions with pre-authorized spending limits.
                      <br /><br />
                      <span className="text-slate-400 italic">In this demo:</span> Your mandate is cryptographically signed and caps spending at 5 USDC daily.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#28A0F0] mb-3 flex items-center">
                      <Cpu className="w-6 h-6 mr-2" />
                      Local AI Model
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      <strong className="text-white">Docker Model Runner</strong> enables local AI inference with complete privacy. 
                      No data leaves your machine - all processing happens locally, ensuring your conversations remain private.
                      <br /><br />
                      <span className="text-slate-400 italic">In this demo:</span> Running llama3.1:8b via Docker for fast, private responses.
                    </p>
                  </div>
                </div>
              </div>

              {/* approval section */}
              <div className="lg:col-span-2">
                <div className="sticky top-8">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#28A0F0] to-[#12AAFF] rounded-3xl mb-6 shadow-lg shadow-[#28A0F0]/30">
                        <DollarSign className="w-14 h-14 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-3">Approve USDC</h2>
                      <p className="text-slate-400 text-base">One-time approval to get started</p>
                    </div>
                  
                    <div className="space-y-6">
                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-[#28A0F0]/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-[#28A0F0]" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Payment Authorization</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              Approve up to <span className="text-[#28A0F0] font-bold text-xl">5 USDC</span> for automatic settlements. 
                              Payments are batched every 5 messages for gas efficiency.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={approveUSDC}
                        disabled={isApproving || isConfirming}
                        className="w-full flex items-center justify-center space-x-3 px-8 py-5 bg-gradient-to-r from-[#28A0F0] to-[#12AAFF] hover:from-[#12AAFF] hover:to-[#28A0F0] text-white rounded-xl font-bold text-xl transition-all hover:shadow-2xl hover:shadow-[#28A0F0]/50 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-7 h-7" />
                        <span>{isApproving || isConfirming ? 'Approving...' : 'Approve 5 USDC'}</span>
                      </button>
                      
                      {hash && (
                        <div className="pt-2">
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 text-[#28A0F0] hover:text-[#12AAFF] transition-colors text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View on Arbiscan</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* chat area */}
            <div className="lg:col-span-3">
              <div className="bg-slate-900 rounded-lg shadow-2xl overflow-hidden flex flex-col border border-slate-800" style={{ height: 'calc(100vh - 250px)' }}>
                {/* messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl rounded-lg px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-[#28A0F0] text-white'
                            : 'bg-slate-800 text-slate-100 border border-slate-700'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
                        {msg.priceMicroUsdc && (
                          <div className="mt-2 text-xs opacity-75">
                            Cost: ${(msg.priceMicroUsdc / 1000000).toFixed(4)} USDC
                          </div>
                        )}
                        
                        {msg.settlementInfo && (
                          <a
                            href={msg.settlementInfo.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center space-x-1 text-xs hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View on Explorer</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-[#28A0F0] rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-[#28A0F0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-[#28A0F0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* input area */}
                <div className="border-t border-slate-800 p-4 bg-slate-950">
                  {error && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isLoading || !mandate}
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28A0F0] disabled:bg-slate-900 text-white placeholder-slate-400"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim() || !mandate}
                      className="px-6 py-3 bg-[#28A0F0] hover:bg-[#12AAFF] text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed shadow-lg shadow-[#28A0F0]/20"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* stats sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {mandate && (
                <>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Usage Stats</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">Price per message</span>
                          <span className="font-mono text-[#28A0F0]">${(mandate.pricePerMessageMicroUsdc / 1000000).toFixed(4)} USDC</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">Daily cap</span>
                          <span className="font-mono text-[#28A0F0]">${(mandate.dailyCapMicroUsdc / 1000000).toFixed(2)} USDC</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">Batch threshold</span>
                          <span className="font-mono text-[#28A0F0]">{mandate.batchThreshold} msgs</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">Total messages</span>
                          <span className="font-mono text-[#28A0F0]">{messages.filter(m => m.role === 'user').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Model Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-slate-300">{mandate.modelName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-[#28A0F0]" />
                        <span className="text-slate-300">x402 Settlement</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#28A0F0]/10 border border-[#28A0F0]/20 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2 text-[#28A0F0]">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Each message costs ${(mandate.pricePerMessageMicroUsdc / 1000000).toFixed(4)} USDC</li>
                      <li>After {mandate.batchThreshold} messages, settlement triggers</li>
                      <li>Payment settles on Arbitrum Sepolia via x402</li>
                      <li>You get a transaction receipt</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-400 text-sm">
            Made with <span className="text-red-500">❤️</span> by the{' '}
            <a
              href="https://arbitrum.foundation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#28A0F0] hover:text-[#12AAFF] transition-colors font-medium"
            >
              Arbitrum DevRel Team
            </a>
          </p>
        </div>
      </footer>

      {/* settlement toast notification */}
      {settlementToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-2xl p-6 max-w-md border-2 border-green-400">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Settlement Successful!</h3>
                <p className="text-sm text-green-50 mb-3">
                  Your payment has been settled onchain via the x402 protocol.
                </p>
                <a
                  href={settlementToast.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Arbiscan</span>
                </a>
              </div>
              <button
                onClick={() => setSettlementToast(null)}
                className="flex-shrink-0 text-white hover:text-green-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
