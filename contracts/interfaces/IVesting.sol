// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

interface IVesting {
    function initialize(
        address owner,
        address _IDOToken,
        uint _TGEDate,
        uint _TGEPercentage,
        uint _vestingCliff,
        uint _vestingDuration
    ) external;
}
