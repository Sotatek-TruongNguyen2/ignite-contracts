// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "../interfaces/IERC20withDec.sol";

interface IVesting {
    function initialize(
        address owner,
        address _IDOToken,
        uint _TGEDate,
        uint _TGEPercentage,
        uint _vestingCliff,
        uint _vestingFrequency,
        uint _numberOfVestingRelease
    ) external;

    function createVestingSchedule(address _user, uint _totalAmount) external;

    function setIDOToken(IERC20withDec _IDOToken) external;

    function getIDOToken() external view returns (IERC20withDec);

    function setFundedStatus(bool _status) external;

    function setClaimableStatus(bool _status) external;

    function getVestingInfo()
        external
        view
        returns (uint16, uint64, uint64, uint64, uint);

    function updateTGEDate(uint64 _newTGEDate) external;

    function isFunded() external returns (bool);

    function withdrawRedundantIDOToken(
        address _beneficiary,
        uint _redundantAmount
    ) external;
}
