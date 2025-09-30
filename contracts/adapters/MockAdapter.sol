// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IAdapter.sol";
import "../interfaces/IERC20.sol";

contract MockAdapter is IAdapter {
    uint256 public immutable num;
    uint256 public immutable den;

    constructor(uint256 _num, uint256 _den) {
        num = _num;
        den = _den;
    }

    function swap(address sell, address buy, uint256 sellAmount, uint256 minBuyAmount, bytes calldata)
        external
        override
        returns (uint256 bought)
    {
        // Pull sell token from caller
        require(IERC20(sell).transferFrom(msg.sender, address(this), sellAmount), "pull fail");

        // Deterministic rate
        bought = sellAmount * num / den;
        require(bought >= minBuyAmount, "slippage");

        // For demo, mint buy tokens to this contract if needed, then transfer to caller
        uint256 balance = IERC20(buy).balanceOf(address(this));
        if (balance < bought) {
            IMintable(buy).mint(address(this), bought - balance);
        }
        
        require(IERC20(buy).transfer(msg.sender, bought), "send fail");
    }
}
