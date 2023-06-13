// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./VestingStorage.sol";
import {Errors} from "../helpers/Errors.sol";
import "../utils/Initializable.sol";
import "../libraries/SafeCast.sol";
import "../utils/AccessControl.sol";
import "../interfaces/IVesting.sol";

contract Vesting is VestingStorage, Initializable, AccessControl, IVesting {
    function initialize(
        address owner,
        address _IDOToken,
        uint _TGEDate,
        uint _TGEPercentage,
        uint _vestingCliff,
        uint _vestingDuration
    ) external override initializer {
        _verifyVestingInfo(_TGEPercentage, _vestingDuration);
        TGEDate = SafeCast.toUint64(_TGEDate);
        TGEPercentage = SafeCast.toUint16(_TGEPercentage);
        vestingCliff = SafeCast.toUint64(_vestingCliff);
        vestingDuration = SafeCast.toUint64(_vestingDuration);
        IDOToken = IERC20(_IDOToken);

        _setupRole(OWNER, owner);
        _setRoleAdmin(OWNER, OWNER);
    }

    function _verifyVestingInfo(
        uint _TGEPercentage,
        uint _vestingDuration
    ) internal pure {
        require(
            _TGEPercentage <= PERCENTAGE_DENOMINATOR,
            Errors.INVALID_TGE_PERCENTAGE
        );
        require(_vestingDuration > 0, Errors.ZERO_AMOUNT_NOT_VALID);
    }

    modifier onlyOwner() {
        require(hasRole(OWNER, _msgSender()), Errors.CALLER_NOT_OWNER);
        _;
    }
}
