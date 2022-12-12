// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../interfaces/IPool.sol";
import "../utils/Initializable.sol";
import "../utils/AccessControl.sol";
import "../libraries/Clones.sol";

contract PoolFactory is Initializable, AccessControl {

    // keccak256("ADMIN")
    bytes32 public constant ADMIN = 0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42;

    uint16 public constant PERCENTAGE_DENOMINATOR = 10000;

    address public poolImplementationAddress;

    // Array of created Pools Address
    address[] public allPools;

    // Mapping from user to (From token to array of created Pools for token)
    mapping(address => mapping(address => address[])) public getCreatedPools;

    error ZeroAmount();
    error ZeroAddress();
    error AlreadyAdmin();
    error ZeroOfferedRate();
    error AlreadyNotAdmin();
    error NotValidGalaxyPoolProportion();
    error NotValidEarlyAccessProportion();
    event PoolCreated(address createdBy, address indexed token, address indexed pool, uint256 poolId);
    event UpdatePoolImplementation(address indexed oldPoolImplementation, address indexed newPoolImplementation);

    function grantAdminRole(address _admin) external onlyRole(ADMIN){
        _validAddress(_admin);
        if(hasRole(ADMIN, _admin)){
            revert AlreadyAdmin();
        }
        _grantRole(ADMIN, _admin);
    }

    function revokeAdminRole(address _admin) external onlyRole(ADMIN){
        if(!hasRole(ADMIN, _admin)){
            revert AlreadyNotAdmin();
        }
        _revokeRole(ADMIN, _admin);
    }

    function hasAdminRole(address _admin) external view returns(bool){
        return hasRole(ADMIN, _admin);
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

    function initialize(address _poolImplementationAddress) external initializer {
        poolImplementationAddress = _poolImplementationAddress;
        _setupRole(ADMIN, _msgSender());
    }

    function setPoolImplementation(address _poolImplementationAddress) external onlyRole(ADMIN) {
        _validAddress(_poolImplementationAddress);
        address oldPoolImplementation = poolImplementationAddress;
        poolImplementationAddress = _poolImplementationAddress;
        emit UpdatePoolImplementation(oldPoolImplementation, _poolImplementationAddress);
    }

    /**
     * @notice Get the number of all created pools
     * @return Return number of created pools
     */
    function allPoolsLength() public view returns (uint256) {
        return allPools.length;
    }

    /**
     * @notice Get the created pools by token address
     * @dev User can retrieve their created pool by address of tokens
     * @param _creator Address of created pool user
     * @param _token Address of token want to query
     * @return Created Pool Address
     */
    function getCreatedPoolsByToken(address _creator, address _token) public view returns (address[] memory) {
        return getCreatedPools[_creator][_token];
    }

    /**
     * @notice Retrieve number of pools created for specific token
     * @param _creator Address of created pool user
     * @param _token Address of token want to query
     * @return Return number of created pool
     */
    function getCreatedPoolsLengthByToken(address _creator, address _token) public view returns (uint256) {
        return getCreatedPools[_creator][_token].length;
    }

    function createPool(address[2] memory addrs, uint[13] memory uints) external returns (address pool) {
        _verifyPoolInfo(addrs, uints);
        address _IDOToken = addrs[0];
        uint256 tokenIndex = getCreatedPoolsLengthByToken(_msgSender(), _IDOToken);
        bytes32 salt = keccak256(abi.encodePacked(_msgSender(), _IDOToken, tokenIndex));
        pool = Clones.cloneDeterministic(poolImplementationAddress, salt);
        IPool(pool).initialize(addrs, uints);
        getCreatedPools[_msgSender()][_IDOToken].push(pool);
        allPools.push(pool);

        emit PoolCreated(_msgSender(), _IDOToken, pool, allPools.length - 1);

    }

    function _verifyPoolInfo(address[2] memory addrs, uint[13] memory uints) internal pure{
        // address _IDOToken = addrs[0];
        {
            address _purchaseToken = addrs[1];
            _validAddress(_purchaseToken);
        }
        {
            /*
            uint _maxPurchaseAmountForKYCUser = uints[0];
            uint _maxPurchaseAmountForNotKYCUser = uints[1];
            uint _TGEDate = uints[2];
            uint _TGEPercentage = uints[3];
            uint _participationFeePercentage = uints[4];
            uint _galaxyPoolProportion = uints[5];
            uint _earlyAccessProportion = uints[6];
            uint _totalRaiseAmount = uints[7];
            uint _whaleOpenTime = uints[8];
            uint _whaleDuration = uints[9];
            uint _communityDuration = uints[10];
            uint _rate = uints[11];
            uint _decimal = uints[12];
            */

            uint _galaxyPoolProportion = uints[5];
            if(_galaxyPoolProportion > PERCENTAGE_DENOMINATOR){
                revert NotValidGalaxyPoolProportion();
            }

            uint _earlyAccessProportion = uints[6];
            if(_earlyAccessProportion > PERCENTAGE_DENOMINATOR){
                revert NotValidEarlyAccessProportion();
            }

            uint _totalRaiseAmount = uints[7];
            _validAmount(_totalRaiseAmount);

        }
    }

}
