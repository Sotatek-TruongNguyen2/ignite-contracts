// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "../interfaces/IPool.sol";
import "./PoolStorage.sol";
import "./BasePausable.sol";
import "../libraries/SafeCast.sol";
import "../libraries/ECDSA.sol";
import "../extensions/IgnitionList.sol";
import "../logics/PoolLogic.sol";
import "../logics/VestingLogic.sol";

contract Pool is IgnitionList, IPool, PoolStorage, BasePausable {
    using SafeERC20 for IERC20;
    using SafeERC20 for IERC20withDec;
    using SafeCast for uint;

    // ============================== EVENT ==============================

    event UpdateRoot(bytes32 root);

    event CancelPool(address indexed pool, bool permanentDeleteStatus);

    event BuyToken(
        address indexed buyer,
        address indexed pool,
        uint purchaseAmount,
        uint8 poolType
    );

    event UpdateTime(
        uint64 whaleOpenTime,
        uint64 whaleCloseTime,
        uint64 communityOpenTime,
        uint64 communityCloseTime
    );

    event FundIDOToken(IERC20withDec _IDOToken, uint fundAmount);

    event ClaimTokenFee(address _beneficiary, uint tokenFee);

    event ClaimParticipationFee(
        address _beneficiary,
        uint participationFeeAmount
    );

    event WithdrawPurchasedAmount(
        address sender,
        address _beneficiary,
        uint principalAmount
    );

    event ClaimProfit(address _beneficiary, uint claimableAmount);

    // ============================== MODIFIER ==============================

    /**
     * @dev Check whether or not sender of transaction has admin role
     */
    modifier onlyAdmin() {
        require(ignitionFactory.isOwner(_msgSender()), Errors.CALLER_NOT_ADMIN);
        _;
    }

    modifier onlyFunded() {
        require(vesting.isFunded(), Errors.NOT_FUNDED);
        _;
    }

    modifier beforeTGEDate() {
        (uint64 _TGEDate, , , , ) = vesting.getVestingInfo();
        require(
            block.timestamp < _TGEDate,
            Errors.NOT_ALLOWED_TO_DO_AFTER_TGE_DATE
        );
        _;
    }

    modifier afterTGEDate() {
        (uint64 _TGEDate, , , , ) = vesting.getVestingInfo();
        require(
            block.timestamp >= _TGEDate,
            Errors.NOT_ALLOWED_TO_TRANSFER_BEFORE_TGE_DATE
        );
        _;
    }

    // ============================== EXTERNAL FUNCTION ==============================

    /**
     * @notice Initialize a pool with its information
     * @param addrs Array of address includes:
     * - address of IDO token,
     * - address of purchase token
     * @param uints Array of pool information includes:
     * - max purchase amount for KYC user,
     * - max purchase amount for Not KYC user,
     * - token fee percentage,
     * - galaxy participation fee percentage,
     * - crowdfunding participation fee percentage,
     * - galaxy pool proportion,
     * - early access proportion,
     * - total raise amount,
     * - whale open time,
     * - whale duration,
     * - community duration,
     * - rate of IDO token (based on README formula),
     * - decimal of IDO token (based on README formula, is different from decimals in contract of IDO token),
     * - TGE date,
     * - TGE percentage,
     * - vesting cliff,
     * - vesting frequency,
     * - number of vesting release
     */
    function initialize(
        address[2] memory addrs,
        uint[18] memory uints,
        address owner
    ) external initializer {
        __BasePausable__init(owner);
        PoolLogic.verifyPoolInfo(addrs, uints);
        {
            ignitionFactory = IIgnitionFactory(_msgSender());
        }
        _createAndSetVesting(
            addrs[0],
            uints[13],
            uints[14],
            uints[15],
            uints[16],
            uints[17]
        );
        {
            purchaseToken = IERC20(addrs[1]);
        }
        {
            maxPurchaseAmountForKYCUser = uints[0];
            maxPurchaseAmountForNotKYCUser = uints[1];
        }
        {
            tokenFeePercentage = SafeCast.toUint16(uints[2]);
            galaxyParticipationFeePercentage = SafeCast.toUint16(uints[3]);
            crowdfundingParticipationFeePercentage = SafeCast.toUint16(
                uints[4]
            );
        }
        {
            galaxyPoolProportion = SafeCast.toUint16(uints[5]);
            earlyAccessProportion = SafeCast.toUint16(uints[6]);
            totalRaiseAmount = uints[7];

            maxPurchaseAmountForGalaxyPool =
                (uints[7] * uints[5]) /
                PERCENTAGE_DENOMINATOR;
            maxPurchaseAmountForEarlyAccess =
                (uints[7] * (PERCENTAGE_DENOMINATOR - uints[5]) * uints[6]) /
                PERCENTAGE_DENOMINATOR /
                PERCENTAGE_DENOMINATOR;
        }
        {
            whaleOpenTime = SafeCast.toUint64(uints[8]);
            communityOpenTime = whaleCloseTime = SafeCast.toUint64(
                uints[8] + uints[9]
            );
            communityCloseTime = SafeCast.toUint64(
                communityOpenTime + uints[10]
            );
        }
        {
            offeredCurrency.rate = uints[11];
            offeredCurrency.decimal = uints[12];
        }

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Set merkle tree root after snapshoting information of investor
     * @dev Only admin can call it
     * @param _root Root of merkle tree
     */
    function setRoot(bytes32 _root) external onlyAdmin {
        root = _root;
        emit UpdateRoot(root);
    }

    /**
     * @notice Cancel pool: cancel project, nobody can buy token
     * @dev Only admin can call it
     */
    function cancelPool(
        bool _permanentDelete
    ) external onlyAdmin beforeTGEDate {
        _pause();
        vesting.setClaimableStatus(false);
        emit CancelPool(address(this), _permanentDelete);
    }

    /**
     * @notice Update time for galaxy pool and crowdfunding pool
     * @dev Only admin can call it, galaxy pool must be closed before crowdfunding pool
     * @param _newWhaleCloseTime New close time of galaxy pool
     * @param _newCommunityCloseTime New close time of crowdfunding pool
     */
    function updateTime(
        uint64 _newWhaleCloseTime,
        uint64 _newCommunityCloseTime
    ) external onlyAdmin {
        (uint64 _TGEDate, , , , ) = vesting.getVestingInfo();
        require(
            whaleOpenTime < _newWhaleCloseTime &&
                _newWhaleCloseTime < _newCommunityCloseTime &&
                _newCommunityCloseTime <= _TGEDate,
            Errors.INVALID_TIME
        );

        communityOpenTime = whaleCloseTime = _newWhaleCloseTime;
        communityCloseTime = _newCommunityCloseTime;

        emit UpdateTime(
            whaleOpenTime,
            whaleCloseTime,
            communityOpenTime,
            communityCloseTime
        );
    }

    function updateTGEDate(
        uint64 _newTGEDate
    ) external onlyAdmin beforeTGEDate {
        require(communityCloseTime <= _newTGEDate, Errors.INVALID_TIME);
        vesting.updateTGEDate(_newTGEDate);
    }

    /**
     * @notice Investor buy token in galaxy pool
     * @dev Must be in time for whale and pool is not closed
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocation of whale
     */
    function buyTokenInGalaxyPool(
        bytes32[] memory proof,
        uint _purchaseAmount,
        uint _maxPurchaseBaseOnAllocations
    ) external whenNotPaused nonReentrant {
        require(_validWhaleSession(), Errors.TIME_OUT_TO_BUY_IDO_TOKEN);

        _verifyAllowance(_msgSender(), _purchaseAmount);
        _preValidatePurchaseInGalaxyPool(
            _purchaseAmount,
            _maxPurchaseBaseOnAllocations
        );
        _internalWhaleBuyToken(
            proof,
            _purchaseAmount,
            _maxPurchaseBaseOnAllocations,
            galaxyParticipationFeePercentage,
            uint8(PoolLogic.PoolType.GALAXY_POOL)
        );
        _updatePurchasingInGalaxyPoolState(_purchaseAmount);
    }

    /**
     * @notice Investor buy token in crowdfunding pool
     * @dev Must be in time for crowdfunding pool and pool is not closed
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     */
    function buyTokenInCrowdfundingPool(
        bytes32[] memory proof,
        uint _purchaseAmount
    ) external whenNotPaused nonReentrant {
        _verifyAllowance(_msgSender(), _purchaseAmount);
        if (_validWhaleSession()) {
            _preValidatePurchaseInEarlyAccess(_purchaseAmount);
            _internalWhaleBuyToken(
                proof,
                _purchaseAmount,
                0,
                crowdfundingParticipationFeePercentage,
                uint8(PoolLogic.PoolType.EARLY_ACCESS)
            );
            _updatePurchasingInEarlyAccessState(_purchaseAmount);
            return;
        }

        require(_validCommunitySession(), Errors.TIME_OUT_TO_BUY_IDO_TOKEN);

        _preValidatePurchase(_purchaseAmount);
        _internalNormalUserBuyToken(proof, _purchaseAmount);
    }

    function setClaimableStatus(bool _status) external onlyAdmin {
        if (_status == true) {
            require(!isFail(), Errors.NOT_ALLOWED_TO_ALLOW_INVESTOR_TO_CLAIM);
        }
        return vesting.setClaimableStatus(_status);
    }

    function fundIDOToken(
        IERC20withDec _IDOToken,
        bytes calldata signature
    ) external onlyOwner whenNotPaused nonReentrant beforeTGEDate {
        IERC20withDec IDOToken = vesting.getIDOToken();

        uint256 fundAmount = getIDOTokenAmountByOfferedCurrency(totalRaiseAmount);
        if (address(IDOToken) != address(0)) {
            IDOToken.safeTransferFrom(
                _msgSender(),
                address(vesting),
                fundAmount
            );
        } else {
            require(
                _verifyFundAllowanceSignature(_IDOToken, signature),
                Errors.INVALID_SIGNER
            );

            vesting.setIDOToken(_IDOToken);
            _IDOToken.safeTransferFrom(
                _msgSender(),
                address(vesting),
                fundAmount
            );
        }

        vesting.setFundedStatus(true);

        emit FundIDOToken(_IDOToken, fundAmount);
    }

    function withdrawRedundantIDOToken(
        address _beneficiary
    ) external onlyOwner afterTGEDate {
        uint vestingIDOBalance = IERC20(vesting.getIDOToken()).balanceOf(
            address(vesting)
        );
        uint redundantAmount;
        if (isFail()) {
            redundantAmount = vestingIDOBalance;
        } else {
            redundantAmount =
                vestingIDOBalance -
                getIDOTokenAmountByOfferedCurrency(purchasedAmount);
        }
        vesting.withdrawRedundantIDOToken(_beneficiary, redundantAmount);
    }

    /// @notice System's admin receive token fee only when project is success after TGE date (not be cancelled by admin or funded enough IDO token)
    /// @param _beneficiary Address to receive token fee
    function claimTokenFee(
        address _beneficiary
    ) external onlyAdmin whenNotPaused onlyFunded nonReentrant afterTGEDate {
        require(
            tokenFeeClaimedStatus == false,
            Errors.NOT_ALLOWED_TO_CLAIM_TOKEN_FEE
        );
        uint tokenFee = (purchasedAmount * tokenFeePercentage) /
            PERCENTAGE_DENOMINATOR;

        purchaseToken.safeTransfer(_beneficiary, tokenFee);
        tokenFeeClaimedStatus = true;

        emit ClaimTokenFee(_beneficiary, tokenFee);
    }

    function claimParticipationFee(
        address _beneficiary
    ) external onlyAdmin nonReentrant afterTGEDate {
        require(
            participationFeeClaimedStatus == false,
            Errors.NOT_ALLOWED_TO_CLAIM_PARTICIPATION_FEE
        );
        purchaseToken.safeTransfer(_beneficiary, participationFeeAmount);
        participationFeeClaimedStatus = true;

        emit ClaimParticipationFee(_beneficiary, participationFeeAmount);
    }

    /// @notice When project is fail (cancelled by admin or not be funded enough IDO token)
    /// @param _beneficiary Address of receiver
    function withdrawPurchasedAmount(
        address _beneficiary
    ) external nonReentrant {
        PurchaseAmount storage userInfo = userPurchasedAmount[_msgSender()];
        uint principalAmount = userInfo.principal;
        require(principalAmount > 0, Errors.ZERO_AMOUNT_NOT_VALID);
        require(
            isFail() && userInfo.withdrawn == 0,
            Errors.NOT_ALLOWED_TO_WITHDRAW_PURCHASED_AMOUNT
        );

        purchaseToken.safeTransfer(_beneficiary, principalAmount);
        userInfo.withdrawn = principalAmount;

        emit WithdrawPurchasedAmount(
            _msgSender(),
            _beneficiary,
            principalAmount
        );
    }

    function claimProfit(
        address _beneficiary
    ) external nonReentrant onlyOwner afterTGEDate {
        require(
            !isFail() && vesting.isClaimable(),
            Errors.NOT_ALLOWED_TO_CLAIM_PURCHASE_TOKEN
        );
        uint claimableAmount = getClaimableProfitAmount();
        require(claimableAmount > 0, Errors.INVALID_CLAIMABLE_AMOUNT);

        claimableAmount = claimableAmount <=
            purchaseToken.balanceOf(address(this))
            ? claimableAmount
            : purchaseToken.balanceOf(address(this));
        profitClaimedAmount += claimableAmount;

        purchaseToken.safeTransfer(_beneficiary, claimableAmount);

        emit ClaimProfit(_beneficiary, claimableAmount);
    }

    // ============================== PUBLIC FUNCTION ==============================

    function isFail() public view returns (bool) {
        (uint64 _TGEDate, , , , ) = vesting.getVestingInfo();
        return (paused() ||
            (!vesting.isFunded() && block.timestamp >= _TGEDate));
    }

    /**
     * @dev Get IDO token amount base on amount of purchase token
     * @param _amount Amount of purchase token
     * @return Return amount of respective IDO token
     */
    function getIDOTokenAmountByOfferedCurrency(
        uint _amount
    ) public view returns (uint) {
        return
            (_amount * offeredCurrency.rate) / (10 ** offeredCurrency.decimal);
    }

    function getClaimableProfitAmount() public view returns (uint) {
        uint tokenFee = (purchasedAmount * tokenFeePercentage) /
            PERCENTAGE_DENOMINATOR;
        uint totalProfitAmount = purchasedAmount - tokenFee;
        (
            uint64 _TGEDate,
            uint16 _TGEPercentage,
            uint64 _vestingCliff,
            uint64 _vestingFrequency,
            uint _numberOfVestingRelease
        ) = vesting.getVestingInfo();

        return
            VestingLogic.calculateClaimableAmount(
                totalProfitAmount,
                profitClaimedAmount,
                _TGEPercentage,
                _TGEDate,
                _vestingCliff,
                _vestingFrequency,
                _numberOfVestingRelease
            );
    }

    // ============================== INTERNAL FUNCTION ==============================

    function _createAndSetVesting(
        address _IDOToken,
        uint _TGEDate,
        uint _TGEPercentage,
        uint _vestingCliff,
        uint _vestingFrequency,
        uint _numberOfVestingRelease
    ) internal {
        address _vesting = IIgnitionFactory(ignitionFactory).createVesting();
        vesting = IVesting(_vesting);
        vesting.initialize(
            address(this),
            _IDOToken,
            _TGEDate,
            _TGEPercentage,
            _vestingCliff,
            _vestingFrequency,
            _numberOfVestingRelease
        );
    }

    function _verifyFundAllowanceSignature(
        IERC20withDec _IDOToken,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 symbolHash = keccak256(abi.encodePacked(_IDOToken.symbol()));
        uint8 decimals = _IDOToken.decimals();
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        FUND_TYPEHASH,
                        address(_IDOToken),
                        address(this),
                        symbolHash,
                        decimals
                    )
                )
            )
        );

        return ignitionFactory.isOwner(ECDSA.recover(digest, signature));
    }

    /**
     * @dev Internal function for whale to buy token
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocation of whale
     * @param _participationFeePercentage Fee percentage when buying token
     * @param _poolType 0 for galaxy pool, 1 for early access and 2 for normal user in crowdfunding pool
     */
    function _internalWhaleBuyToken(
        bytes32[] memory proof,
        uint _purchaseAmount,
        uint _maxPurchaseBaseOnAllocations,
        uint _participationFeePercentage,
        uint8 _poolType
    ) internal {
        bool verifyWithKYCed = _verifyUser(
            _msgSender(),
            WHALE,
            maxPurchaseAmountForKYCUser,
            _maxPurchaseBaseOnAllocations,
            proof
        );
        if (verifyWithKYCed) {
            _internalBuyToken(
                _msgSender(),
                _purchaseAmount,
                _participationFeePercentage,
                true,
                _poolType
            );
            return;
        }

        bool verifyWithoutKYC = _verifyUser(
            _msgSender(),
            WHALE,
            maxPurchaseAmountForNotKYCUser,
            _maxPurchaseBaseOnAllocations,
            proof
        );

        require(verifyWithoutKYC, Errors.NOT_IN_WHALE_LIST);

        _internalBuyToken(
            _msgSender(),
            _purchaseAmount,
            _participationFeePercentage,
            false,
            _poolType
        );
    }

    /**
     * @dev Internal function for normal user to buy token
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     */
    function _internalNormalUserBuyToken(
        bytes32[] memory proof,
        uint _purchaseAmount
    ) internal {
        uint8 poolType = uint8(PoolLogic.PoolType.NORMAL_ACCESS);
        bool verifyWithKYCed = _verifyUser(
            _msgSender(),
            NORMAL_USER,
            maxPurchaseAmountForKYCUser,
            0,
            proof
        );
        if (verifyWithKYCed) {
            _internalBuyToken(
                _msgSender(),
                _purchaseAmount,
                crowdfundingParticipationFeePercentage,
                true,
                poolType
            );
            return;
        }

        bool verifyWithoutKYC = _verifyUser(
            _msgSender(),
            NORMAL_USER,
            maxPurchaseAmountForNotKYCUser,
            0,
            proof
        );

        require(verifyWithoutKYC, Errors.NOT_IN_INVESTOR_LIST);

        _internalBuyToken(
            _msgSender(),
            _purchaseAmount,
            crowdfundingParticipationFeePercentage,
            false,
            poolType
        );
    }

    /**
     * @dev Internal function to buy token
     * @param buyer Address of investor
     * @param _purchaseAmount Purchase amount of investor
     * @param _participationFeePercentage Fee percentage when buying token
     * @param _KYCStatus True if investor KYC and vice versa
     * @param _poolType 0 for galaxy pool, 1 for early access and 2 for normal user in crowdfunding pool
     */
    function _internalBuyToken(
        address buyer,
        uint _purchaseAmount,
        uint _participationFeePercentage,
        bool _KYCStatus,
        uint8 _poolType
    ) internal {
        if (_KYCStatus == true) {
            require(
                userPurchasedAmount[buyer].principal + _purchaseAmount <=
                    maxPurchaseAmountForKYCUser,
                Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_KYC_USER
            );
        } else {
            require(
                userPurchasedAmount[buyer].principal + _purchaseAmount <=
                    maxPurchaseAmountForNotKYCUser,
                Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_NOT_KYC_USER
            );
        }

        uint participationFee = PoolLogic.calculateParticipantFee(
            _purchaseAmount,
            _participationFeePercentage
        );
        _handleParticipationFee(buyer, participationFee);
        _handlePurchaseTokenFund(buyer, _purchaseAmount);

        uint IDOTokenAmount = getIDOTokenAmountByOfferedCurrency(
            _purchaseAmount
        );
        vesting.createVestingSchedule(buyer, IDOTokenAmount);

        emit BuyToken(buyer, address(this), _purchaseAmount, _poolType);
    }

    function _handlePurchaseTokenFund(
        address _buyer,
        uint _purchaseAmount
    ) internal {
        _forwardPurchaseTokenFunds(_buyer, _purchaseAmount);
        _updatePurchasingState(_buyer, _purchaseAmount);
    }

    function _handleParticipationFee(
        address _buyer,
        uint _participationFee
    ) internal {
        if (_participationFee > 0) {
            _forwardParticipationFee(_buyer, _participationFee);
            _updateParticipationFee(_buyer, _participationFee);
        }
    }

    function _forwardParticipationFee(
        address _buyer,
        uint _participationFee
    ) internal {
        purchaseToken.safeTransferFrom(
            _buyer,
            address(this),
            _participationFee
        );
    }

    function _updateParticipationFee(
        address _buyer,
        uint _participationFee
    ) internal {
        userPurchasedAmount[_buyer].fee += _participationFee;
        participationFeeAmount += _participationFee;
    }

    /**
     * @dev Update purchasing amount in galaxy pool
     * @param _purchaseAmount Purchase amount of investor
     */
    function _updatePurchasingInGalaxyPoolState(uint _purchaseAmount) internal {
        purchasedAmountInGalaxyPool += _purchaseAmount;
    }

    /**
     * @dev Update purchasing amount in early access
     * @param _purchaseAmount Purchase amount of investor
     */
    function _updatePurchasingInEarlyAccessState(
        uint _purchaseAmount
    ) internal {
        purchasedAmountInEarlyAccess += _purchaseAmount;
    }

    /**
     * @dev Update purchasing amount, airdrop amount and TGE amount in all pools
     * @param _purchaseAmount Purchase amount of investor
     */
    function _updatePurchasingState(
        address _buyer,
        uint _purchaseAmount
    ) internal {
        userPurchasedAmount[_buyer].principal += _purchaseAmount;
        purchasedAmount += _purchaseAmount;
    }

    /**
     * @dev Transfer purchase token from investor to pool
     * @param buyer Address of investor
     * @param _purchaseAmount Purchase amount of investor
     */
    function _forwardPurchaseTokenFunds(
        address buyer,
        uint _purchaseAmount
    ) internal {
        purchaseToken.safeTransferFrom(buyer, address(this), _purchaseAmount);
    }

    /**
     * @dev Check whether or not purchase amount exceeds max purchase in early access for whale
     * @param _purchaseAmount Purchase amount of investor
     */
    function _preValidatePurchaseInEarlyAccess(
        uint _purchaseAmount
    ) internal view {
        PoolLogic._validAmount(_purchaseAmount);
        require(
            purchasedAmountInEarlyAccess + _purchaseAmount <=
                maxPurchaseAmountForEarlyAccess,
            Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_EARLY_ACCESS
        );
    }

    /**
     * @dev Check whether or not purchase amount exceeds amount in all pools
     * @param _purchaseAmount Purchase amount of investor
     */
    function _preValidatePurchase(uint _purchaseAmount) internal view {
        PoolLogic._validAmount(_purchaseAmount);
        require(
            purchasedAmount + _purchaseAmount <= totalRaiseAmount,
            Errors.EXCEED_TOTAL_RAISE_AMOUNT
        );
    }

    /**
     * @dev Check whether or not session of whale
     * @return Return true if yes, and vice versa
     */
    function _validWhaleSession() internal view returns (bool) {
        return
            block.timestamp > whaleOpenTime &&
            block.timestamp <= whaleCloseTime;
    }

    /**
     * @dev Check whether or not session of community user
     * @return Return true if yes, and vice versa
     */
    function _validCommunitySession() internal view returns (bool) {
        return
            block.timestamp > communityOpenTime &&
            block.timestamp <= communityCloseTime;
    }

    /**
     * @dev Verify allowance of investor's token for pool
     * @param _user Address of investor
     * @param _purchaseAmount Purchase amount of investor
     */
    function _verifyAllowance(
        address _user,
        uint _purchaseAmount
    ) private view {
        uint allowance = purchaseToken.allowance(_user, address(this));
        require(allowance >= _purchaseAmount, Errors.NOT_ENOUGH_ALLOWANCE);
    }

    /**
     * @dev Check whether or not purchase amount exceeds max purchase amount base on allocation for whale
     * @param _purchaseAmount Amount of purchase token
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocations for whale
     */
    function _preValidatePurchaseInGalaxyPool(
        uint _purchaseAmount,
        uint _maxPurchaseBaseOnAllocations
    ) internal pure {
        PoolLogic._validAmount(_purchaseAmount);
        require(
            _purchaseAmount <= _maxPurchaseBaseOnAllocations,
            Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_USER
        );
    }
}
