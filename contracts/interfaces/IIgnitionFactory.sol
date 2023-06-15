// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "../interfaces/IVesting.sol";

interface IIgnitionFactory {
    function isOwner(address sender) external view returns (bool);

    function createVesting() external returns (address);
}
