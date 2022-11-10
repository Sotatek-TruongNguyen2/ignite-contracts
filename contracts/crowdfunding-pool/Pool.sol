// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../utils/Pausable.sol";
import "../utils/ReentrancyGuard.sol";
import "../extensions/IgnitionList.sol";
import "../utils/AccessControl.sol";
import "../libraries/SafeCast.sol";

contract Pool is Pausable, ReentrancyGuard, IgnitionList, AccessControl {
    using SafeERC20 for IERC20;
    using SafeCast for uint;

    struct OfferedCurrency {
        uint rate;
        uint decimal;
    }

    // keccak256("SUPER_ADMIN_ROLE")
    bytes32 public constant SUPER_ADMIN_ROLE =
        0x7613a25ecc738585a232ad50a301178f12b3ba8887d13e138b523c4269c47689;

    // keccak256("ADMIN_ROLE")
    bytes32 public constant ADMIN_ROLE =
        0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775;

    uint16 constant PERCENTAGE_DENOMINATOR = 10000;

    IERC20 public IDOToken;
    IERC20 public purchaseToken;
    OfferedCurrency public offeredCurrency;
    address public superAdmin;
    address public grantedSuperAdmin;
    uint public maxPurchaseAmountForNotKYCUser;
    uint public maxPurchaseAmountForKYCUser;
    uint public maxPurchaseAmountForAllWhales;
    uint16 public participationFeePercentage;
    uint16 public whaleProportion;
    uint public totalRaiseAmount;
    address public feeRecipient;
    address public purchaseTokenRecipient;
    address public redeemIDOTokenRecipient;
    uint64 public whaleOpenTime;
    uint64 public whaleDuration;
    uint64 public communityOpenTime;
    uint64 public communityDuration;
    uint public purchasedAmount;

    event PoolCreated(
        address indexed IDOToken,
        uint offeredCurrencyRate,
        uint offeredCurrencyDecimal,
        uint maxPurchaseAmountForNotKYCUser,
        uint maxPurchaseAmountForKYCUser,
        uint maxPurchaseAmountForAllWhales,
        uint16 participationFeePercentage,
        uint16 whaleProportion,
        uint totalRaiseAmount,
        uint64 whaleOpenTime,
        uint64 whaleDuration,
        uint64 communityOpenTime,
        uint64 communityDuration
    );
    event BuyToken(
        address indexed buyer,
        address indexed pool,
        address indexed IDOToken,
        uint purchaseAmount
    );
    event RedeemIDOToken(address indexed wallet, uint amount);
    event UpdateAdmin(address indexed admin, bool status);
    event GrantSuperAdminRole(address indexed grantedSuperAdmin);
    event ClaimSuperAdminRole(
        address indexed oldSuperAdmin,
        address indexed grantedSuperAdmin
    );
    event UpdateRoot(bytes32 root);
    event UpdateFeeRecipient(address indexed feeRecipient);
    event UpdateOpenPoolStatus(address indexed pool, bool status);
    event UpdateOfferedCurrencyRate(uint rate);
    event UpdateOfferedCurrencyDecimal(uint decimal);
    event RedeemIDOToken(
        address indexed redeemIDOTokenRecipient,
        address indexed IDOToken,
        uint redeemAmount
    );

    error OverlapOpenTime(
        uint whaleOpenTime,
        uint whaleDuration,
        uint communityOpenTime
    );
    error NotInList(address caller);
    error ExceedMaxPurchaseAmount(address caller, uint purchaseAmount);
    error ExceedTotalRaiseAmount(address caller, uint purchaseAmount);
    error OutOfTime(
        uint whaleOpenTime,
        uint whaleDuration,
        uint communityOpenTime,
        uint communityDuration,
        uint timestamp,
        address caller
    );
    error ZeroAddress();
    error NotGrantedSuperAdmin();
    error NotEnoughAllowance(
        address buyer,
        address IDOToken,
        uint allowance,
        uint amount
    );
    error ZeroAmount();
    error NotValidSignature();

    function initialize(address[6] memory addresses, uint[11] memory numbers)
        external
    {
        {
            uint _whaleOpenTime = numbers[3];
            uint _whaleDuration = numbers[4];
            uint _communityOpenTime = numbers[5];
            if (_whaleOpenTime + _whaleDuration > _communityOpenTime) {
                revert OverlapOpenTime(
                    _whaleOpenTime,
                    _whaleDuration,
                    _communityOpenTime
                );
            }
        }
        {
            address _IDOToken = addresses[0];
            address _purchaseToken = addresses[1];
            address _feeRecipient = addresses[2];
            address _purchaseTokenRecipient = addresses[3];
            address _redeemIDOTokenRecipient = addresses[4];
            address _superAdmin = addresses[5];

            superAdmin = _superAdmin;
            IDOToken = IERC20(_IDOToken);
            purchaseToken = IERC20(_purchaseToken);
            feeRecipient = _feeRecipient;
            purchaseTokenRecipient = _purchaseTokenRecipient;
            redeemIDOTokenRecipient = _redeemIDOTokenRecipient;
            _setupRole(SUPER_ADMIN_ROLE, _superAdmin);
            _setupRole(ADMIN_ROLE, _superAdmin);
            _setRoleAdmin(ADMIN_ROLE, SUPER_ADMIN_ROLE);
        }
        {
            uint _participationFeePercentage = numbers[0];
            uint _totalRaiseAmount = numbers[1];
            uint _whaleProportion = numbers[2];
            uint _whaleOpenTime = numbers[3];
            uint _whaleDuration = numbers[4];
            uint _communityOpenTime = numbers[5];
            uint _communityDuration = numbers[6];
            uint _maxPurchaseAmountForNotKYCUser = numbers[7];
            uint _maxPurchaseAmountForKYCUser = numbers[8];
            uint _rate = numbers[9];
            uint _decimal = numbers[10];

            participationFeePercentage = SafeCast.toUint16(
                _participationFeePercentage
            );
            totalRaiseAmount = _totalRaiseAmount;
            whaleProportion = SafeCast.toUint16(_whaleProportion);
            whaleOpenTime = SafeCast.toUint64(_whaleOpenTime);
            whaleDuration = SafeCast.toUint64(_whaleDuration);
            communityOpenTime = SafeCast.toUint64(_communityOpenTime);
            communityDuration = SafeCast.toUint64(_communityDuration);
            maxPurchaseAmountForNotKYCUser = _maxPurchaseAmountForNotKYCUser;
            maxPurchaseAmountForKYCUser = _maxPurchaseAmountForKYCUser;
            maxPurchaseAmountForAllWhales =
                (totalRaiseAmount * _whaleProportion) /
                PERCENTAGE_DENOMINATOR;
            offeredCurrency.rate = _rate;
            offeredCurrency.decimal = _decimal;
        }
        emit PoolCreated(
            address(IDOToken),
            offeredCurrency.rate,
            offeredCurrency.decimal,
            maxPurchaseAmountForNotKYCUser,
            maxPurchaseAmountForKYCUser,
            maxPurchaseAmountForAllWhales,
            participationFeePercentage,
            whaleProportion,
            totalRaiseAmount,
            whaleOpenTime,
            whaleDuration,
            communityOpenTime,
            communityDuration
        );
    }

    function _validAddress(address _address) internal pure {
        if (_address == address(0)) {
            revert ZeroAddress();
        }
    }

    function _validAmount(uint _amount) internal pure {
        if (_amount == 0) {
            revert ZeroAmount();
        }
    }

    function _validSignature(bytes memory _signature) internal pure {
        if (_signature.length != 65) {
            revert NotValidSignature();
        }
    }

    function grantAdminRole(address _admin) external {
        _validAddress(_admin);
        grantRole(ADMIN_ROLE, _admin);
        emit UpdateAdmin(_admin, true);
    }

    function revokeAdminRole(address _admin) external {
        _validAddress(_admin);
        revokeRole(ADMIN_ROLE, _admin);
        emit UpdateAdmin(_admin, false);
    }

    function grantSuperAdminRole(address _newSuperAdmin)
        external
        onlyRole(SUPER_ADMIN_ROLE)
    {
        _validAddress(_newSuperAdmin);
        grantedSuperAdmin = _newSuperAdmin;
        emit GrantSuperAdminRole(_newSuperAdmin);
    }

    function claimSuperAdminRole() external {
        if (msg.sender != grantedSuperAdmin) {
            revert NotGrantedSuperAdmin();
        }
        _revokeRole(SUPER_ADMIN_ROLE, superAdmin);
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);

        emit ClaimSuperAdminRole(superAdmin, grantedSuperAdmin);
        superAdmin = grantedSuperAdmin;
        grantedSuperAdmin = address(0);
    }

    function setRoot(bytes32 _root) external onlyRole(ADMIN_ROLE) {
        root = _root;
        emit UpdateRoot(root);
    }

    function setFeeRecipient(address _feeRecipient)
        external
        onlyRole(ADMIN_ROLE)
    {
        _validAddress(_feeRecipient);
        feeRecipient = _feeRecipient;
        emit UpdateFeeRecipient(_feeRecipient);
    }

    function pausePool() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit UpdateOpenPoolStatus(address(this), false);
    }

    function unpausePool() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit UpdateOpenPoolStatus(address(this), true);
    }

    function _splitSignature(bytes memory _signature)
        internal
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        _validSignature(_signature);
        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }
    }

    // Used only for USDC and DAI
    function buyTokenWithPermit(
        bytes32[] memory proof,
        uint _purchaseAmount,
        uint _deadline,
        bytes memory _signature
    ) external whenNotPaused nonReentrant {
        _preValidatePurchase(_purchaseAmount);

        if (purchasedAmount + _purchaseAmount > totalRaiseAmount) {
            revert ExceedTotalRaiseAmount(msg.sender, _purchaseAmount);
        }
        if (_validWhaleSession()) {
            if (
                purchasedAmount + _purchaseAmount >
                maxPurchaseAmountForAllWhales
            ) {
                revert ExceedMaxPurchaseAmount(msg.sender, _purchaseAmount);
            }
            if (
                _verifyUser(msg.sender, maxPurchaseAmountForAllWhales, proof) ==
                false
            ) {
                revert NotInList(msg.sender);
            }

            (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
            IERC20Permit(address(purchaseToken)).permit(
                msg.sender,
                address(this),
                _purchaseAmount,
                _deadline,
                v,
                r,
                s
            );
            // buy IDO Token
            _internalBuyToken(msg.sender, _purchaseAmount);
            emit BuyToken(
                msg.sender,
                address(this),
                address(IDOToken),
                _purchaseAmount
            );
        } else if (_validCommunitySession()) {
            if (_purchaseAmount > maxPurchaseAmountForKYCUser) {
                revert ExceedMaxPurchaseAmount(msg.sender, _purchaseAmount);
            }
            if (_purchaseAmount > maxPurchaseAmountForNotKYCUser) {
                if (
                    _verifyUser(
                        msg.sender,
                        maxPurchaseAmountForKYCUser,
                        proof
                    ) == false
                ) {
                    revert NotInList(msg.sender);
                }
            } else {
                if (
                    _verifyUser(
                        msg.sender,
                        maxPurchaseAmountForNotKYCUser,
                        proof
                    ) == false
                ) {
                    revert NotInList(msg.sender);
                }
            }

            (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
            IERC20Permit(address(purchaseToken)).permit(
                msg.sender,
                address(this),
                _purchaseAmount,
                _deadline,
                v,
                r,
                s
            );

            // buy IDO Token
            _internalBuyToken(msg.sender, _purchaseAmount);
            emit BuyToken(
                msg.sender,
                address(this),
                address(IDOToken),
                _purchaseAmount
            );
        } else {
            revert OutOfTime(
                whaleOpenTime,
                whaleDuration,
                communityOpenTime,
                communityDuration,
                block.timestamp,
                msg.sender
            );
        }

        if (purchasedAmount == totalRaiseAmount) {
            _pause();
            emit UpdateOpenPoolStatus(address(this), false);
        }
    }

    function buyToken(bytes32[] memory proof, uint _purchaseAmount)
        external
        whenNotPaused
        nonReentrant
    {
        _verifyAllowance(msg.sender, _purchaseAmount);
        _preValidatePurchase(_purchaseAmount);

        if (purchasedAmount + _purchaseAmount > totalRaiseAmount) {
            revert ExceedTotalRaiseAmount(msg.sender, _purchaseAmount);
        }
        if (_validWhaleSession()) {
            if (
                purchasedAmount + _purchaseAmount >
                maxPurchaseAmountForAllWhales
            ) {
                revert ExceedMaxPurchaseAmount(msg.sender, _purchaseAmount);
            }
            if (
                _verifyUser(msg.sender, maxPurchaseAmountForAllWhales, proof) ==
                false
            ) {
                revert NotInList(msg.sender);
            }

            // buy IDO Token
            _internalBuyToken(msg.sender, _purchaseAmount);
            emit BuyToken(
                msg.sender,
                address(this),
                address(IDOToken),
                _purchaseAmount
            );
        } else if (_validCommunitySession()) {
            if (_purchaseAmount > maxPurchaseAmountForKYCUser) {
                revert ExceedMaxPurchaseAmount(msg.sender, _purchaseAmount);
            }
            if (_purchaseAmount > maxPurchaseAmountForNotKYCUser) {
                if (
                    _verifyUser(
                        msg.sender,
                        maxPurchaseAmountForKYCUser,
                        proof
                    ) == false
                ) {
                    revert NotInList(msg.sender);
                }
            } else {
                if (
                    _verifyUser(
                        msg.sender,
                        maxPurchaseAmountForNotKYCUser,
                        proof
                    ) == false
                ) {
                    revert NotInList(msg.sender);
                }
            }

            // buy IDO Token
            _internalBuyToken(msg.sender, _purchaseAmount);
            emit BuyToken(
                msg.sender,
                address(this),
                address(IDOToken),
                _purchaseAmount
            );
        } else {
            revert OutOfTime(
                whaleOpenTime,
                whaleDuration,
                communityOpenTime,
                communityDuration,
                block.timestamp,
                msg.sender
            );
        }

        if (purchasedAmount == totalRaiseAmount) {
            _pause();
            emit UpdateOpenPoolStatus(address(this), false);
        }
    }

    function _preValidatePurchase(uint256 _purchaseAmount) internal pure {
        _validAmount(_purchaseAmount);
    }

    function _verifyAllowance(address _user, uint256 _purchaseAmount)
        private
        view
    {
        uint256 allowance = IDOToken.allowance(_user, address(this));
        if (allowance < _purchaseAmount) {
            revert NotEnoughAllowance(
                _user,
                address(IDOToken),
                allowance,
                _purchaseAmount
            );
        }
    }

    function _internalBuyToken(address buyer, uint _purchaseAmount) internal {
        // _purchaseAmount do not include participantFee
        // calculate participantion fee and transfer to fee recipient
        uint participationFee = _calculateParticipantFee(
            _purchaseAmount,
            participationFeePercentage
        );
        purchaseToken.safeTransferFrom(buyer, feeRecipient, participationFee);

        _forwardPurchaseTokenFunds(buyer, _purchaseAmount);

        uint IDOTokenAmount = _getIDOTokenAmountByOfferedCurrency(
            _purchaseAmount
        );

        _deliverIDOTokens(buyer, IDOTokenAmount);

        _updatePurchasingState(_purchaseAmount);
    }

    function _deliverIDOTokens(address buyer, uint _tokenAmount) internal {
        IDOToken.safeTransfer(buyer, _tokenAmount);
    }

    /**
     * @dev Determines how ETH is stored/forwarded on purchases.
     */
    function _forwardPurchaseTokenFunds(address buyer, uint _purchaseAmount)
        internal
    {
        purchaseToken.safeTransferFrom(
            buyer,
            purchaseTokenRecipient,
            _purchaseAmount
        );
    }

    function _updatePurchasingState(uint _purchaseAmount) internal {
        purchasedAmount = purchasedAmount + _purchaseAmount;
    }

    function _calculateParticipantFee(
        uint _purchaseAmount,
        uint _participationFeePercentage
    ) internal pure returns (uint) {
        return
            (_purchaseAmount * _participationFeePercentage) /
            PERCENTAGE_DENOMINATOR;
    }

    function _getIDOTokenAmountByOfferedCurrency(uint _amount)
        internal
        view
        returns (uint)
    {
        return (_amount * offeredCurrency.rate) / 10**offeredCurrency.decimal;
    }

    function setOfferedCurrencyRate(uint _rate) external onlyRole(ADMIN_ROLE) {
        offeredCurrency.rate = _rate;
        emit UpdateOfferedCurrencyRate(_rate);
    }

    function setOfferedCurrencyDecimal(uint _decimal)
        external
        onlyRole(ADMIN_ROLE)
    {
        offeredCurrency.decimal = _decimal;
        emit UpdateOfferedCurrencyDecimal(_decimal);
    }

    function _validWhaleSession() internal view returns (bool) {
        return
            block.timestamp > whaleOpenTime &&
            block.timestamp <= whaleOpenTime + whaleDuration;
    }

    function _validCommunitySession() internal view returns (bool) {
        return
            block.timestamp > communityOpenTime &&
            block.timestamp <= communityOpenTime + communityDuration;
    }

    function redeemIDOToken() external onlyRole(ADMIN_ROLE) {
        uint remainAmount = IDOToken.balanceOf(address(this));
        if (remainAmount > 0) {
            IDOToken.safeTransfer(redeemIDOTokenRecipient, remainAmount);
            emit RedeemIDOToken(
                redeemIDOTokenRecipient,
                address(IDOToken),
                remainAmount
            );
        }
    }
}
