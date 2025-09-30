// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAdapter {
    function swap(address sell, address buy, uint256 sellAmount, uint256 minBuyAmount, bytes calldata data)
        external
        returns (uint256 bought);
}
