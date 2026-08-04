// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {CampaignEscrow} from "../src/CampaignEscrow.sol";

/// @notice Deploy MockUSDC + CampaignEscrow. Oracle = deployer by default.
contract Deploy is Script {
    function run() external {
        address oracle = vm.envOr("ORACLE", msg.sender);

        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        CampaignEscrow escrow = new CampaignEscrow(address(usdc), oracle);
        // Seed deployer with demo USDC
        usdc.mint(msg.sender, 100_000e6);
        vm.stopBroadcast();

        console2.log("MockUSDC", address(usdc));
        console2.log("CampaignEscrow", address(escrow));
        console2.log("Oracle", oracle);
    }
}
