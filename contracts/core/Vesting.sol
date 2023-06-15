// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./VestingStorage.sol";
import {Errors} from "../helpers/Errors.sol";
import "../utils/Initializable.sol";
import "../libraries/SafeCast.sol";
import "../utils/AccessControl.sol";
import "../interfaces/IVesting.sol";
import "./BasePausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../logics/VestingLogic.sol";

contract Vesting is VestingStorage, IVesting, BasePausable {
    using SafeERC20 for IERC20withDec;
    event SetClaimableStatus(bool _status);

    function initialize(
        address owner,
        address _IDOToken,
        uint _TGEDate,
        uint _TGEPercentage,
        uint _vestingCliff,
        uint _vestingFrequency,
        uint _numberOfVestingRelease
    ) external override initializer {
        _verifyVestingInfo(_TGEPercentage);
        TGEDate = SafeCast.toUint64(_TGEDate);
        TGEPercentage = SafeCast.toUint16(_TGEPercentage);
        vestingCliff = SafeCast.toUint64(_vestingCliff);
        vestingFrequency = SafeCast.toUint64(_vestingFrequency);
        numberOfVestingRelease = _numberOfVestingRelease;
        IDOToken = IERC20withDec(_IDOToken);

        _setupRole(OWNER_ROLE, owner);
        _setRoleAdmin(OWNER_ROLE, OWNER_ROLE);
    }

    function createVestingSchedule(
        address _user,
        uint _totalAmount
    ) external onlyOwner {
        require(_totalAmount > 0, Errors.ZERO_AMOUNT_NOT_VALID);

        vestingAmountInfo[_user].totalAmount += _totalAmount;
    }

    function getIDOToken() external view returns (IERC20withDec) {
        return IDOToken;
    }

    function setIDOToken(IERC20withDec _IDOToken) external onlyOwner {
        IDOToken = _IDOToken;
    }

    function setFundedStatus(bool _status) external onlyOwner {
        funded = _status;
    }

    function setClaimableStatus(bool _status) external onlyOwner {
        claimable = _status;
        emit SetClaimableStatus(_status);
    }

    function getVestingInfo()
        external
        view
        returns (uint16, uint64, uint64, uint64, uint)
    {
        return (
            TGEPercentage,
            TGEDate,
            vestingCliff,
            vestingFrequency,
            numberOfVestingRelease
        );
    }

    function updateTGEDate(uint64 _TGEDate) external onlyOwner {
        TGEDate = _TGEDate;
    }

    function getClaimableAmount(address user) public view returns (uint) {
        VestingAmountInfo memory userInfo = vestingAmountInfo[user];
        return
            VestingLogic.calculateClaimableAmount(
                userInfo.totalAmount,
                userInfo.claimedAmount,
                TGEPercentage,
                TGEDate,
                vestingCliff,
                vestingFrequency,
                numberOfVestingRelease
            );
    }

    function claimIDOToken(
        address _beneficiary
    ) external onlySatisfyClaimCondition nonReentrant {
        require(block.timestamp < TGEDate, Errors.NOT_YET_TGE_DATE);
        VestingAmountInfo storage userInfo = vestingAmountInfo[_msgSender()];
        require(
            userInfo.claimedAmount < userInfo.totalAmount,
            Errors.ALREADY_CLAIM_TOTAL_AMOUNT
        );
        uint claimableAmount = getClaimableAmount(_msgSender());

        userInfo.claimedAmount += claimableAmount;

        IERC20withDec(IDOToken).safeTransfer(_beneficiary, claimableAmount);
    }

    function isFunded() public view returns (bool) {
        return funded;
    }

    function _verifyVestingInfo(uint _TGEPercentage) internal pure {
        require(
            _TGEPercentage <= PERCENTAGE_DENOMINATOR,
            Errors.INVALID_TGE_PERCENTAGE
        );
    }

    function withdrawRedundantIDOToken(
        address _beneficiary,
        uint _redundantAmount
    ) external onlyOwner nonReentrant {
        require(_redundantAmount > 0, Errors.ZERO_AMOUNT_NOT_VALID);
        IDOToken.safeTransfer(_beneficiary, _redundantAmount);
    }

    modifier onlySatisfyClaimCondition() {
        require(
            isFunded() && claimable == true,
            Errors.NOT_ALLOWED_TO_CLAIM_IDO_TOKEN
        );
        _;
    }
}
