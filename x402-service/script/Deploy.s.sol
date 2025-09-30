// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/Token/TestUSDC.sol";
import "../contracts/Token/TestWETH.sol";
import "../contracts/QuoteRegistry.sol";
import "../contracts/adapters/MockAdapter.sol";
import "../contracts/ComposableExecutor.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address quoteServiceSigner = vm.addr(vm.envUint("QUOTE_SERVICE_PRIVATE_KEY"));
        uint256 mockRateNum = vm.envUint("MOCK_RATE_NUMERATOR");
        uint256 mockRateDen = vm.envUint("MOCK_RATE_DENOMINATOR");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy tokens
        TestUSDC usdc = new TestUSDC();
        TestWETH weth = new TestWETH();

        // Deploy quote registry
        QuoteRegistry quoteRegistry = new QuoteRegistry();

        // Deploy mock adapter with configured rate
        MockAdapter mockAdapter = new MockAdapter(mockRateNum, mockRateDen);

        // Deploy composable executor
        ComposableExecutor executor = new ComposableExecutor(address(quoteRegistry));

        // Set trusted signer
        executor.setTrustedSigner(quoteServiceSigner, true);

        vm.stopBroadcast();

        // Write addresses to JSON file
        string memory addresses = string(
            abi.encodePacked(
                '{"usdc":"', vm.toString(address(usdc)),
                '","weth":"', vm.toString(address(weth)),
                '","quoteRegistry":"', vm.toString(address(quoteRegistry)),
                '","mockAdapter":"', vm.toString(address(mockAdapter)),
                '","executor":"', vm.toString(address(executor)),
                '","quoteServiceSigner":"', vm.toString(quoteServiceSigner),
                '"}'
            )
        );

        vm.writeFile("out/addresses.sepolia.json", addresses);

        console.log("Deployed addresses:");
        console.log("TestUSDC:", address(usdc));
        console.log("TestWETH:", address(weth));
        console.log("QuoteRegistry:", address(quoteRegistry));
        console.log("MockAdapter:", address(mockAdapter));
        console.log("ComposableExecutor:", address(executor));
        console.log("Quote Service Signer:", quoteServiceSigner);
    }
}
