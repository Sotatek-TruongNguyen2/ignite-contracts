// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VestingStorage {
    /// @dev keccak256("OWNER")
    bytes32 public constant OWNER =
        0x6270edb7c868f86fda4adedba75108201087268ea345934db8bad688e1feb91b;

    /// @dev Percentage denominator
    uint16 public constant PERCENTAGE_DENOMINATOR = 10000;

    /// @dev Address of IDO token
    IERC20 public IDOToken;

    /// @dev Time for user to redeem IDO token
    uint64 public TGEDate;

    /// @dev Percentage of IDO token amount of user, which can be redeemed after TGEDate
    uint16 public TGEPercentage;

    /// @dev Vesting cliff
    uint64 public vestingCliff;

    /// @dev Vesting duration
    uint64 public vestingDuration;
}
