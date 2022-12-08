// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../utils/Pausable.sol";
import "../utils/ReentrancyGuard.sol";
import "../extensions/IgnitionList.sol";
import "../utils/AccessControl.sol";
import "../libraries/SafeCast.sol";
import "../interfaces/IPoolFactory.sol";
import "../utils/Initializable.sol";

contract Pool is Pausable, ReentrancyGuard, IgnitionList, AccessControl, Initializable {
    using SafeERC20 for IERC20;
    using SafeCast for uint;

    struct OfferedCurrency {
        uint rate;
        uint decimal;
    }

    // keccak256("WHALE")
    bytes32 public constant WHALE = 0xed4b80c86c7954bdbf516c492acb4a2899eb0ee85b7c74e26d85e55a07562c95;

    // keccak256("NORMAL_USER")
    bytes32 public constant NORMAL_USER = 0x13e31188d81b941f4c541528790db4031bef078b78d364bde6fc2d4e5ad79e01;

    IPoolFactory public poolFactory;
    uint16 public constant PERCENTAGE_DENOMINATOR = 10000;
    IERC20 public IDOToken;
    IERC20 public purchaseToken;
    OfferedCurrency public offeredCurrency;

    uint public maxPurchaseAmountForGalaxyPool;
    uint public maxPurchaseAmountForEarlyAccess;
    uint public maxPurchaseAmountForKYCUser;
    uint public maxPurchaseAmountForNotKYCUser;
    
    uint64 public TGEDate;
    uint16 public TGEPercentage;
    uint16 public participationFeePercentage;
    uint16 public galaxyPoolProportion;
    uint16 public earlyAccessProportion;
    bool public TGEClaimable;
    uint public totalRaiseAmount;

    uint64 public whaleOpenTime;
    uint64 public whaleDuration;
    uint64 public communityOpenTime;
    uint64 public communityDuration;

    uint public purchasedAmountInGalaxyPool;
    uint public purchasedAmountInEarlyAccess;
    uint public purchasedAmount;

    mapping(address => uint) public userPurchasedAmount;
    mapping(address => uint) public userIDOAirdropAmount;
    mapping(address => uint) public userIDOTGEAmount;

    event UpdateRoot(bytes32 root);
    event SetTGEClaimable(bool claimable);
    event SetIDOTokenAddress(address IDOToken);
    event ExtendCommunityTime(uint64 _durationDelta);
    event ClaimTGEAmount(address buyer, uint claimAmount);
    event UpdateFeeRecipient(address indexed feeRecipient);
    event UpdateOpenPoolStatus(address indexed pool, bool status);
    event UpdateOfferedCurrencyRateAndDecimal(uint _rate, uint _decimal);
    event RedeemIDOToken(address redeemIDOTokenRecipient, address IDOToken, uint remainAmount);
    event BuyToken(address indexed buyer, address indexed pool, address indexed IDOToken, uint purchaseAmount);
    event RedeemPurchaseToken(address redeemPurchaseTokenRecipient, address purchaseToken, uint purchaseAmount);
    event PoolCreated(address IDOToken, address purchaseToken, uint rate, uint decimal,uint maxPurchaseAmountForKYCUser, uint maxPurchaseAmountForNotKYCUser,
        uint16 participationFeePercentage, uint16 galaxyPoolProportion, uint16 earlyAccessProportion, uint totalRaiseAmount, uint64 whaleOpenTime, uint64 whaleDuration, uint64 communityDuration);

    error NotAdmin();
    error ZeroAmount();
    error ZeroAddress();
    error NotValidSignature();
    error NotYetTimeToClaimTGE();
    error TimeOutToSetPoolStatus();
    error ClaimExceedMaxTGEAmount();
    error NotInWhaleList(address buyer);
    error NotAllowedToClaimTGEIDOAmount();
    error ExceedMaxPurchaseAmountForUser();
    error NotEnoughConditionToRedeemIDOToken();
    error NotEnoughConditionToRedeemPurchaseToken();
    error AlreadySetClaimableTGE(bool presentStatus);
    error ExceedTotalRaiseAmount(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForKYCUser(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForGalaxyPool(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForNotKYCUser(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForEarlyAccess(address buyer, uint purchaseAmount);
    error NotEnoughAllowance(address buyer, address purchaseToken, uint allowance, uint amount);
    error TimeOutToBuyToken(uint whaleOpenTime, uint whaleDuration, uint communityOpenTime, uint communityDuration, uint timestamp, address buyer);

    modifier onlyAdmin {
        if(!poolFactory.hasAdminRole(_msgSender())){
            revert NotAdmin();
        }
        _;
    }

    function initialize(address[2] memory addrs, uint[13] memory uints) external initializer{
        {
            poolFactory = IPoolFactory(_msgSender());
        }
        {
            address _IDOToken = addrs[0];
            address _purchaseToken = addrs[1];
            IDOToken = IERC20(_IDOToken);
            purchaseToken = IERC20(_purchaseToken);
        }
        {
            uint _maxPurchaseAmountForKYCUser = uints[0];
            uint _maxPurchaseAmountForNotKYCUser = uints[1];
            maxPurchaseAmountForKYCUser = _maxPurchaseAmountForKYCUser;
            maxPurchaseAmountForNotKYCUser = _maxPurchaseAmountForNotKYCUser;
        }
        {
            uint _TGEDate = uints[2];
            uint _TGEPercentage = uints[3];
            TGEDate = SafeCast.toUint64(_TGEDate);
            TGEPercentage = SafeCast.toUint16(_TGEPercentage);
        }
        {
            uint _participationFeePercentage = uints[4];
            participationFeePercentage = SafeCast.toUint16(_participationFeePercentage);
        }
        {
            uint _galaxyPoolProportion = uints[5];
            uint _earlyAccessProportion = uints[6];
            uint _totalRaiseAmount = uints[7];
            galaxyPoolProportion = SafeCast.toUint16(_galaxyPoolProportion);
            earlyAccessProportion = SafeCast.toUint16(_earlyAccessProportion);
            totalRaiseAmount = _totalRaiseAmount;

            maxPurchaseAmountForGalaxyPool = _totalRaiseAmount * _galaxyPoolProportion / PERCENTAGE_DENOMINATOR;
            maxPurchaseAmountForEarlyAccess = _totalRaiseAmount * (PERCENTAGE_DENOMINATOR - _galaxyPoolProportion) * _earlyAccessProportion / PERCENTAGE_DENOMINATOR / PERCENTAGE_DENOMINATOR;
        }
        {
            uint _whaleOpenTime = uints[8];
            uint _whaleDuration = uints[9];
            uint _communityDuration = uints[10];
            whaleOpenTime = SafeCast.toUint64(_whaleOpenTime);
            whaleDuration = SafeCast.toUint64(_whaleDuration);
            communityDuration = SafeCast.toUint64(_communityDuration);
            communityOpenTime = SafeCast.toUint64(_whaleOpenTime + _whaleDuration);
        }
        {
            uint _rate = uints[11];
            uint _decimal = uints[12];
            offeredCurrency.rate = _rate;
            offeredCurrency.decimal = _decimal;
        }
        
        emit PoolCreated(address(IDOToken), address(purchaseToken), offeredCurrency.rate, offeredCurrency.decimal, maxPurchaseAmountForKYCUser, 
            maxPurchaseAmountForNotKYCUser, participationFeePercentage, galaxyPoolProportion, earlyAccessProportion, totalRaiseAmount, whaleOpenTime, whaleDuration, communityDuration);
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

    function setRoot(bytes32 _root) external onlyAdmin{
        root = _root;
        emit UpdateRoot(root);
    }

    function pausePool() external onlyAdmin {
        _pause();
        emit UpdateOpenPoolStatus(address(this), false);
    }

    function unpausePool() external onlyAdmin {
        _unpause();
        emit UpdateOpenPoolStatus(address(this), true);
    }

    function extendCommunityTime(uint64 _durationDelta) external onlyAdmin{
        communityDuration += _durationDelta;
        emit ExtendCommunityTime(_durationDelta);
    }

    function updateOfferedCurrencyRateAndDecimal(uint _rate, uint _decimal) external onlyAdmin{
        if(block.timestamp > whaleOpenTime){
            revert TimeOutToSetPoolStatus();
        }
        offeredCurrency.rate = _rate;
        offeredCurrency.decimal = _decimal;
        emit UpdateOfferedCurrencyRateAndDecimal(_rate, _decimal);
    }

    function buyTokenInGalaxyPool(bytes32[] memory proof, uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations) public whenNotPaused nonReentrant {
        if(!_validWhaleSession()) {
            revert TimeOutToBuyToken(whaleOpenTime, whaleDuration, communityOpenTime, communityDuration, block.timestamp, _msgSender());
        }
        _verifyAllowance(_msgSender(), _purchaseAmount);
        _preValidatePurchaseInGalaxyPool(_purchaseAmount,_maxPurchaseBaseOnAllocations);
        _internalWhaleBuyToken(proof, _purchaseAmount, _maxPurchaseBaseOnAllocations, 0);
        _updatePurchasingInGalaxyPoolState(_purchaseAmount);
    }

    function buyTokenInCrowdfundingPool(bytes32[] memory proof, uint _purchaseAmount) public whenNotPaused nonReentrant {
        _verifyAllowance(_msgSender(), _purchaseAmount);
        if(_validWhaleSession()){
            _preValidatePurchaseInEarlyAccess(_purchaseAmount);
            _internalWhaleBuyToken(proof, _purchaseAmount, 0, participationFeePercentage);
            _updatePurchasingInEarlyAccessState(_purchaseAmount);
        }else if(_validCommunitySession()){
            _preValidatePurchase(_purchaseAmount);
            _internalNormalUserBuyToken(proof, _purchaseAmount);
        }else{
            revert TimeOutToBuyToken(whaleOpenTime, whaleDuration, communityOpenTime, communityDuration, block.timestamp, _msgSender());
        }
    }

    // Used only for USDC
    function buyTokenInGalaxyPoolWithPermit(bytes32[] memory proof, uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations, uint _deadline, bytes memory _signature) external whenNotPaused nonReentrant{
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        IERC20Permit(address(purchaseToken)).permit(_msgSender(), address(this), _purchaseAmount, _deadline, v, r, s);
        if(!_validWhaleSession()) {
            revert TimeOutToBuyToken(whaleOpenTime, whaleDuration, communityOpenTime, communityDuration, block.timestamp, _msgSender());
        }
        _preValidatePurchaseInGalaxyPool(_purchaseAmount,_maxPurchaseBaseOnAllocations);
        _internalWhaleBuyToken(proof, _purchaseAmount, _maxPurchaseBaseOnAllocations, 0);
        _updatePurchasingInGalaxyPoolState(_purchaseAmount);
    }

    // Used only for USDC
    function buyTokenInCrowdfundingPoolWithPermit(bytes32[] memory proof, uint _purchaseAmount, uint _allowance, uint _deadline, bytes memory _signature) external whenNotPaused nonReentrant{
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        IERC20Permit(address(purchaseToken)).permit(_msgSender(), address(this), _allowance, _deadline, v, r, s);
        _verifyAllowance(_msgSender(), _purchaseAmount);
        if(_validWhaleSession()){
            _preValidatePurchaseInEarlyAccess(_purchaseAmount);
            _internalWhaleBuyToken(proof, _purchaseAmount, 0, participationFeePercentage);
            _updatePurchasingInEarlyAccessState(_purchaseAmount);
        }else if(_validCommunitySession()){
            _preValidatePurchase(_purchaseAmount);
            _internalNormalUserBuyToken(proof, _purchaseAmount);
        }else{
            revert TimeOutToBuyToken(whaleOpenTime, whaleDuration, communityOpenTime, communityDuration, block.timestamp, _msgSender());
        }
    }

    function _internalNormalUserBuyToken(bytes32[] memory proof, uint _purchaseAmount) internal{
        if(_verifyUser(_msgSender(), NORMAL_USER, maxPurchaseAmountForKYCUser, 0, proof)){
            _internalBuyToken(_msgSender(), _purchaseAmount, participationFeePercentage, true);
        }else {
            _internalBuyToken(_msgSender(), _purchaseAmount, participationFeePercentage, false);
        }
    }
    
    function _internalWhaleBuyToken(bytes32[] memory proof, uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations, uint _participationFeePercentage) internal {
        if(_verifyUser(_msgSender(), WHALE, maxPurchaseAmountForKYCUser, _maxPurchaseBaseOnAllocations, proof)){
            _internalBuyToken(_msgSender(), _purchaseAmount, _participationFeePercentage, true);
        }else if(_verifyUser(_msgSender(), WHALE, maxPurchaseAmountForNotKYCUser, _maxPurchaseBaseOnAllocations, proof)){
            _internalBuyToken(_msgSender(), _purchaseAmount, _participationFeePercentage, false);
        }else{
            revert NotInWhaleList(_msgSender());
        }
    }

    function _splitSignature(bytes memory _signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        _validSignature(_signature);
        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }
    }

    function _validCommunitySession() internal view returns (bool) {
        return
            block.timestamp > communityOpenTime &&
            block.timestamp <= communityOpenTime + communityDuration;
    }    

    function _validWhaleSession() internal view returns(bool){
        return block.timestamp > whaleOpenTime && block.timestamp <= whaleOpenTime + whaleDuration;
    }

    function _internalBuyToken(address buyer, uint _purchaseAmount, uint _participationFeePercentage, bool _KYCStatus) internal{

        if(_KYCStatus == true &&  userPurchasedAmount[_msgSender()] + _purchaseAmount > maxPurchaseAmountForKYCUser){
            revert ExceedMaxPurchaseAmountForKYCUser(_msgSender(), _purchaseAmount);
        }

        if(_KYCStatus == false && userPurchasedAmount[_msgSender()] + _purchaseAmount > maxPurchaseAmountForNotKYCUser){
            revert ExceedMaxPurchaseAmountForNotKYCUser(_msgSender(), _purchaseAmount);
        }

        uint participationFee = _calculateParticipantFee(_purchaseAmount, _participationFeePercentage);
        if(participationFee > 0){
            purchaseToken.safeTransferFrom(buyer, address(this), participationFee);
        }
        _forwardPurchaseTokenFunds(buyer, _purchaseAmount);

        uint IDOTokenAmount = _getIDOTokenAmountByOfferedCurrency(_purchaseAmount);
        uint TGEIDOTokenAmount = IDOTokenAmount * TGEPercentage / PERCENTAGE_DENOMINATOR;
        uint airdropTokenAmount = IDOTokenAmount - TGEIDOTokenAmount;

        _updatePurchasingState(_purchaseAmount, airdropTokenAmount, TGEIDOTokenAmount);
        emit BuyToken(_msgSender(), address(this), address(IDOToken), _purchaseAmount);
    }

    function _updatePurchasingInGalaxyPoolState(uint _purchaseAmount) internal {
        purchasedAmountInGalaxyPool += _purchaseAmount;
    }

    function _updatePurchasingInEarlyAccessState(uint _purchaseAmount) internal {
        purchasedAmountInEarlyAccess += _purchaseAmount;
    }

    function _updatePurchasingState(uint _purchaseAmount, uint _airdropTokenAmount, uint _TGEIDOTokenAmount) internal {
        purchasedAmount += _purchaseAmount;
        userPurchasedAmount[_msgSender()] += _purchaseAmount;
        userIDOAirdropAmount[_msgSender()] += _airdropTokenAmount;
        userIDOTGEAmount[_msgSender()] += _TGEIDOTokenAmount;
    }

    function _deliverTGEIDOTokens(address buyer, uint _TGEtokenAmount) internal {
        IDOToken.safeTransfer(buyer, _TGEtokenAmount);
    }

    function _getIDOTokenAmountByOfferedCurrency(uint _amount) internal view returns(uint){
        return _amount * offeredCurrency.rate / 10 ** offeredCurrency.decimal;
    }

    function _forwardPurchaseTokenFunds(address buyer, uint _purchaseAmount) internal {
        purchaseToken.safeTransferFrom(buyer, address(this), _purchaseAmount);
    }

    function _calculateParticipantFee(uint _purchaseAmount, uint _participationFeePercentage) internal pure returns(uint){
        if(_participationFeePercentage == 0) return 0;
        return _purchaseAmount * _participationFeePercentage / PERCENTAGE_DENOMINATOR;
    }

    function _verifyAllowance(address _user, uint _purchaseAmount) private view{
        uint allowance = purchaseToken.allowance(_user, address(this));
        if(allowance < _purchaseAmount){
            revert NotEnoughAllowance(_user, address(purchaseToken), allowance, _purchaseAmount);
        }
    }

    function _preValidatePurchaseInGalaxyPool(uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations) internal pure{
        _validAmount(_purchaseAmount);
        if(_purchaseAmount > _maxPurchaseBaseOnAllocations){
            revert ExceedMaxPurchaseAmountForUser();
        }
    }

    function _preValidatePurchaseInEarlyAccess(uint _purchaseAmount) internal view{
        _validAmount(_purchaseAmount);
        if(purchasedAmountInEarlyAccess + _purchaseAmount > maxPurchaseAmountForEarlyAccess){
            revert ExceedMaxPurchaseAmountForEarlyAccess(_msgSender(), _purchaseAmount);
        }
    }

    function _preValidatePurchase(uint _purchaseAmount) internal view{
        _validAmount(_purchaseAmount);
        if(purchasedAmount + _purchaseAmount > totalRaiseAmount){
            revert ExceedTotalRaiseAmount(_msgSender(), _purchaseAmount);
        }
    }

    function redeemIDOToken(address _redeemIDOTokenRecipient) external onlyAdmin {
        _validAddress(_redeemIDOTokenRecipient);
        if(paused() == true || block.timestamp > communityOpenTime + communityDuration){
            uint remainAmount = IDOToken.balanceOf(address(this));
            if(remainAmount > 0){
                IDOToken.safeTransfer(_redeemIDOTokenRecipient, remainAmount);
                emit RedeemIDOToken(_redeemIDOTokenRecipient, address(IDOToken), remainAmount);
            }
        }else{
            revert NotEnoughConditionToRedeemIDOToken();
        }
    }

    function redeemPurchaseToken(address _redeemPurchaseTokenRecipient) external onlyAdmin{
        _validAddress(_redeemPurchaseTokenRecipient);
        if(paused() == true || block.timestamp > communityOpenTime + communityDuration){
            uint purchaseAmount = purchaseToken.balanceOf(address(this));
            if(purchaseAmount > 0){
                purchaseToken.safeTransfer(_redeemPurchaseTokenRecipient, purchaseAmount);
                emit RedeemPurchaseToken(_redeemPurchaseTokenRecipient, address(purchaseToken), purchaseAmount);
            }
        }else{
            revert NotEnoughConditionToRedeemPurchaseToken();
        }
    }

    function claimTGEIDOToken(uint _IDOClaimAmount) external {
        if(TGEClaimable == false){
            revert NotAllowedToClaimTGEIDOAmount();
        }
        if(block.timestamp < TGEDate){
            revert NotYetTimeToClaimTGE();
        }
        uint IDOTGEAmount = userIDOTGEAmount[_msgSender()];
        if(_IDOClaimAmount > IDOTGEAmount){
            revert ClaimExceedMaxTGEAmount();
        }
        userIDOTGEAmount[_msgSender()] -= _IDOClaimAmount;
        _deliverTGEIDOTokens(_msgSender(), _IDOClaimAmount);
        emit ClaimTGEAmount(_msgSender(), _IDOClaimAmount);
    }

    function setClaimableTGEIDOToken(bool _TGEClaimableStatus) external onlyAdmin{
        if(TGEClaimable == _TGEClaimableStatus){
            revert AlreadySetClaimableTGE(_TGEClaimableStatus);
        }
        TGEClaimable = _TGEClaimableStatus;
        emit SetTGEClaimable(_TGEClaimableStatus);
    }

    function setIDOTokenAddress(address _IDOToken) external onlyAdmin {
        _validAddress(_IDOToken);
        IDOToken = IERC20(_IDOToken);
        emit SetIDOTokenAddress(_IDOToken);
    }
}
