// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/Token/TestUSDC.sol";
import "../contracts/Token/TestWETH.sol";
import "../contracts/adapters/MockAdapter.sol";
import "../contracts/ComposableExecutor.sol";

contract Seed is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Read deployed addresses
        string memory addressesJson = vm.readFile("out/addresses.sepolia.json");
        address usdcAddr = vm.parseJsonAddress(addressesJson, ".usdc");
        address wethAddr = vm.parseJsonAddress(addressesJson, ".weth");
        address mockAdapterAddr = vm.parseJsonAddress(addressesJson, ".mockAdapter");
        address executorAddr = vm.parseJsonAddress(addressesJson, ".executor");

        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        TestUSDC usdc = TestUSDC(usdcAddr);
        TestWETH weth = TestWETH(wethAddr);
        MockAdapter mockAdapter = MockAdapter(mockAdapterAddr);
        ComposableExecutor executor = ComposableExecutor(executorAddr);

        // Mint tokens to deployer for testing
        // USDC: 1000 tokens (6 decimals)
        usdc.mint(deployer, 1000 * 10**6);
        
        // WETH: 10 tokens (18 decimals) 
        weth.mint(deployer, 10 * 10**18);

        // Mint WETH to MockAdapter for inventory (100 WETH)
        weth.mint(address(mockAdapter), 100 * 10**18);

        // Approve executor to spend deployer's USDC
        usdc.approve(address(executor), type(uint256).max);

        // Approve mock adapter to spend deployer's tokens (for testing)
        usdc.approve(address(mockAdapter), type(uint256).max);
        weth.approve(address(mockAdapter), type(uint256).max);

        vm.stopBroadcast();

        console.log("Seeding completed:");
        console.log("Minted 1000 USDC to deployer:", deployer);
        console.log("Minted 10 WETH to deployer:", deployer);
        console.log("Minted 100 WETH to MockAdapter for inventory");
        console.log("Set approvals for executor and adapter");
    }
}
