// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libraries/Pausable.sol";
import "../libraries/ReentrancyGuard.sol";
import "../libraries/SafeMath.sol";
import "../extensions/IgnitionList.sol";

contract Pool is Pausable, ReentrancyGuard, IgnitionList {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    struct OfferedCurrency {
        uint rate;
        uint decimal;
    }

    IERC20 public IDOToken;
    IERC20 public purchaseToken;
    OfferedCurrency public offeredCurrency;
    address public superAdmin;
    address public newSuperAdmin;
    mapping(address => bool) public admin;
    uint public maxPurchaseAmountForNotKYCUser;
    uint public maxPurchaseAmountForKYCUser;
    uint public maxPurchaseAmountForAllWhales;
    uint public participationFeePercentage;
    uint public totalRaiseAmount;
    uint public whaleProportion;
    address public feeRecipient;
    address public purchaseTokenRecipient;
    address public redeemIDOTokenRecipient;
    uint public whaleOpenTime;
    uint public whaleDuration;
    uint public communityOpenTime;
    uint public communityDuration;
    uint public purchasedAmount;

    event PoolCreated(
        address indexed IDOToken,
        uint offeredCurrencyRate,
        uint offeredCurrencyDecimal,
        uint maxPurchaseAmountForNotKYCUser,
        uint maxPurchaseAmountForKYCUser,
        uint maxPurchaseAmountForAllWhales,
        uint participationFeePercentage,
        uint totalRaiseAmount,
        uint whaleProportion,
        uint whaleOpenTime,
        uint whaleDuration,
        uint communityOpenTime,
        uint communityDuration
    );
    event BuyToken(
        address indexed buyer,
        address pool,
        address IDOToken,
        uint purchaseAmount
    );
    event RedeemIDOToken(address wallet, uint amount);
    event UpdateAdmin(address indexed admin, bool status);
    event GrantSuperAdminRole(address indexed newSuperAdmin);
    event AcceptSuperAdminRole(
        address indexed oldSuperAdmin,
        address indexed newSuperAdmin
    );
    event UpdateRoot(bytes32 root);
    event UpdateFeeRecipient(address indexed feeRecipient);
    event UpdateOpenPoolStatus(address pool, bool status);
    event UpdateOfferedCurrencyRate(uint rate);
    event UpdateOfferedCurrencyDecimal(uint decimal);
    event RedeemIDOToken(
        address redeemIDOTokenRecipient,
        address IDOToken,
        uint redeemAmount
    );

    error NotAnAdmin(address caller);
    error NotSuperAdmin(address _superAdmin, address caller);
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

    modifier onlyAdmin() {
        if (admin[msg.sender] == false) {
            revert NotAnAdmin(msg.sender);
        }
        _;
    }

    modifier onlySuperAdmin() {
        if (msg.sender != superAdmin) {
            revert NotSuperAdmin(superAdmin, msg.sender);
        }
        _;
    }

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
            admin[_superAdmin] = true;
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

            participationFeePercentage = _participationFeePercentage;
            totalRaiseAmount = _totalRaiseAmount;
            whaleProportion = _whaleProportion;
            whaleOpenTime = _whaleOpenTime;
            whaleDuration = _whaleDuration;
            communityOpenTime = _communityOpenTime;
            communityDuration = _communityDuration;
            maxPurchaseAmountForNotKYCUser = _maxPurchaseAmountForNotKYCUser;
            maxPurchaseAmountForKYCUser = _maxPurchaseAmountForKYCUser;
            maxPurchaseAmountForAllWhales = totalRaiseAmount
                .mul(_whaleProportion)
                .div(10000);
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
            totalRaiseAmount,
            whaleProportion,
            whaleOpenTime,
            whaleDuration,
            communityOpenTime,
            communityDuration
        );
    }

    function addAdmin(address _admin) external onlySuperAdmin {
        if (_admin == address(0)) {
            revert ZeroAddress();
        }
        admin[_admin] = true;
        emit UpdateAdmin(_admin, true);
    }

    function removeAdmin(address _admin) external onlySuperAdmin {
        if (_admin == address(0)) {
            revert ZeroAddress();
        }
        admin[_admin] = false;
        emit UpdateAdmin(_admin, false);
    }

    function grantSuperAdminRole(address _newSuperAdmin)
        external
        onlySuperAdmin
    {
        if (_newSuperAdmin == address(0)) {
            revert ZeroAddress();
        }
        newSuperAdmin = _newSuperAdmin;
        emit GrantSuperAdminRole(_newSuperAdmin);
    }

    function acceptSuperAdminRole() external {
        if (msg.sender != newSuperAdmin) {
            revert NotGrantedSuperAdmin();
        }
        address oldSuperAdmin = superAdmin;
        superAdmin = newSuperAdmin;
        newSuperAdmin = address(0);
        emit AcceptSuperAdminRole(oldSuperAdmin, superAdmin);
    }

    function setRoot(bytes32 _root) external onlyAdmin {
        root = _root;
        emit UpdateRoot(root);
    }

    function setFeeRecipient(address _feeRecipient) external onlyAdmin {
        if (_feeRecipient == address(0)) {
            revert ZeroAddress();
        }
        feeRecipient = _feeRecipient;
        emit UpdateFeeRecipient(_feeRecipient);
    }

    function closePool() external onlyAdmin {
        _pause();
        emit UpdateOpenPoolStatus(address(this), false);
    }

    function openPool() external onlyAdmin {
        _unpause();
        emit UpdateOpenPoolStatus(address(this), true);
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
            if (_purchaseAmount >= maxPurchaseAmountForKYCUser) {
                revert ExceedMaxPurchaseAmount(msg.sender, _purchaseAmount);
            }
            if (_purchaseAmount >= maxPurchaseAmountForNotKYCUser) {
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
        if (_purchaseAmount == 0) {
            revert ZeroAmount();
        }
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
        purchasedAmount = purchasedAmount.add(_purchaseAmount);
    }

    function _calculateParticipantFee(
        uint _purchaseAmount,
        uint _participationFeePercentage
    ) internal pure returns (uint) {
        return _purchaseAmount.mul(_participationFeePercentage).div(10000);
    }

    function _getIDOTokenAmountByOfferedCurrency(uint _amount)
        internal
        view
        returns (uint)
    {
        return
            _amount.mul(offeredCurrency.rate).div(10**offeredCurrency.decimal);
    }

    function setOfferedCurrencyRate(uint _rate) external onlyAdmin {
        offeredCurrency.rate = _rate;
        emit UpdateOfferedCurrencyRate(_rate);
    }

    function setOfferedCurrencyDecimal(uint _decimal) external onlyAdmin {
        offeredCurrency.decimal = _decimal;
        emit UpdateOfferedCurrencyDecimal(_decimal);
    }

    function _validWhaleSession() internal view returns (bool) {
        return
            block.timestamp >= whaleOpenTime &&
            block.timestamp <= whaleOpenTime + whaleDuration;
    }

    function _validCommunitySession() internal view returns (bool) {
        return
            block.timestamp >= communityOpenTime &&
            block.timestamp <= communityOpenTime + communityDuration;
    }

    function redeemIDOToken() external onlyAdmin {
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
