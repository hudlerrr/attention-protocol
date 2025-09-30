// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract QuoteRegistry {
    mapping(bytes32 => bool) public used;

    event QuoteRegistered(bytes32 indexed intentHash, address indexed signer, uint256 expiry);

    function register(bytes32 intentHash, address signer, uint256 expiry) external {
        require(!used[intentHash], "replay");
        used[intentHash] = true;
        emit QuoteRegistered(intentHash, signer, expiry);
    }
}
