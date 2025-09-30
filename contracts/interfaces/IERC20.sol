// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 v) external returns (bool);
    function transferFrom(address f, address to, uint256 v) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IMintable {
    function mint(address to, uint256 amount) external;
}
