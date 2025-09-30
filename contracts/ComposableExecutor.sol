// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./utils/EIP712.sol";
import "./QuoteRegistry.sol";
import "./adapters/IAdapter.sol";
import "./interfaces/IERC20.sol";

contract ComposableExecutor is EIP712 {
    struct Quote {
        address from;
        address sell;
        address buy;
        uint256 sellAmount;
        uint256 minBuy;
        uint256 deadline;
        uint256 chainId;
        bytes32 nonce;
    }

    bytes32 private constant QUOTE_TYPEHASH = keccak256(
        "Quote(address from,address sell,address buy,uint256 sellAmount,uint256 minBuy,uint256 deadline,uint256 chainId,bytes32 nonce)"
    );

    QuoteRegistry public immutable quoteRegistry;
    mapping(address => bool) public trustedSigners;
    address public owner;

    event QuoteExecuted(
        bytes32 indexed intentHash,
        address indexed sell,
        address indexed buy,
        uint256 sellAmount,
        uint256 bought,
        address to
    );

    event TrustedSignerUpdated(address indexed signer, bool trusted);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _quoteRegistry) EIP712("X402Quote", "1") {
        quoteRegistry = QuoteRegistry(_quoteRegistry);
        owner = msg.sender;
    }

    function setTrustedSigner(address signer, bool trusted) external onlyOwner {
        trustedSigners[signer] = trusted;
        emit TrustedSignerUpdated(signer, trusted);
    }

    function executeSwap(
        Quote calldata q,
        bytes calldata sig,
        address adapter,
        bytes calldata dexData,
        address recipient
    ) external returns (uint256 bought) {
        // Validate quote parameters
        require(q.from == msg.sender, "wrong sender");
        require(q.chainId == block.chainid, "wrong chain");
        require(q.deadline >= block.timestamp, "expired");

        // Verify EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                QUOTE_TYPEHASH,
                q.from,
                q.sell,
                q.buy,
                q.sellAmount,
                q.minBuy,
                q.deadline,
                q.chainId,
                q.nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = _recoverSigner(digest, sig);
        require(trustedSigners[signer], "untrusted signer");

        // Register quote to prevent replay
        quoteRegistry.register(q.nonce, signer, q.deadline);

        // Pull sell token from sender
        require(
            IERC20(q.sell).transferFrom(msg.sender, address(this), q.sellAmount),
            "transfer failed"
        );

        // Approve adapter to spend sell token
        require(IERC20(q.sell).approve(adapter, q.sellAmount), "adapter approval failed");

        // Execute swap through adapter
        uint256 balanceBefore = IERC20(q.buy).balanceOf(address(this));
        bought = IAdapter(adapter).swap(q.sell, q.buy, q.sellAmount, q.minBuy, dexData);
        uint256 balanceAfter = IERC20(q.buy).balanceOf(address(this));
        
        // Verify we received the expected amount
        require(balanceAfter >= balanceBefore + bought, "adapter mismatch");
        require(bought >= q.minBuy, "insufficient output");

        // Send bought tokens to recipient
        require(IERC20(q.buy).transfer(recipient, bought), "recipient transfer failed");

        emit QuoteExecuted(q.nonce, q.sell, q.buy, q.sellAmount, bought, recipient);
    }

    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        return ecrecover(digest, v, r, s);
    }
}
