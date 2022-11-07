// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Pool is Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    struct OfferedCurrency {
        uint rate;
        uint decimal;
    }

    IERC20 IDOToken;
    IERC20 purchaseToken;
    OfferedCurrency offeredCurrency;
    address superAdmin;
    address newSuperAdmin;
    mapping(address => bool) private admin;
    uint maxPurchaseAmountForNotKYCUser;
    uint maxPurchaseAmountForKYCUser;
    uint maxPurchaseAmountForWhale;
    uint participationFeePercentage;
    uint totalRaiseAmount;
    uint whaleProportion;
    // bytes32 whaleRoot;
    // bytes32 KYCUserRoot;
    bytes32 root;
    address feeRecipient;
    address purchaseTokenRecipient;
    address redeemIDOTokenRecipient;
    uint whaleOpenTime;
    uint whaleDuration;
    uint communityOpenTime;
    uint communityDuration;
    uint purchasedAmount;

    error NotAnAdmin(address _admin);
    error NotSuperAdmin(address _superAdmin);
    error OverlapOpenTime();
    error NotInList();
    error ExceedMaxPurchaseAmount();
    error ExceedTotalRaiseAmount();
    error OutOfTime();

    modifier onlyAdmin() {
        if (admin[msg.sender] == false) {
            revert NotAnAdmin(msg.sender);
        }
        _;
    }

    modifier onlySuperAdmin() {
        if (msg.sender != superAdmin) {
            revert NotSuperAdmin(msg.sender);
        }
        _;
    }

    function initialize(
        address _superAdmin,
        address _IDOToken,
        address _purchaseToken,
        address _feeRecipient,
        address _purchaseTokenRecipient,
        address _redeemIDOTokenRecipient,
        uint _participationFeePercentage,
        uint _totalRaiseAmount,
        uint _whaleProportion,
        uint _whaleOpenTime,
        uint _whaleDuration,
        uint _communityOpenTime,
        uint _communityDuration,
        uint _maxPurchaseAmountForNotKYCUser,
        uint _maxPurchaseAmountForKYCUser,
        uint _rate,
        uint _decimal
    ) public {
        if (_whaleOpenTime + _whaleDuration > _communityOpenTime) {
            revert OverlapOpenTime();
        }
        superAdmin = _superAdmin;
        IDOToken = IERC20(_IDOToken);
        purchaseToken = IERC20(_purchaseToken);
        feeRecipient = _feeRecipient;
        purchaseTokenRecipient = _purchaseTokenRecipient;
        redeemIDOTokenRecipient = _redeemIDOTokenRecipient;
        participationFeePercentage = _participationFeePercentage;
        totalRaiseAmount = _totalRaiseAmount;
        whaleProportion = _whaleProportion;
        setAdmin(_superAdmin);
        whaleOpenTime = _whaleOpenTime;
        whaleDuration = _whaleDuration;
        communityOpenTime = _communityOpenTime;
        communityDuration = _communityDuration;
        maxPurchaseAmountForNotKYCUser = _maxPurchaseAmountForNotKYCUser;
        maxPurchaseAmountForKYCUser = _maxPurchaseAmountForKYCUser;
        maxPurchaseAmountForWhale = totalRaiseAmount.mul(_whaleProportion).div(10000);
        offeredCurrency.rate = _rate;
        offeredCurrency.decimal = _decimal;
    }

    // function setParticipationFeePercentage(uint _participationFeePercentage) public {
    //     participationFeePercentage = _participationFeePercentage;
    // }

    // function setTotalRaiseAmount(uint _totalRaiseAmount) public {
    //     totalRaiseAmount = _totalRaiseAmount;
    // }

    // function setWhaleProportion(uint _whaleProportion) public {
    //     whaleProportion = _whaleProportion;
    // }

    function setAdmin(address _admin) public onlySuperAdmin {
        admin[_admin] = true;
    }

    function grantSuperAdminRole(address _newSuperAdmin) public onlySuperAdmin {
        newSuperAdmin = _newSuperAdmin;
    }

    function acceptSuperAdminRole() public {
        superAdmin = newSuperAdmin;
        newSuperAdmin = address(0);
    }

    function setRoot(bytes32 _root) public {
        root = _root;
    }

    function setFeeRecipient(address _feeRecipient) public onlyAdmin {
        feeRecipient = _feeRecipient;
    }

    function closePool() public onlyAdmin {
        _pause();
    }

    function buyToken(bytes32[] memory proof, uint _purchaseAmount) public {
        if (purchasedAmount + _purchaseAmount > totalRaiseAmount) {
            revert ExceedTotalRaiseAmount();
        }
        if (isInWhaleSession()) {
            if (purchasedAmount + _purchaseAmount > maxPurchaseAmountForWhale) {
                revert ExceedMaxPurchaseAmount();
            }
            if (
                _verifyUser(msg.sender, maxPurchaseAmountForWhale, proof) ==
                false
            ) {
                revert NotInList();
            }

            // buy IDO Token
            _buyIDOToken(msg.sender, _purchaseAmount);
        } else if (isInCommunitySession()) {
            if (_purchaseAmount >= maxPurchaseAmountForKYCUser) {
                revert ExceedMaxPurchaseAmount();
            }
            if (_purchaseAmount >= maxPurchaseAmountForNotKYCUser) {
                if (
                    _verifyUser(
                        msg.sender,
                        maxPurchaseAmountForKYCUser,
                        proof
                    ) == false
                ) {
                    revert NotInList();
                }
            }

            // buy IDO Token
            _buyIDOToken(msg.sender, _purchaseAmount);
        } else {
            revert OutOfTime();
        }

        if (purchasedAmount == totalRaiseAmount) {
            _pause();
        }
    }

    function _buyIDOToken(address buyer, uint _purchaseAmount) public {

        // _purchaseAmount do not include participantFee
        // calculate participantion fee and transfer to fee recipient
        uint participationFee = _purchaseAmount
            .mul(participationFeePercentage)
            .div(10000);
        purchaseToken.safeTransferFrom(buyer, feeRecipient, participationFee);

        // buy IDO token
        purchasedAmount = purchasedAmount.add(_purchaseAmount);
        purchaseToken.safeTransferFrom(
            buyer,
            purchaseTokenRecipient,
            _purchaseAmount
        );

        uint IDOTokenAmount = _purchaseAmount.mul(offeredCurrency.rate).div(
            10**offeredCurrency.decimal
        );
        IDOToken.safeTransfer(buyer, IDOTokenAmount);
    }

    function setOfferedCurrencyRate(uint _rate) public{
        offeredCurrency.rate = _rate;
    }

    function setOfferedCurrencyDecimal(uint _decimal) public {
        offeredCurrency.decimal = _decimal;
    }

    function isInWhaleSession() public view returns (bool) {
        return
            block.timestamp >= whaleOpenTime &&
            block.timestamp <= whaleOpenTime + whaleDuration;
    }

    function isInCommunitySession() public view returns (bool) {
        return
            block.timestamp >= communityOpenTime &&
            block.timestamp <= communityOpenTime + communityDuration;
    }

    function _verifyUser(
        address _candidate,
        uint _maxPurchaseAmount,
        bytes32[] memory proof
    ) public view returns (bool) {
        // leaf = {address + max purchase amount}

        bytes32 leaf = keccak256(
            abi.encodePacked(_candidate, _maxPurchaseAmount)
        );
        return MerkleProof.verify(proof, root, leaf);
    }

    function redeemIDOToken() public {
        uint remainAmount = IDOToken.balanceOf(address(this));
        IDOToken.safeTransfer(redeemIDOTokenRecipient, remainAmount);
    }
}
