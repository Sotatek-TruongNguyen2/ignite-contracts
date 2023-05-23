// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "../interfaces/IPool.sol";
import "../utils/Initializable.sol";
import "../utils/AccessControl.sol";
import "../libraries/Clones.sol";

contract PoolFactory is Initializable, AccessControl {

    /// @dev keccak256("ADMIN")
    bytes32 public constant ADMIN = 0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42;

    /// @dev Percentage denominator
    uint16 public constant PERCENTAGE_DENOMINATOR = 10000;

    /// @dev Address of pool implementation
    address public poolImplementationAddress;

    /// @dev Array of created pools address
    address[] public allPools;

    /// @dev Mapping from user to (From token to array of created pools for token)
    mapping(address => mapping(address => address[])) public getCreatedPools;

    event UpdatePoolImplementation(address indexed oldPoolImplementation, address indexed newPoolImplementation);
    event PoolCreated(bytes32 poolInfoHash, address pool);

    error ZeroAmount();
    error ZeroAddress();
    error AlreadyAdmin();
    error ZeroOfferedRate();
    error AlreadyNotAdmin();

    /**
     * @notice Grant admin role for new admin
     * @dev Only admin can call it
     * @param _admin Address of new admin
     */
    function grantAdminRole(address _admin) external onlyRole(ADMIN){
        _validAddress(_admin);
        if(hasRole(ADMIN, _admin)){
            revert AlreadyAdmin();
        }
        _grantRole(ADMIN, _admin);
    }

    /**
     * @notice Revoke admin role of an admin
     * @dev Only admin can call it
     * @param _admin Address of an admin
     */
    function revokeAdminRole(address _admin) external onlyRole(ADMIN){
        if(!hasRole(ADMIN, _admin)){
            revert AlreadyNotAdmin();
        }
        _revokeRole(ADMIN, _admin);
    }

    /**
     * @notice Check whether or not an account has admin role
     * @param _admin Address of an account
     * @return Return true if account has admin role, and vice versa.
     */
    function hasAdminRole(address _admin) external view returns(bool){
        return hasRole(ADMIN, _admin);
    }

    /**
     * @notice Initialize pool factory with address of pool implementation
     * @dev Called only once
     * @param _poolImplementationAddress Address of pool implementation
     */
    function initialize(address _poolImplementationAddress) external initializer {
        poolImplementationAddress = _poolImplementationAddress;
        _setupRole(ADMIN, _msgSender());
    }

    /**
     * @notice Set or change address of pool implementation
     * @dev Only admin can can call it
     * @param _poolImplementationAddress Address of new pool implementation
     */
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
     * @notice Get created pools by token address
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

    /**
     * @notice Create new pool
     * @dev Only has one pool address respectively for one input params
     * @param addrs Array of address includes: address of IDO token, address of purchase token
     * @param uints Array of pool information includes: max purchase amount for KYC user, max purchase amount for Not KYC user, TGE date, TGE percentage, 
     * galaxy participation fee percentage, crowdfunding participation fee percentage, galaxy pool proportion, early access proportion,
     * total raise amount, whale open time, whale duration, community duration, rate and decimal of IDO token
     * @param dbProjectId Project Id in database
     * @return pool Address of new pool
     */
    function createPool(address[2] memory addrs, uint[14] memory uints, uint dbProjectId) external returns (address pool) {
        address _IDOToken = addrs[0];
        bytes32 salt = keccak256(abi.encode(addrs, uints, _msgSender(), dbProjectId));
        pool = Clones.cloneDeterministic(poolImplementationAddress, salt);
        IPool(pool).initialize(addrs, uints);
        getCreatedPools[_msgSender()][_IDOToken].push(pool);
        allPools.push(pool);
        bytes32 poolInfoHash = keccak256(abi.encode(addrs, uints, dbProjectId));
        
        emit PoolCreated(poolInfoHash, pool);
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

}
