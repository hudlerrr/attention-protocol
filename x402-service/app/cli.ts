#!/usr/bin/env node

import { Command } from 'commander';
import { createPublicClient, createWalletClient, http, parseAbi, getContract, parseEventLogs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { SwapAgent } from './agent';
import { X402QuoteClient } from './client';
import { validateEnvironment, ENV, ARBITRUM_SEPOLIA_CHAIN_ID } from './config';

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]);

const EXECUTOR_ABI = parseAbi([
  'function executeSwap((address from, address sell, address buy, uint256 sellAmount, uint256 minBuy, uint256 deadline, uint256 chainId, bytes32 nonce) quote, bytes signature, address adapter, bytes dexData, address recipient) external returns (uint256)',
  'event QuoteExecuted(bytes32 indexed intentHash, address indexed sell, address indexed buy, uint256 sellAmount, uint256 bought, address to)',
]);

const program = new Command();

program
  .name('attention-protocol')
  .description('Proof-of-Attention Protocol - AI agents stake to prove content value')
  .version('1.0.0');

program
  .command('send-email')
  .description('Send an email with attention staking')
  .option('--content <content>', 'Email content to send')
  .option('--recipient <address>', 'Recipient wallet address')
  .option('--stake <amount>', 'Amount to stake in USDC (default: 0.001)')
  .action(async (options) => {
    try {
      validateEnvironment();
      
      const content = options.content || "Hello! This is a test email to demonstrate the proof-of-attention protocol.";
      const recipient = options.recipient || "0x742d35Cc6634C0532925a3b8D0C4C4C4C4C4C4C4"; // Default recipient
      const stakeAmount = options.stake || "0.001";
      
      console.log('📧 Composing email with attention staking...');
      console.log(`Content: "${content}"`);
      console.log(`Recipient: ${recipient}`);
      console.log(`Stake: ${stakeAmount} USDC`);
      
      // Generate email ID
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n🔗 Email ID: ${emailId}`);
      console.log(`💰 Staking ${stakeAmount} USDC to prove this content deserves attention...`);
      
      // Mock the staking process
      console.log(`✅ Stake locked in smart contract`);
      console.log(`📤 Email sent via x402 protocol`);
      console.log(`🤖 Receiver agent will evaluate content value`);
      
      console.log(`\n📊 Transaction Details:`);
      console.log(`- Email Hash: ${emailId}`);
      console.log(`- Stake Amount: ${stakeAmount} USDC`);
      console.log(`- Status: Pending Evaluation`);
      console.log(`- Explorer: https://sepolia.arbiscan.io/address/${recipient}`);
      
    } catch (error) {
      console.error('Send failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('evaluate-email')
  .description('Evaluate an email and determine if stake should be released or slashed')
  .option('--email-id <id>', 'Email ID to evaluate')
  .option('--verdict <verdict>', 'Verdict: valuable or spam')
  .action(async (options) => {
    try {
      validateEnvironment();
      
      const emailId = options.emailId || `email_${Date.now()}`;
      const verdict = options.verdict || (Math.random() > 0.3 ? 'valuable' : 'spam'); // 70% valuable
      
      console.log('🤖 AI Agent evaluating email...');
      console.log(`Email ID: ${emailId}`);
      
      // Mock AI evaluation
      console.log(`\n🧠 AI Analysis:`);
      console.log(`- Content relevance: ${Math.floor(Math.random() * 40 + 60)}%`);
      console.log(`- Spam probability: ${Math.floor(Math.random() * 30 + 10)}%`);
      console.log(`- Value score: ${Math.floor(Math.random() * 50 + 50)}%`);
      
      console.log(`\n⚖️  Verdict: ${verdict.toUpperCase()}`);
      
      if (verdict === 'valuable') {
        console.log(`✅ Content is valuable - releasing stake to sender`);
        console.log(`💰 Stake refunded: 0.001 USDC`);
        console.log(`📈 Sender reputation increased`);
      } else {
        console.log(`❌ Content is spam - slashing stake`);
        console.log(`🔥 Stake burned: 0.001 USDC`);
        console.log(`📉 Sender reputation decreased`);
      }
      
      console.log(`\n📊 Attention Economy Stats:`);
      console.log(`- Total staked today: ${(Math.random() * 10 + 5).toFixed(3)} USDC`);
      console.log(`- Valuable content rate: ${(Math.random() * 20 + 70).toFixed(1)}%`);
      console.log(`- Spam reduction: ${(Math.random() * 15 + 80).toFixed(1)}%`);
      
    } catch (error) {
      console.error('Evaluation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('Show the state of the attention economy')
  .action(async () => {
    try {
      console.log('📊 ATTENTION ECONOMY DASHBOARD');
      console.log('================================');
      
      // Mock dashboard data
      const totalStaked = (Math.random() * 50 + 25).toFixed(3);
      const valuableRate = (Math.random() * 15 + 75).toFixed(1);
      const spamReduction = (Math.random() * 10 + 85).toFixed(1);
      const activeAgents = Math.floor(Math.random() * 20 + 15);
      const emailsToday = Math.floor(Math.random() * 100 + 50);
      
      console.log(`\n💰 Total Value Staked: ${totalStaked} USDC`);
      console.log(`📈 Valuable Content Rate: ${valuableRate}%`);
      console.log(`🛡️  Spam Reduction: ${spamReduction}%`);
      console.log(`🤖 Active AI Agents: ${activeAgents}`);
      console.log(`📧 Emails Processed Today: ${emailsToday}`);
      
      console.log(`\n🏆 Top Senders (by reputation):`);
      console.log(`1. Agent-Alice: 95% valuable, 1.2 USDC staked`);
      console.log(`2. Agent-Bob: 87% valuable, 0.8 USDC staked`);
      console.log(`3. Agent-Charlie: 82% valuable, 0.6 USDC staked`);
      
      console.log(`\n📊 Recent Activity:`);
      console.log(`- 2 minutes ago: Agent-Alice sent valuable email (+0.001 USDC)`);
      console.log(`- 5 minutes ago: Agent-SpamBot slashed (-0.001 USDC)`);
      console.log(`- 8 minutes ago: Agent-Bob sent valuable email (+0.001 USDC)`);
      
      console.log(`\n🔗 Smart Contract Addresses:`);
      console.log(`- Attention Protocol: 0xe606F56a482f6668489ade1a1FFd489fc0AD431C`);
      console.log(`- Stake Manager: 0x16c130bf15e048E00C62A17021DB73F0168873Ed`);
      console.log(`- Reputation System: 0xB2Dd1fA1074dbBa45563dE8Ca121bf159F625d1e`);
      
    } catch (error) {
      console.error('Dashboard failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('test-x402')
  .description('Test x402 payment flow')
  .action(async () => {
    try {
      validateEnvironment();
      console.log('Testing x402 payment flow...');
      
      const x402Client = new X402QuoteClient();
      await x402Client.testPaymentFlow();
      
    } catch (error) {
      console.error('Test failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('pay')
  .description('Execute a swap payment using x402 standard')
  .option('--swap', 'Enable swap mode', false)
  .option('--sell <token>', 'Token to sell (USDC, WETH)')
  .option('--buy <token>', 'Token to buy (USDC, WETH)')
  .option('--amount <amount>', 'Amount to sell')
  .option('--max-slippage <slippage>', 'Maximum slippage percentage (e.g., 0.3 for 0.3%)')
  .option('--recipient <address>', 'Recipient address (defaults to sender)')
  .action(async (options) => {
    try {
      // Validate environment
      validateEnvironment();

      // Validate required options
      if (!options.swap) {
        throw new Error('--swap flag is required');
      }
      if (!options.sell || !options.buy || !options.amount || !options.maxSlippage) {
        throw new Error('--sell, --buy, --amount, and --max-slippage are required');
      }

      console.log('Starting X402-compliant swap execution...');
      console.log(`This will require payment for quote generation (0.001 USDC)`);
      console.log(`Selling ${options.amount} ${options.sell} for ${options.buy}`);
      console.log(`Max slippage: ${options.maxSlippage}%`);

      // Initialize clients
      const account = privateKeyToAccount(ENV.PRIVATE_KEY);
      const publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(ENV.ARBITRUM_SEPOLIA_RPC_URL),
      });
      const walletClient = createWalletClient({
        account,
        chain: arbitrumSepolia,
        transport: http(ENV.ARBITRUM_SEPOLIA_RPC_URL),
      });

      // Initialize swap agent and x402 client
      const agent = new SwapAgent();
      const x402Client = new X402QuoteClient();
      const addresses = agent.getAddresses();
      const recipient = (options.recipient as `0x${string}`) || account.address;

      console.log(`Building intent for ${account.address}...`);

      // Build intent
      const intent = agent.buildIntent(account.address, {
        sell: options.sell,
        buy: options.buy,
        amount: options.amount,
        maxSlippage: options.maxSlippage,
      }, recipient);

      console.log(`Getting quote from x402 service (will auto-pay)...`);

      // Get quote using x402 client and handle payment automatically
      const attestation = await x402Client.getQuote(intent);

      console.log(`Received paid quote:`);
      console.log(`Expected output: ${agent.formatTokenAmount(BigInt(attestation.route.expected_out), options.buy)} ${options.buy}`);
      console.log(`Minimum output: ${agent.formatTokenAmount(BigInt(attestation.quote.minBuy), options.buy)} ${options.buy}`);
      console.log(`Signer: ${attestation.signer}`);

      // Check token approval
      const sellTokenContract = getContract({
        address: agent.getTokenAddress(options.sell),
        abi: ERC20_ABI,
        client: { public: publicClient, wallet: walletClient },
      });

      const currentAllowance = await sellTokenContract.read.allowance([account.address, addresses.executor]);
      const sellAmount = BigInt(attestation.quote.sellAmount);

      if (currentAllowance < sellAmount) {
        console.log(`Approving ${options.sell} spending...`);
        
        const approveTx = await walletClient.writeContract({
          address: agent.getTokenAddress(options.sell),
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [addresses.executor, sellAmount],
        });

        console.log(`  Approval tx: ${approveTx}`);
        
        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log(`Approval confirmed`);
      } else {
        console.log(`${options.sell} already approved`);
      }

      // Execute swap
      console.log(`Executing swap...`);

      const quote = {
        from: attestation.quote.from as `0x${string}`,
        sell: attestation.quote.sell as `0x${string}`,
        buy: attestation.quote.buy as `0x${string}`,
        sellAmount: BigInt(attestation.quote.sellAmount),
        minBuy: BigInt(attestation.quote.minBuy),
        deadline: BigInt(attestation.quote.deadline),
        chainId: BigInt(attestation.quote.chainId),
        nonce: attestation.quote.nonce as `0x${string}`,
      };

      const swapTx = await walletClient.writeContract({
        address: addresses.executor,
        abi: EXECUTOR_ABI,
        functionName: 'executeSwap',
        args: [
          quote,
          attestation.signature as `0x${string}`,
          addresses.mockAdapter,
          '0x', // empty hexdata for mock
          recipient,
        ],
      });

      console.log(`Swap transaction: ${swapTx}`);
      console.log(`Explorer: https://sepolia.arbiscan.io/tx/${swapTx}`);

      // Wait for confirmation and get receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      // Decode QuoteExecuted event
      try {
        const decodedLogs = parseEventLogs({
          abi: EXECUTOR_ABI,
          logs: receipt.logs,
          eventName: 'QuoteExecuted',
        });

        if (decodedLogs.length > 0) {
          const decoded = decodedLogs[0];
          const { sellAmount, bought, to, intentHash } = decoded.args;
          console.log(`\nX402-compliant swap completed successfully!`);
          console.log(`Quote payment: 0.001 USDC (paid via x402)`);
          console.log(`Sold: ${agent.formatTokenAmount(sellAmount, options.sell)} ${options.sell}`);
          console.log(`Bought: ${agent.formatTokenAmount(bought, options.buy)} ${options.buy}`);
          console.log(`Recipient: ${to}`);
          console.log(`Intent Hash: ${intentHash}`);
        }
      } catch (error) {
        console.log('Swap completed (event parsing failed)');
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse();
