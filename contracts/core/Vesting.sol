// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../interfaces/IVesting.sol";
import "./VestingStorage.sol";
import "./BasePausable.sol";
import "../logics/VestingLogic.sol";

contract Vesting is IVesting, VestingStorage, BasePausable {
    using SafeERC20 for IERC20withDec;

    // ============================== EVENT ==============================

    event SetClaimableStatus(bool status);

    event UpdateTGEDate(uint64 newTGEDate);

    event SetIDOTokenAddress(address IDOToken);

    event SetEmergencyCancelled(bool status);

    event Funded(bool status);

    event WithdrawRedundantIDOToken(address beneficiary, uint redundantAmount);

    event ClaimIDOToken(
        address sender,
        address beneficiary,
        uint claimableAmount
    );

    // ============================== MODIFIER ==============================
    modifier afterTGEDate() {
        require(
            block.timestamp >= TGEDate,
            Errors.NOT_ALLOWED_TO_TRANSFER_BEFORE_TGE_DATE
        );
        _;
    }

    modifier onlySatisfyClaimCondition() {
        require(
            isFunded() && isClaimable(),
            Errors.NOT_ALLOWED_TO_CLAIM_IDO_TOKEN
        );
        _;
    }

    modifier notEmergencyCancelled() {
        require(!emergencyCancelled, Errors.NOT_ALLOWED_TO_DO_AFTER_EMERGENCY_CANCELLED);
        _;
    }

    // ============================== EXTERNAL FUNCTION ==============================

    function initialize(
        address owner,
        address _IDOToken,
        uint _TGEDate,
        uint _TGEPercentage,
        uint _vestingCliff,
        uint _vestingFrequency,
        uint _numberOfVestingRelease
    ) external override initializer {
        VestingLogic.verifyVestingInfo(_TGEPercentage);
        IDOToken = IERC20withDec(_IDOToken);
        TGEDate = SafeCast.toUint64(_TGEDate);
        TGEPercentage = SafeCast.toUint16(_TGEPercentage);
        vestingCliff = SafeCast.toUint64(_vestingCliff);
        vestingFrequency = SafeCast.toUint64(_vestingFrequency);
        numberOfVestingRelease = _numberOfVestingRelease;

        claimable = true;

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

    function setIDOToken(IERC20withDec _IDOToken) external onlyOwner {
        IDOToken = _IDOToken;
        emit SetIDOTokenAddress(address(_IDOToken));
    }

    function setFundedStatus(bool _status) external onlyOwner {
        funded = _status;
        emit Funded(_status);
    }

    function setClaimableStatus(bool _status) external onlyOwner {
        claimable = _status;
        emit SetClaimableStatus(_status);
    }

    function setEmergencyCancelled(bool _status) external onlyOwner {
        emergencyCancelled = _status;
        emit SetEmergencyCancelled(_status);
    }

    function updateTGEDate(uint64 _TGEDate) external onlyOwner {
        TGEDate = _TGEDate;
        emit UpdateTGEDate(_TGEDate);
    }

    function claimIDOToken(
        address _beneficiary
    ) external onlySatisfyClaimCondition nonReentrant afterTGEDate notEmergencyCancelled{
        VestingAmountInfo storage userInfo = vestingAmountInfo[_msgSender()];
        require(
            userInfo.claimedAmount < userInfo.totalAmount,
            Errors.ALREADY_CLAIM_TOTAL_AMOUNT
        );
        uint claimableAmount = getClaimableAmount(_msgSender());
        require(claimableAmount > 0, Errors.INVALID_CLAIMABLE_AMOUNT);

        claimableAmount = claimableAmount <= IDOToken.balanceOf(address(this))
            ? claimableAmount
            : IDOToken.balanceOf(address(this));
        userInfo.claimedAmount += claimableAmount;

        IERC20withDec(IDOToken).safeTransfer(_beneficiary, claimableAmount);

        emit ClaimIDOToken(_msgSender(), _beneficiary, claimableAmount);
    }

    function withdrawRedundantIDOToken(
        address _beneficiary,
        uint _redundantAmount
    ) external onlyOwner nonReentrant notEmergencyCancelled{
        require(_redundantAmount > 0, Errors.ZERO_AMOUNT_NOT_VALID);
        IDOToken.safeTransfer(_beneficiary, _redundantAmount);

        emit WithdrawRedundantIDOToken(_beneficiary, _redundantAmount);
    }

    function getIDOToken() external view returns (IERC20withDec) {
        return IDOToken;
    }

    function getVestingInfo()
        external
        view
        returns (uint64, uint16, uint64, uint64, uint)
    {
        return (
            TGEDate,
            TGEPercentage,
            vestingCliff,
            vestingFrequency,
            numberOfVestingRelease
        );
    }

    // ============================== PUBLIC FUNCTION ==============================

    function isClaimable() public view returns (bool) {
        return claimable;
    }

    function isFunded() public view returns (bool) {
        return funded;
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

    function isEmergencyCancelled() public view returns (bool) {
        return emergencyCancelled;
    }
}
