// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CampaignEscrow — brand locks reward until creator hits metric
contract CampaignEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        None,
        Created,
        Funded,
        Submitted,
        Measured,
        Paid,
        Refunded
    }

    struct Campaign {
        address brand;
        uint256 rewardAmount;
        uint256 minMetric;
        uint64 deadline;
        Status status;
        uint256 metricValue;
        bool funded;
    }

    struct Submission {
        address creator;
        string contentUri;
        bool exists;
    }

    IERC20 public immutable usdc;
    address public oracle;

    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => Submission) private submissions;

    event CampaignCreated(
        uint256 indexed id,
        address indexed brand,
        uint256 rewardAmount,
        uint256 minMetric,
        uint64 deadline
    );
    event CampaignFunded(uint256 indexed id, uint256 amount);
    event ContentSubmitted(uint256 indexed id, address indexed creator, string contentUri);
    event MetricRecorded(uint256 indexed id, uint256 metricValue);
    event PayoutReleased(uint256 indexed id, address indexed creator, uint256 amount);
    event Refunded(uint256 indexed id, address indexed brand, uint256 amount);
    event OracleUpdated(address indexed oracle);

    error InvalidAmount();
    error InvalidDeadline();
    error InvalidStatus();
    error NotBrand();
    error NotOracleOrBrand();
    error AlreadySubmitted();
    error NoSubmission();
    error MetricNotMet();
    error DeadlineNotPassed();
    error EmptyUri();

    constructor(address usdc_, address oracle_) {
        require(usdc_ != address(0), "usdc=0");
        usdc = IERC20(usdc_);
        oracle = oracle_;
    }

    function setOracle(address oracle_) external {
        // For demo: first brand who created campaigns isn't gated; deployer is msg.sender at construct
        // Keep simple: anyone can set? No — only current oracle or if oracle unset allow anyone once.
        // Hackathon: oracle set in constructor; allow oracle to rotate.
        require(msg.sender == oracle || oracle == address(0), "not oracle");
        oracle = oracle_;
        emit OracleUpdated(oracle_);
    }

    function createCampaign(uint256 rewardAmount, uint256 minMetric, uint64 deadline)
        external
        returns (uint256 id)
    {
        if (rewardAmount == 0 || minMetric == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        id = nextCampaignId++;
        campaigns[id] = Campaign({
            brand: msg.sender,
            rewardAmount: rewardAmount,
            minMetric: minMetric,
            deadline: deadline,
            status: Status.Created,
            metricValue: 0,
            funded: false
        });

        emit CampaignCreated(id, msg.sender, rewardAmount, minMetric, deadline);
    }

    function fundCampaign(uint256 id) external nonReentrant {
        Campaign storage c = campaigns[id];
        if (c.status != Status.Created) revert InvalidStatus();
        if (msg.sender != c.brand) revert NotBrand();

        c.status = Status.Funded;
        c.funded = true;
        usdc.safeTransferFrom(msg.sender, address(this), c.rewardAmount);

        emit CampaignFunded(id, c.rewardAmount);
    }

    function submitContent(uint256 id, string calldata contentUri) external {
        Campaign storage c = campaigns[id];
        if (c.status != Status.Funded) revert InvalidStatus();
        if (bytes(contentUri).length == 0) revert EmptyUri();
        if (submissions[id].exists) revert AlreadySubmitted();

        submissions[id] = Submission({creator: msg.sender, contentUri: contentUri, exists: true});
        c.status = Status.Submitted;

        emit ContentSubmitted(id, msg.sender, contentUri);
    }

    function recordMetric(uint256 id, uint256 metricValue) external {
        Campaign storage c = campaigns[id];
        if (c.status != Status.Submitted) revert InvalidStatus();
        if (msg.sender != c.brand && msg.sender != oracle) revert NotOracleOrBrand();

        c.metricValue = metricValue;
        c.status = Status.Measured;

        emit MetricRecorded(id, metricValue);
    }

    function releasePayout(uint256 id) external nonReentrant {
        Campaign storage c = campaigns[id];
        if (c.status != Status.Measured) revert InvalidStatus();
        if (!submissions[id].exists) revert NoSubmission();
        if (c.metricValue < c.minMetric) revert MetricNotMet();

        address creator = submissions[id].creator;
        uint256 amount = c.rewardAmount;
        c.status = Status.Paid;
        c.funded = false;

        usdc.safeTransfer(creator, amount);
        emit PayoutReleased(id, creator, amount);
    }

    function refund(uint256 id) external nonReentrant {
        Campaign storage c = campaigns[id];
        if (msg.sender != c.brand) revert NotBrand();
        if (block.timestamp <= c.deadline) revert DeadlineNotPassed();
        if (c.status != Status.Funded && c.status != Status.Submitted && c.status != Status.Measured) {
            revert InvalidStatus();
        }
        if (c.status == Status.Measured && c.metricValue >= c.minMetric) revert InvalidStatus();

        uint256 amount = c.rewardAmount;
        c.status = Status.Refunded;
        c.funded = false;

        usdc.safeTransfer(c.brand, amount);
        emit Refunded(id, c.brand, amount);
    }

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return campaigns[id];
    }

    function getSubmission(uint256 id)
        external
        view
        returns (address creator, string memory contentUri, bool exists)
    {
        Submission memory s = submissions[id];
        return (s.creator, s.contentUri, s.exists);
    }

    function campaignCount() external view returns (uint256) {
        return nextCampaignId - 1;
    }
}
