// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {CampaignEscrow} from "../src/CampaignEscrow.sol";

contract CampaignEscrowTest is Test {
    MockUSDC usdc;
    CampaignEscrow escrow;

    address brand = makeAddr("brand");
    address creator = makeAddr("creator");
    address oracle = makeAddr("oracle");
    address stranger = makeAddr("stranger");

    uint256 constant REWARD = 100e6; // 100 mUSDC
    uint256 constant MIN_VIEWS = 10_000;

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new CampaignEscrow(address(usdc), oracle);

        usdc.mint(brand, 1_000e6);
        vm.prank(brand);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _deadline() internal view returns (uint64) {
        return uint64(block.timestamp + 7 days);
    }

    function _createAndFund() internal returns (uint256 id) {
        vm.prank(brand);
        id = escrow.createCampaign(REWARD, MIN_VIEWS, _deadline());
        vm.prank(brand);
        escrow.fundCampaign(id);
    }

    function test_happyPath_release() public {
        uint256 id = _createAndFund();
        assertEq(usdc.balanceOf(address(escrow)), REWARD);

        vm.prank(creator);
        escrow.submitContent(id, "https://tiktok.com/@x/video/1");

        vm.prank(oracle);
        escrow.recordMetric(id, MIN_VIEWS);

        vm.prank(brand);
        escrow.releasePayout(id);

        assertEq(usdc.balanceOf(creator), REWARD);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        CampaignEscrow.Campaign memory c = escrow.getCampaign(id);
        assertEq(uint8(c.status), uint8(CampaignEscrow.Status.Paid));
    }

    function test_brandCanRecordMetric() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitContent(id, "uri");
        vm.prank(brand);
        escrow.recordMetric(id, MIN_VIEWS + 1);
        CampaignEscrow.Campaign memory c = escrow.getCampaign(id);
        assertEq(c.metricValue, MIN_VIEWS + 1);
    }

    function test_refundAfterDeadlineUnmet() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitContent(id, "uri");
        vm.prank(oracle);
        escrow.recordMetric(id, MIN_VIEWS - 1);

        vm.warp(block.timestamp + 8 days);
        uint256 before = usdc.balanceOf(brand);
        vm.prank(brand);
        escrow.refund(id);
        assertEq(usdc.balanceOf(brand), before + REWARD);
    }

    function test_revert_fundNotBrand() public {
        vm.prank(brand);
        uint256 id = escrow.createCampaign(REWARD, MIN_VIEWS, _deadline());
        vm.prank(stranger);
        vm.expectRevert(CampaignEscrow.NotBrand.selector);
        escrow.fundCampaign(id);
    }

    function test_revert_doubleSubmit() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitContent(id, "a");
        vm.prank(stranger);
        vm.expectRevert(CampaignEscrow.InvalidStatus.selector);
        escrow.submitContent(id, "b");
    }

    function test_revert_releaseBelowMetric() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitContent(id, "uri");
        vm.prank(oracle);
        escrow.recordMetric(id, MIN_VIEWS - 1);
        vm.expectRevert(CampaignEscrow.MetricNotMet.selector);
        escrow.releasePayout(id);
    }

    function test_revert_refundBeforeDeadline() public {
        uint256 id = _createAndFund();
        vm.prank(brand);
        vm.expectRevert(CampaignEscrow.DeadlineNotPassed.selector);
        escrow.refund(id);
    }

    function test_revert_strangerRecordMetric() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitContent(id, "uri");
        vm.prank(stranger);
        vm.expectRevert(CampaignEscrow.NotOracleOrBrand.selector);
        escrow.recordMetric(id, MIN_VIEWS);
    }

    function test_getSubmission() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitContent(id, "https://example.com");
        (address c, string memory uri, bool exists) = escrow.getSubmission(id);
        assertEq(c, creator);
        assertEq(uri, "https://example.com");
        assertTrue(exists);
    }

    function test_mintDecimals() public {
        assertEq(usdc.decimals(), 6);
        usdc.mint(stranger, 5e6);
        assertEq(usdc.balanceOf(stranger), 5e6);
    }
}
