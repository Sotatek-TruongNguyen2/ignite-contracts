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
    IERC20 public token;
    IERC20 purchaseToken;
    uint price;
    address superAdmin;
    address newSuperAdmin;
    mapping(address => bool) private admin;
    uint maxPurchaseAmountForNotKYCUser;
    uint maxPurchaseAmountForKYCUser;
    uint maxPurchaseAmountForWhale;
    uint participationFee;
    uint totalRaiseAmount;
    uint whaleProportion;
    // bytes32 whaleRoot;
    // bytes32 KYCUserRoot;
    bytes32 root;
    address feeRecipient;
    uint whaleOpenTime;
    uint whaleDuration;
    uint communityOpenTime;
    uint communityDuration;

    error NotAnAdmin(address _admin);
    error NotSuperAdmin(address _superAdmin);
    error OverlapOpenTime();
    error NotInList();
    error ExceedMaxPurchaseAmount();

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
        address _purchaseToken,
        uint _participationFee,
        uint _totalRaiseAmount,
        uint _whaleProportion,
        uint _whaleOpenTime,
        uint _whaleDuration,
        uint _communityOpenTime,
        uint _communityDuration,
        uint _price,
        uint _maxPurchaseAmountForNotKYCUser,
        uint _maxPurchaseAmountForKYCUser
    ) public {
        if (_whaleOpenTime + _whaleDuration > _communityOpenTime) {
            revert OverlapOpenTime();
        }
        superAdmin = _superAdmin;
        purchaseToken = IERC20(_purchaseToken);
        participationFee = _participationFee;
        totalRaiseAmount = _totalRaiseAmount;
        whaleProportion = _whaleProportion;
        setAdmin(_superAdmin);
        whaleOpenTime = _whaleOpenTime;
        whaleDuration = _whaleDuration;
        communityOpenTime = _communityOpenTime;
        communityDuration = _communityDuration;
        price = _price;
        maxPurchaseAmountForNotKYCUser = _maxPurchaseAmountForNotKYCUser;
        maxPurchaseAmountForKYCUser = _maxPurchaseAmountForKYCUser;
        maxPurchaseAmountForWhale = totalRaiseAmount.div(2);
    }

    // function setParticipationFee(uint _participationFee) public {
    //     participationFee = _participationFee;
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

    // function setWhaleRoot(bytes32 _whalerRoot) public onlyAdmin{
    //     whaleRoot = _whalerRoot;
    // }

    // function setKYCUserRoot(bytes32 _KYCUserRoot) public onlyAdmin{
    //     KYCUserRoot = _KYCUserRoot;
    // }

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
        // leaf = {address + max purchase amount}
        if (isInWhaleSession()) {
            if(_purchaseAmount >= maxPurchaseAmountForWhale){
                revert ExceedMaxPurchaseAmount();
            }
            if (_verifyUser(msg.sender, maxPurchaseAmountForWhale, proof) == false) {
                revert NotInList();
            }
        }
        if (isInCommunitySession()){
            if(_purchaseAmount >= maxPurchaseAmountForKYCUser){
                revert ExceedMaxPurchaseAmount();
            }
            if(_purchaseAmount >= maxPurchaseAmountForNotKYCUser){
                if(_verifyUser(msg.sender, maxPurchaseAmountForKYCUser, proof) == false){
                    revert NotInList();
                }
            }
        }
        uint tokenAmount = _purchaseAmount.div(price);
        purchaseToken.safeTransferFrom(msg.sender, feeRecipient, _purchaseAmount);
        token.safeTransfer(msg.sender, tokenAmount);

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
        bytes32 leaf = keccak256(
            abi.encodePacked(_candidate, _maxPurchaseAmount)
        );
        return MerkleProof.verify(proof, root, leaf);
    }
}
