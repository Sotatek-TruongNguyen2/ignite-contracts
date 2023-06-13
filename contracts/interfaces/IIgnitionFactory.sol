// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "../interfaces/IVesting.sol";

interface IIgnitionFactory {
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    function ADMIN() external view returns (bytes32);

    function createVesting() external returns (address);
}
