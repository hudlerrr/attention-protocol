// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/Token/TestUSDC.sol";
import "../contracts/Token/TestWETH.sol";
import "../contracts/QuoteRegistry.sol";
import "../contracts/adapters/MockAdapter.sol";
import "../contracts/ComposableExecutor.sol";

contract ExecutorTest is Test {
    TestUSDC public usdc;
    TestWETH public weth;
    QuoteRegistry public quoteRegistry;
    MockAdapter public mockAdapter;
    ComposableExecutor public executor;

    address public user = address(0x1);
    address public signer = vm.addr(0x2);
    uint256 public signerPrivateKey = 0x2;
    address public recipient = address(0x3);

    uint256 constant MOCK_RATE_NUM = 995000;
    uint256 constant MOCK_RATE_DEN = 1000000;

    function setUp() public {
        // Deploy contracts
        usdc = new TestUSDC();
        weth = new TestWETH();
        quoteRegistry = new QuoteRegistry();
        mockAdapter = new MockAdapter(MOCK_RATE_NUM, MOCK_RATE_DEN);
        executor = new ComposableExecutor(address(quoteRegistry));

        // Set trusted signer
        executor.setTrustedSigner(signer, true);

        // Mint tokens to user
        usdc.mint(user, 1000 * 10**6); // 1000 USDC
        weth.mint(address(mockAdapter), 100 * 10**18); // 100 WETH to adapter for inventory

        // Set approvals
        vm.prank(user);
        usdc.approve(address(executor), type(uint256).max);
    }

    function testExecuteSwapHappyPath() public {
        // Create quote
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: user,
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6, // 100 USDC
            minBuy: 99 * 10**6, // Expect around 99.5 USDC worth (accounting for rate and decimals)
            deadline: block.timestamp + 300,
            chainId: block.chainid,
            nonce: keccak256("test-nonce-1")
        });

        // Sign quote
        bytes memory signature = _signQuote(quote);

        // Record initial balances
        uint256 userUsdcBefore = usdc.balanceOf(user);
        uint256 recipientWethBefore = weth.balanceOf(recipient);

        // Execute swap
        vm.prank(user);
        uint256 bought = executor.executeSwap(
            quote,
            signature,
            address(mockAdapter),
            "",
            recipient
        );

        // Verify balances
        assertEq(usdc.balanceOf(user), userUsdcBefore - quote.sellAmount);
        assertEq(weth.balanceOf(recipient), recipientWethBefore + bought);
        
        // Verify bought amount matches expected rate
        uint256 expectedBought = quote.sellAmount * MOCK_RATE_NUM / MOCK_RATE_DEN;
        assertEq(bought, expectedBought);
        assertGe(bought, quote.minBuy);

        // Verify quote is marked as used
        assertTrue(quoteRegistry.used(quote.nonce));
    }

    function testExecuteSwapReplayFails() public {
        // Create and execute first swap
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: user,
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6,
            minBuy: 99 * 10**6,
            deadline: block.timestamp + 300,
            chainId: block.chainid,
            nonce: keccak256("test-nonce-2")
        });

        bytes memory signature = _signQuote(quote);

        vm.prank(user);
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);

        // Try to replay the same quote
        vm.prank(user);
        vm.expectRevert("replay");
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);
    }

    function testExecuteSwapWrongSignerFails() public {
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: user,
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6,
            minBuy: 99 * 10**6,
            deadline: block.timestamp + 300,
            chainId: block.chainid,
            nonce: keccak256("test-nonce-3")
        });

        // Sign with wrong key
        uint256 wrongKey = 0x999;
        bytes memory signature = _signQuoteWithKey(quote, wrongKey);

        vm.prank(user);
        vm.expectRevert("untrusted signer");
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);
    }

    function testExecuteSwapExpiredFails() public {
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: user,
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6,
            minBuy: 99 * 10**6,
            deadline: block.timestamp - 1, // Expired
            chainId: block.chainid,
            nonce: keccak256("test-nonce-4")
        });

        bytes memory signature = _signQuote(quote);

        vm.prank(user);
        vm.expectRevert("expired");
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);
    }

    function testExecuteSwapSlippageFails() public {
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: user,
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6,
            minBuy: 100 * 10**6, // Too high, will cause slippage failure
            deadline: block.timestamp + 300,
            chainId: block.chainid,
            nonce: keccak256("test-nonce-5")
        });

        bytes memory signature = _signQuote(quote);

        vm.prank(user);
        vm.expectRevert("slippage");
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);
    }

    function testExecuteSwapWrongChainFails() public {
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: user,
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6,
            minBuy: 99 * 10**6,
            deadline: block.timestamp + 300,
            chainId: 999, // Wrong chain
            nonce: keccak256("test-nonce-6")
        });

        bytes memory signature = _signQuote(quote);

        vm.prank(user);
        vm.expectRevert("wrong chain");
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);
    }

    function testExecuteSwapWrongSenderFails() public {
        ComposableExecutor.Quote memory quote = ComposableExecutor.Quote({
            from: address(0x999), // Wrong sender
            sell: address(usdc),
            buy: address(weth),
            sellAmount: 100 * 10**6,
            minBuy: 99 * 10**6,
            deadline: block.timestamp + 300,
            chainId: block.chainid,
            nonce: keccak256("test-nonce-7")
        });

        bytes memory signature = _signQuote(quote);

        vm.prank(user);
        vm.expectRevert("wrong sender");
        executor.executeSwap(quote, signature, address(mockAdapter), "", recipient);
    }

    function testTrustedSignerManagement() public {
        address newSigner = address(0x4);
        
        // Only owner can set trusted signer
        vm.prank(address(0x999));
        vm.expectRevert("not owner");
        executor.setTrustedSigner(newSigner, true);

        // Owner can set trusted signer
        executor.setTrustedSigner(newSigner, true);
        assertTrue(executor.trustedSigners(newSigner));

        // Owner can remove trusted signer
        executor.setTrustedSigner(newSigner, false);
        assertFalse(executor.trustedSigners(newSigner));
    }

    function _signQuote(ComposableExecutor.Quote memory quote) internal view returns (bytes memory) {
        return _signQuoteWithKey(quote, signerPrivateKey);
    }

    function _signQuoteWithKey(ComposableExecutor.Quote memory quote, uint256 privateKey) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Quote(address from,address sell,address buy,uint256 sellAmount,uint256 minBuy,uint256 deadline,uint256 chainId,bytes32 nonce)"),
                quote.from,
                quote.sell,
                quote.buy,
                quote.sellAmount,
                quote.minBuy,
                quote.deadline,
                quote.chainId,
                quote.nonce
            )
        );

        bytes32 domainSeparator = executor.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
