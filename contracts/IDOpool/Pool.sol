// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

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
    uint16 public galaxyParticipationFeePercentage;
    uint16 public crowdfundingParticipationFeePercentage;
    uint16 public galaxyPoolProportion;
    uint16 public earlyAccessProportion;
    bool public TGERedeemable;
    uint public totalRaiseAmount;

    uint64 public whaleOpenTime;
    uint64 public whaleCloseTime;
    uint64 public communityOpenTime;
    uint64 public communityCloseTime;

    uint public purchasedAmountInGalaxyPool;
    uint public purchasedAmountInEarlyAccess;
    uint public purchasedAmount;

    mapping(address => uint) public userPurchasedAmount;
    mapping(address => uint) public userIDOAirdropAmount;
    mapping(address => uint) public userIDOTGEAmount;

    event UpdateRoot(bytes32 root);
    event SetTGERedeemable(bool redeemable);
    event SetIDOTokenAddress(address IDOToken);
    event RedeemTGEAmount(address buyer, uint redeemAmount);
    event UpdateFeeRecipient(address indexed feeRecipient);
    event UpdateOpenPoolStatus(address indexed pool, bool status);
    event UpdateOfferedCurrencyRateAndDecimal(uint _rate, uint _decimal);
    event WithdrawIDOToken(address withdrawIDOTokenRecipient, address IDOToken, uint remainAmount);
    event BuyToken(address indexed buyer, address indexed pool, address indexed IDOToken, uint purchaseAmount);
    event WithdrawPurchaseToken(address withdrawPurchaseTokenRecipient, address purchaseToken, uint purchaseAmount);
    event UpdateTime(uint64 whaleOpenTime, uint64 whaleCloseTime, uint64 communityOpenTime, uint64 communityCloseTime);
    event PoolCreated1(address IDOToken, address purchaseToken, uint maxPurchaseAmountForKYCUser, uint maxPurchaseAmountForNotKYCUser, uint64 TGEDate, uint16 TGEPercentage, uint16 galaxyParticipationFeePercentage, uint16 crowdfundingParticipationFeePercentage);
    event PoolCreated2(uint16 galaxyPoolProportion, uint16 earlyAccessProportion, uint totalRaiseAmount, uint64 whaleOpenTime, uint64 whaleCloseTime, uint64 communityCloseTime, uint rate, uint decimal);

    error NotAdmin();
    error ZeroAmount();
    error ZeroAddress();
    error NotValidSignature();
    error NotYetTimeToRedeemTGE();
    error TimeOutToSetPoolStatus();
    error RedeemExceedMaxTGEAmount();
    error NotInWhaleList(address buyer);
    error NotAllowedToRedeemTGEIDOAmount();
    error ExceedMaxPurchaseAmountForUser();
    error NotEnoughConditionToWithdrawIDOToken();
    error NotEnoughConditionToWithdrawPurchaseToken();
    error AlreadySetRedeemableTGE(bool presentStatus);
    error ExceedTotalRaiseAmount(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForKYCUser(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForGalaxyPool(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForNotKYCUser(address buyer, uint purchaseAmount);
    error ExceedMaxPurchaseAmountForEarlyAccess(address buyer, uint purchaseAmount);
    error NotEnoughAllowance(address buyer, address purchaseToken, uint allowance, uint amount);
    error NotUpdateValidTime(uint whaleOpenTime, uint whaleCloseTime, uint communityOpenTime, uint communityCloseTime);
    error TimeOutToBuyToken(uint whaleOpenTime, uint whaleCloseTime, uint communityOpenTime, uint communityCloseTime, uint timestamp, address buyer);

    /**
     * @dev Check whether or not sender of transaction has admin role
     */
    modifier onlyAdmin {
        if(!poolFactory.hasAdminRole(_msgSender())){
            revert NotAdmin();
        }
        _;
    }

    /**
     * @notice Initialize a pool with its information
     * @dev Emit 2 events
     * @param addrs Array of address includes: address of IDO token, address of purchase token
     * @param uints Array of pool information includes: max purchase amount for KYC user, max purchase amount for Not KYC user, TGE date, TGE percentage, 
     * galaxy participation fee percentage, crowdfunding participation fee percentage, galaxy pool proportion, early access proportion,
     * total raise amount, whale open time, whale duration, community duration, rate and decimal of IDO token
     */
    function initialize(address[2] memory addrs, uint[14] memory uints) external initializer{
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
            uint _galaxyParticipationFeePercentage = uints[4];
            uint _crowdfundingParticipationFeePercentage = uints[5];
            galaxyParticipationFeePercentage = SafeCast.toUint16(_galaxyParticipationFeePercentage);
            crowdfundingParticipationFeePercentage = SafeCast.toUint16(_crowdfundingParticipationFeePercentage);
        }
        {
            uint _galaxyPoolProportion = uints[6];
            uint _earlyAccessProportion = uints[7];
            uint _totalRaiseAmount = uints[8];
            galaxyPoolProportion = SafeCast.toUint16(_galaxyPoolProportion);
            earlyAccessProportion = SafeCast.toUint16(_earlyAccessProportion);
            totalRaiseAmount = _totalRaiseAmount;

            maxPurchaseAmountForGalaxyPool = _totalRaiseAmount * _galaxyPoolProportion / PERCENTAGE_DENOMINATOR;
            maxPurchaseAmountForEarlyAccess = _totalRaiseAmount * (PERCENTAGE_DENOMINATOR - _galaxyPoolProportion) * _earlyAccessProportion / PERCENTAGE_DENOMINATOR / PERCENTAGE_DENOMINATOR;
        }
        {
            uint _whaleOpenTime = uints[9];
            uint _whaleDuration = uints[10];
            uint _communityDuration = uints[11];
            whaleOpenTime = SafeCast.toUint64(_whaleOpenTime);
            whaleCloseTime = SafeCast.toUint64(_whaleOpenTime+_whaleDuration);
            communityOpenTime = whaleCloseTime;
            communityCloseTime = SafeCast.toUint64(communityOpenTime + _communityDuration);
        }
        {
            uint _rate = uints[12];
            uint _decimal = uints[13];
            offeredCurrency.rate = _rate;
            offeredCurrency.decimal = _decimal;
        }
        
        emit PoolCreated1(address(IDOToken), address(purchaseToken), maxPurchaseAmountForKYCUser, maxPurchaseAmountForNotKYCUser, TGEDate, TGEPercentage, galaxyParticipationFeePercentage, crowdfundingParticipationFeePercentage);
        emit PoolCreated2(galaxyPoolProportion, earlyAccessProportion, totalRaiseAmount, whaleOpenTime, whaleCloseTime, communityCloseTime, offeredCurrency.rate, offeredCurrency.decimal);
    }

    /**
     * @notice Set merkle tree root after snapshoting information of investor
     * @dev Only admin can call it
     * @param _root Root of merkle tree
     */
    function setRoot(bytes32 _root) external onlyAdmin{
        root = _root;
        emit UpdateRoot(root);
    }

    /**
     * @notice Close pool: cancel project, nobody can buy token
     * @dev Only admin can call it
     */
    function closePool() external onlyAdmin {
        _pause();
        emit UpdateOpenPoolStatus(address(this), false);
    }

    /**
     * @notice Update time for galaxy pool and crowdfunding pool
     * @dev Only admin can call it, galaxy pool must be closed before crowdfunding pool
     * @param _newWhaleCloseTime New close time of galaxy pool
     * @param _newCommunityCloseTime New close time of crowdfunding pool
     */
    function updateTime(uint64 _newWhaleCloseTime, uint64 _newCommunityCloseTime) external onlyAdmin {
        if(_newWhaleCloseTime >= _newCommunityCloseTime || _newWhaleCloseTime <= whaleOpenTime) {
            revert NotUpdateValidTime(whaleOpenTime, whaleCloseTime, communityOpenTime, communityCloseTime);
        }
        whaleCloseTime = _newWhaleCloseTime;
        communityOpenTime = _newWhaleCloseTime;
        communityCloseTime = _newCommunityCloseTime;
        emit UpdateTime(whaleOpenTime, whaleCloseTime, communityOpenTime, communityCloseTime);
    }

    /**
     * @notice Investor buy token in galaxy pool
     * @dev Must be in time for whale and pool is not closed
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocation of whale
     */
    function buyTokenInGalaxyPool(bytes32[] memory proof, uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations) external whenNotPaused nonReentrant {
        if(!_validWhaleSession()) {
            revert TimeOutToBuyToken(whaleOpenTime, whaleCloseTime, communityOpenTime, communityCloseTime, block.timestamp, _msgSender());
        }
        _verifyAllowance(_msgSender(), _purchaseAmount);
        _preValidatePurchaseInGalaxyPool(_purchaseAmount,_maxPurchaseBaseOnAllocations);
        _internalWhaleBuyToken(proof, _purchaseAmount, _maxPurchaseBaseOnAllocations, galaxyParticipationFeePercentage);
        _updatePurchasingInGalaxyPoolState(_purchaseAmount);
    }

    /**
     * @notice Investor buy token in crowdfunding pool
     * @dev Must be in time for crowdfunding pool and pool is not closed
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     */
    function buyTokenInCrowdfundingPool(bytes32[] memory proof, uint _purchaseAmount) external whenNotPaused nonReentrant {
        _verifyAllowance(_msgSender(), _purchaseAmount);
        if(_validWhaleSession()){
            _preValidatePurchaseInEarlyAccess(_purchaseAmount);
            _internalWhaleBuyToken(proof, _purchaseAmount, 0, crowdfundingParticipationFeePercentage);
            _updatePurchasingInEarlyAccessState(_purchaseAmount);
        }else if(_validCommunitySession()){
            _preValidatePurchase(_purchaseAmount);
            _internalNormalUserBuyToken(proof, _purchaseAmount);
        }else{
            revert TimeOutToBuyToken(whaleOpenTime, whaleCloseTime, communityOpenTime, communityCloseTime, block.timestamp, _msgSender());
        }
    }

    /**
     * @notice Investor buy token in galaxy pool
     * @dev Investor do not need execute approve transaction, but need to sign data off-chain; used only for USDC.
     * Must be in time for whale and pool is not closed
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocation of whale
     * @param _deadline Deadline of off-chain investor's signature
     * @param _signature Signature of investor
     */
    function buyTokenInGalaxyPoolWithPermit(bytes32[] memory proof, uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations, uint _deadline, bytes memory _signature) external whenNotPaused nonReentrant{
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        IERC20Permit(address(purchaseToken)).permit(_msgSender(), address(this), _purchaseAmount, _deadline, v, r, s);
        if(!_validWhaleSession()) {
            revert TimeOutToBuyToken(whaleOpenTime, whaleCloseTime, communityOpenTime, communityCloseTime, block.timestamp, _msgSender());
        }
        _preValidatePurchaseInGalaxyPool(_purchaseAmount,_maxPurchaseBaseOnAllocations);
        _internalWhaleBuyToken(proof, _purchaseAmount, _maxPurchaseBaseOnAllocations, galaxyParticipationFeePercentage);
        _updatePurchasingInGalaxyPoolState(_purchaseAmount);
    }

    /**
     * @notice Investor buy token in crowdfunding pool
     * @dev Investor do not need execute approve transaction, but need to sign data off-chain; used only for USDC.
     * Must be in time for crowdfunding pool and pool is not closed
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     * @param _allowance Allowance amount of investor's USDC for pool
     * @param _deadline Deadline of off-chain investor's signature
     * @param _signature Signature of investor
     */
    function buyTokenInCrowdfundingPoolWithPermit(bytes32[] memory proof, uint _purchaseAmount, uint _allowance, uint _deadline, bytes memory _signature) external whenNotPaused nonReentrant{
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        IERC20Permit(address(purchaseToken)).permit(_msgSender(), address(this), _allowance, _deadline, v, r, s);
        _verifyAllowance(_msgSender(), _purchaseAmount);
        if(_validWhaleSession()){
            _preValidatePurchaseInEarlyAccess(_purchaseAmount);
            _internalWhaleBuyToken(proof, _purchaseAmount, 0, crowdfundingParticipationFeePercentage);
            _updatePurchasingInEarlyAccessState(_purchaseAmount);
        }else if(_validCommunitySession()){
            _preValidatePurchase(_purchaseAmount);
            _internalNormalUserBuyToken(proof, _purchaseAmount);
        }else{
            revert TimeOutToBuyToken(whaleOpenTime, whaleCloseTime, communityOpenTime, communityCloseTime, block.timestamp, _msgSender());
        }
    }

    /**
     * @notice Admin withdraw redundant IDO token in pool
     * @dev Only admin can call it after pool closed
     * @param _withdrawIDOTokenRecipient Address of recipient
     */
    function withdrawIDOToken(address _withdrawIDOTokenRecipient) external onlyAdmin {
        _validAddress(address(IDOToken));
        _validAddress(_withdrawIDOTokenRecipient);
        if(paused() == true || block.timestamp > communityCloseTime){
            uint remainAmount = IDOToken.balanceOf(address(this));
            if(remainAmount > 0){
                IDOToken.safeTransfer(_withdrawIDOTokenRecipient, remainAmount);
                emit WithdrawIDOToken(_withdrawIDOTokenRecipient, address(IDOToken), remainAmount);
            }
        }else{
            revert NotEnoughConditionToWithdrawIDOToken();
        }
    }

    /**
     * @notice Admin withdraw purchase token in pool
     * @dev Only admin can call it after pool closed
     * @param _withdrawPurchaseTokenRecipient Address of recipient
     */
    function withdrawPurchaseToken(address _withdrawPurchaseTokenRecipient) external onlyAdmin{
        _validAddress(_withdrawPurchaseTokenRecipient);
        if(paused() == true || block.timestamp > communityCloseTime){
            uint purchaseAmount = purchaseToken.balanceOf(address(this));
            if(purchaseAmount > 0){
                purchaseToken.safeTransfer(_withdrawPurchaseTokenRecipient, purchaseAmount);
                emit WithdrawPurchaseToken(_withdrawPurchaseTokenRecipient, address(purchaseToken), purchaseAmount);
            }
        }else{
            revert NotEnoughConditionToWithdrawPurchaseToken();
        }
    }

    /**
     * @notice Investor redeem IDO token after TGE date
     * @param _IDORedeemAmount Amount of IDO token is wanted to redeem
     */
    function redeemTGEIDOToken(uint _IDORedeemAmount) external {
        _validAddress(address(IDOToken));
        if(TGERedeemable == false){
            revert NotAllowedToRedeemTGEIDOAmount();
        }
        if(block.timestamp < TGEDate){
            revert NotYetTimeToRedeemTGE();
        }
        uint IDOTGEAmount = userIDOTGEAmount[_msgSender()];
        if(_IDORedeemAmount > IDOTGEAmount){
            revert RedeemExceedMaxTGEAmount();
        }
        userIDOTGEAmount[_msgSender()] -= _IDORedeemAmount;
        _deliverTGEIDOTokens(_msgSender(), _IDORedeemAmount);
        emit RedeemTGEAmount(_msgSender(), _IDORedeemAmount);
    }

    /**
     * @notice Allow or disallow investors to redeem TGE amount of IDO token
     * @dev Only admin can call it
     */
    function setRedeemableTGEIDOToken(bool _TGERedeemableStatus) external onlyAdmin{
        _validAddress(address(IDOToken));
        if(TGERedeemable == _TGERedeemableStatus){
            revert AlreadySetRedeemableTGE(_TGERedeemableStatus);
        }
        TGERedeemable = _TGERedeemableStatus;
        emit SetTGERedeemable(_TGERedeemableStatus);
    }

    /**
     * @dev Check whether or not an address is zero address
     * @param _address An address
     */
    function _validAddress(address _address) internal pure {
        if (_address == address(0)) {
            revert ZeroAddress();
        }
    }

    /**
     * @dev Check whether or not an amount greater than 0
     * @param _amount An amount
     */
    function _validAmount(uint _amount) internal pure {
        if (_amount == 0) {
            revert ZeroAmount();
        }
    }

    /**
     * @dev Check whether or not length of a signature is valid
     * @param _signature Signature of investor
     */
    function _validSignature(bytes memory _signature) internal pure {
        if (_signature.length != 65) {
            revert NotValidSignature();
        }
    }

    /**
     * @dev Internal function for whale to buy token
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocation of whale
     * @param _participationFeePercentage Fee percentage when buying token
     */
    function _internalWhaleBuyToken(bytes32[] memory proof, uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations, uint _participationFeePercentage) internal {
        if(_verifyUser(_msgSender(), WHALE, maxPurchaseAmountForKYCUser, _maxPurchaseBaseOnAllocations, proof)){
            _internalBuyToken(_msgSender(), _purchaseAmount, _participationFeePercentage, true);
        }else if(_verifyUser(_msgSender(), WHALE, maxPurchaseAmountForNotKYCUser, _maxPurchaseBaseOnAllocations, proof)){
            _internalBuyToken(_msgSender(), _purchaseAmount, _participationFeePercentage, false);
        }else{
            revert NotInWhaleList(_msgSender());
        }
    }

    /**
     * @dev Internal function for normal user to buy token
     * @param proof Respective proof for a leaf, which is respective for investor in merkle tree
     * @param _purchaseAmount Purchase amount of investor
     */
    function _internalNormalUserBuyToken(bytes32[] memory proof, uint _purchaseAmount) internal{
        if(_verifyUser(_msgSender(), NORMAL_USER, maxPurchaseAmountForKYCUser, 0, proof)){
            _internalBuyToken(_msgSender(), _purchaseAmount, crowdfundingParticipationFeePercentage, true);
        }else {
            _internalBuyToken(_msgSender(), _purchaseAmount, crowdfundingParticipationFeePercentage, false);
        }
    }
    
    /**
     * @dev Split signature of investor to v,r,s
     * @param _signature Signature of investor
     * @return r r element of signature
     * @return s s element of signature
     * @return v v element of signature
     */
    function _splitSignature(bytes memory _signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        _validSignature(_signature);
        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }
    }

    /**
     * @dev Check whether or not session of whale
     * @return Return true if yes, and vice versa
     */
    function _validWhaleSession() internal view returns(bool){
        return block.timestamp > whaleOpenTime && block.timestamp <= whaleCloseTime;
    }

    /**
     * @dev Check whether or not session of community user
     * @return Return true if yes, and vice versa
     */
    function _validCommunitySession() internal view returns (bool) {
        return block.timestamp > communityOpenTime && block.timestamp <= communityCloseTime;
    }    

    /**
     * @dev Internal function to buy token
     * @param buyer Address of investor
     * @param _purchaseAmount Purchase amount of investor
     * @param _participationFeePercentage Fee percentage when buying token
     * @param _KYCStatus True if investor KYC and vice versa
     */
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

        if(address(IDOToken) != address(0) || offeredCurrency.rate != 0){
            uint IDOTokenAmount = _getIDOTokenAmountByOfferedCurrency(_purchaseAmount);
            uint TGEIDOTokenAmount = IDOTokenAmount * TGEPercentage / PERCENTAGE_DENOMINATOR;
            uint airdropTokenAmount = IDOTokenAmount - TGEIDOTokenAmount;
            _updatePurchasingState(_purchaseAmount, airdropTokenAmount, TGEIDOTokenAmount);
        }else{
            _updatePurchasingState(_purchaseAmount, 0, 0);
        }

        emit BuyToken(_msgSender(), address(this), address(IDOToken), _purchaseAmount);
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
    function _updatePurchasingInEarlyAccessState(uint _purchaseAmount) internal {
        purchasedAmountInEarlyAccess += _purchaseAmount;
    }

    /**
     * @dev Update purchasing amount, airdrop amount and TGE amount in all pools
     * @param _purchaseAmount Purchase amount of investor
     * @param _airdropTokenAmount Airdrop token amount of investor
     * @param _TGEIDOTokenAmount TGE amount of investor
     */
    function _updatePurchasingState(uint _purchaseAmount, uint _airdropTokenAmount, uint _TGEIDOTokenAmount) internal {
        purchasedAmount += _purchaseAmount;
        userPurchasedAmount[_msgSender()] += _purchaseAmount;
        userIDOAirdropAmount[_msgSender()] += _airdropTokenAmount;
        userIDOTGEAmount[_msgSender()] += _TGEIDOTokenAmount;
    }

    /**
     * @dev Transfer TGE amount of token to investor
     * @param buyer Address of investor
     * @param _TGETokenAmount TGE amount of token of investor
     */
    function _deliverTGEIDOTokens(address buyer, uint _TGETokenAmount) internal {
        IDOToken.safeTransfer(buyer, _TGETokenAmount);
    }

    /**
     * @dev Get IDO token amount base on amount of purchase token
     * @param _amount Amount of purchase token
     * @return Return amount of respective IDO token
     */
    function _getIDOTokenAmountByOfferedCurrency(uint _amount) internal view returns(uint){
        return _amount * offeredCurrency.rate / 10 ** offeredCurrency.decimal;
    }

    /**
     * @dev Transfer purchase token from investor to pool
     * @param buyer Address of investor
     * @param _purchaseAmount Purchase amount of investor
     */
    function _forwardPurchaseTokenFunds(address buyer, uint _purchaseAmount) internal {
        purchaseToken.safeTransferFrom(buyer, address(this), _purchaseAmount);
    }

    /**
     * @dev Calculate fee when investor buy token
     * @param _purchaseAmount Purchase amount of investor
     * @param _participationFeePercentage Fee percentage when buying token
     * @return Return amount of fee when investor buy token
     */
    function _calculateParticipantFee(uint _purchaseAmount, uint _participationFeePercentage) internal pure returns(uint){
        if(_participationFeePercentage == 0) return 0;
        return _purchaseAmount * _participationFeePercentage / PERCENTAGE_DENOMINATOR;
    }

    /**
     * @dev Verify allowance of investor's token for pool
     * @param _user Address of investor
     * @param _purchaseAmount Purchase amount of investor
     */
    function _verifyAllowance(address _user, uint _purchaseAmount) private view{
        uint allowance = purchaseToken.allowance(_user, address(this));
        if(allowance < _purchaseAmount){
            revert NotEnoughAllowance(_user, address(purchaseToken), allowance, _purchaseAmount);
        }
    }

    /**
     * @dev Check whether or not purchase amount exceeds max purchase amount base on allocation for whale
     * @param _purchaseAmount Amount of purchase token
     * @param _maxPurchaseBaseOnAllocations Max purchase amount base on allocations for whale
     */
    function _preValidatePurchaseInGalaxyPool(uint _purchaseAmount, uint _maxPurchaseBaseOnAllocations) internal pure{
        _validAmount(_purchaseAmount);
        if(_purchaseAmount > _maxPurchaseBaseOnAllocations){
            revert ExceedMaxPurchaseAmountForUser();
        }
    }

    /**
     * @dev Check whether or not purchase amount exceeds max purchase in early access for whale
     * @param _purchaseAmount Purchase amount of investor
     */
    function _preValidatePurchaseInEarlyAccess(uint _purchaseAmount) internal view{
        _validAmount(_purchaseAmount);
        if(purchasedAmountInEarlyAccess + _purchaseAmount > maxPurchaseAmountForEarlyAccess){
            revert ExceedMaxPurchaseAmountForEarlyAccess(_msgSender(), _purchaseAmount);
        }
    }

    /**
     * @dev Check whether or not purchase amount exceeds amount in all pools
     * @param _purchaseAmount Purchase amount of investor
     */
    function _preValidatePurchase(uint _purchaseAmount) internal view{
        _validAmount(_purchaseAmount);
        if(purchasedAmount + _purchaseAmount > totalRaiseAmount){
            revert ExceedTotalRaiseAmount(_msgSender(), _purchaseAmount);
        }
    }
}
