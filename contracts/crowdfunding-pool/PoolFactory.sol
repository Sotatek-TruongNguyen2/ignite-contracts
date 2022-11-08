// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Pool.sol";
import "../interfaces/IPool.sol";
import "../libraries/Initializable.sol";

contract PoolFactory is Initializable {
    address masterAdmin;
    address newMasterAdmin;
    // Array of created Pools Address
    address[] public allPools;
    // Mapping from User token. From tokens to array of created Pools for token
    mapping(address => mapping(address => address[])) public getPools;

    event PoolCreated(
        address registedBy,
        address indexed token,
        address indexed pool,
        uint256 poolId
    );
    event GrantMasterAdminRole(address newMasterAdmin);
    event AcceptMasterAdminRole(
        address indexed oldMasterAdmin,
        address indexed newMasterAdmin
    );

    error NotMasterAdmin();
    error NotGrantedMasterAdmin();
    error ZeroAddress();
    error ZeroAmount();
    error ZeroOfferedRate();

    modifier onlyMasterAdmin() {
        if (msg.sender != masterAdmin) {
            revert NotMasterAdmin();
        }
        _;
    }

    function initialize(address _masterAdmin) external initializer {
        masterAdmin = _masterAdmin;
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
    function getCreatedPoolsByToken(address _creator, address _token)
        public
        view
        returns (address[] memory)
    {
        return getPools[_creator][_token];
    }

    /**
     * @notice Retrieve number of pools created for specific token
     * @param _creator Address of created pool user
     * @param _token Address of token want to query
     * @return Return number of created pool
     */
    function getCreatedPoolsLengthByToken(address _creator, address _token)
        public
        view
        returns (uint256)
    {
        return getPools[_creator][_token].length;
    }

    function grantMasterAdminRole(address _newMasterAdmin)
        external
        onlyMasterAdmin
    {
        if (_newMasterAdmin == address(0)) {
            revert ZeroAddress();
        }
        newMasterAdmin = _newMasterAdmin;
        emit GrantMasterAdminRole(_newMasterAdmin);
    }

    function acceptMasterAdminRole() external {
        if (msg.sender != newMasterAdmin) {
            revert NotGrantedMasterAdmin();
        }
        address oldMasterAdmin = masterAdmin;
        masterAdmin = msg.sender;
        newMasterAdmin = address(0);
        emit AcceptMasterAdminRole(oldMasterAdmin, masterAdmin);
    }

    function registerPool(address[5] memory addresses, uint[11] memory numbers)
        external
        returns (address pool)
    {
        address _IDOToken = addresses[0];
        if (_IDOToken == address(0)) {
            revert ZeroAddress();
        }
        {
            address _purchaseToken = addresses[1];
            if (_purchaseToken == address(0)) {
                revert ZeroAddress();
            }
            address _feeRecipient = addresses[2];
            if (_feeRecipient == address(0)) {
                revert ZeroAddress();
            }
            address _purchaseTokenRecipient = addresses[3];
            if (_purchaseTokenRecipient == address(0)) {
                revert ZeroAddress();
            }
            address _redeemIDOTokenRecipient = addresses[4];
            if (_redeemIDOTokenRecipient == address(0)) {
                revert ZeroAddress();
            }
        }
        {
            // uint _participationFeePercentage = numbers[0];
            uint _totalRaiseAmount = numbers[1];
            if (_totalRaiseAmount == 0) {
                revert ZeroAmount();
            }
            // uint _whaleProportion = numbers[2];
            // uint _whaleOpenTime = numbers[3];
            // uint _whaleDuration = numbers[4];
            // uint _communityOpenTime = numbers[5];
            uint _communityDuration = numbers[6];
            if (_communityDuration == 0) {
                revert ZeroAmount();
            }
            // uint _maxPurchaseAmountForNotKYCUser = numbers[7];
            // uint _maxPurchaseAmountForKYCUser = numbers[8];
            uint _rate = numbers[9];
            if (_rate == 0) {
                revert ZeroOfferedRate();
            }
            // uint _decimal = numbers[10];
        }
        bytes memory bytecode = type(Pool).creationCode;
        uint256 tokenIndex = getCreatedPoolsLengthByToken(
            msg.sender,
            _IDOToken
        );
        bytes32 salt = keccak256(
            abi.encodePacked(msg.sender, _IDOToken, tokenIndex)
        );
        assembly {
            pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        address[6] memory _addresses;
        for (uint i = 0; i < addresses.length; ++i) {
            _addresses[i] = addresses[i];
        }
        _addresses[5] = masterAdmin;
        IPool(pool).initilize(_addresses, numbers);
        getPools[msg.sender][_IDOToken].push(pool);
        allPools.push(pool);

        emit PoolCreated(msg.sender, _IDOToken, pool, allPools.length - 1);
    }
}
