// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "../interfaces/IIgnitionFactory.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IVesting.sol";

contract PoolStorage {
    /// @dev rate and decimal to display price of IDO token
    struct OfferedCurrency {
        uint rate;
        uint decimal;
    }

    /// @dev keccak256("WHALE")
    bytes32 public constant WHALE =
        0xed4b80c86c7954bdbf516c492acb4a2899eb0ee85b7c74e26d85e55a07562c95;

    /// @dev keccak256("NORMAL_USER")
    bytes32 public constant NORMAL_USER =
        0x13e31188d81b941f4c541528790db4031bef078b78d364bde6fc2d4e5ad79e01;

    /// @dev Percentage denominator
    uint16 public constant PERCENTAGE_DENOMINATOR = 10000;

    /// @dev Address of pool factory
    IIgnitionFactory public ignitionFactory;

    /// @dev Address of purchase token
    IERC20 public purchaseToken;

    /// @dev Store rate and decimal to display price of IDO token
    OfferedCurrency public offeredCurrency;

    /// @dev Max purchase amount for galaxy pool = total raise amount * galaxy pool proportion
    uint public maxPurchaseAmountForGalaxyPool;

    /// @dev Max purchase amount for early access = (total raise amount - total raise amount * galaxy pool proportion) * early access proportion
    uint public maxPurchaseAmountForEarlyAccess;

    /// @dev Max purchase amount for KYC user
    uint public maxPurchaseAmountForKYCUser;

    /// @dev Max purchase amount for NOT KYC user
    uint public maxPurchaseAmountForNotKYCUser;

    ///@dev Creation fee to create project
    uint16 public creationFeePercentage;

    /// @dev Fee percentage when buying token in galaxy pool
    uint16 public galaxyParticipationFeePercentage;

    /// @dev Fee percentage when buying token in crowdfunding pool
    uint16 public crowdfundingParticipationFeePercentage;

    /// @dev Proportion of total raise for galaxy pool
    uint16 public galaxyPoolProportion;

    /// @dev Proportion of crowdfunding pool amount for early access
    uint16 public earlyAccessProportion;

    /// @dev Status whether or not investor can redeem IDO token
    bool public TGERedeemable;

    /// @dev Total raise amount of all pools
    uint public totalRaiseAmount;

    /// @dev Open time of galaxy pool
    uint64 public whaleOpenTime;

    /// @dev Close time of galaxy pool
    uint64 public whaleCloseTime;

    /// @dev Open time for community user = Close time of galaxy pool
    uint64 public communityOpenTime;

    /// @dev Close time of crowdfunding pool
    uint64 public communityCloseTime;

    /// @dev Purchased amount in galaxy pool
    uint public purchasedAmountInGalaxyPool;

    /// @dev Purchased amount in early access
    uint public purchasedAmountInEarlyAccess;

    /// @dev Purchased amount in all pools
    uint public purchasedAmount;

    /// @dev Mapping from User to purchased amount
    mapping(address => uint) public userPurchasedAmount;

    /// @dev Vesting contract address
    IVesting vesting;
}
