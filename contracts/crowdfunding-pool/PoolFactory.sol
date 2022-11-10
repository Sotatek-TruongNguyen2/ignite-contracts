// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../interfaces/IPool.sol";
import "../utils/Initializable.sol";
import "../utils/AccessControl.sol";
import "../libraries/Clones.sol";

contract PoolFactory is Initializable, AccessControl {
    // keccak256("MASTER_ADMIN_ROLE")
    bytes32 public constant MASTER_ADMIN_ROLE =
        0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3;

    address public poolImplementationAddress;
    address public masterAdmin;
    address public grantedMasterAdmin;

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
    event GrantMasterAdminRole(address grantedMasterAdmin);
    event ClaimMasterAdminRole(
        address indexed oldMasterAdmin,
        address indexed grantedMasterAdmin
    );
    event UpdatePoolImplementation(
        address indexed oldPoolImplementation,
        address indexed newPoolImplementation
    );

    error NotMasterAdmin();
    error NotGrantedMasterAdmin();
    error ZeroAddress();
    error ZeroAmount();
    error ZeroOfferedRate();
    error NotValidWhaleProportion();

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

    function initialize(
        address _masterAdmin,
        address _poolImplementationAddress
    ) external initializer {
        masterAdmin = _masterAdmin;
        poolImplementationAddress = _poolImplementationAddress;
        _setupRole(MASTER_ADMIN_ROLE, _masterAdmin);
    }

    function setPoolImplementation(address _poolImplementationAddress)
        external
        onlyRole(MASTER_ADMIN_ROLE)
    {
        _validAddress(_poolImplementationAddress);
        address oldPoolImplementation = poolImplementationAddress;
        poolImplementationAddress = _poolImplementationAddress;
        emit UpdatePoolImplementation(
            oldPoolImplementation,
            _poolImplementationAddress
        );
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
        onlyRole(MASTER_ADMIN_ROLE)
    {
        _validAddress(_newMasterAdmin);
        grantedMasterAdmin = _newMasterAdmin;
        emit GrantMasterAdminRole(_newMasterAdmin);
    }

    function claimMasterAdminRole() external {
        if (msg.sender != grantedMasterAdmin) {
            revert NotGrantedMasterAdmin();
        }
        _revokeRole(MASTER_ADMIN_ROLE, masterAdmin);
        _grantRole(MASTER_ADMIN_ROLE, grantedMasterAdmin);
        emit ClaimMasterAdminRole(masterAdmin, grantedMasterAdmin);

        masterAdmin = grantedMasterAdmin;
        grantedMasterAdmin = address(0);
    }

    function registerPool(address[5] memory addresses, uint[11] memory numbers)
        external
        returns (address pool)
    {
        address _IDOToken = addresses[0];
        _validAddress(_IDOToken);
        {
            address _purchaseToken = addresses[1];
            _validAddress(_purchaseToken);

            address _feeRecipient = addresses[2];
            _validAddress(_feeRecipient);

            address _purchaseTokenRecipient = addresses[3];
            _validAddress(_purchaseTokenRecipient);

            address _redeemIDOTokenRecipient = addresses[4];
            _validAddress(_redeemIDOTokenRecipient);
        }
        {
            // uint _participationFeePercentage = numbers[0];
            uint _totalRaiseAmount = numbers[1];
            _validAmount(_totalRaiseAmount);
            uint _whaleProportion = numbers[2];
            if(_whaleProportion > 10000){
                revert NotValidWhaleProportion();
            }
            // uint _whaleOpenTime = numbers[3];
            // uint _whaleDuration = numbers[4];
            // uint _communityOpenTime = numbers[5];
            uint _communityDuration = numbers[6];
            _validAmount(_communityDuration);
            // uint _maxPurchaseAmountForNotKYCUser = numbers[7];
            // uint _maxPurchaseAmountForKYCUser = numbers[8];
            uint _rate = numbers[9];
            if (_rate == 0) {
                revert ZeroOfferedRate();
            }
            // uint _decimal = numbers[10];
        }
        uint256 tokenIndex = getCreatedPoolsLengthByToken(
            msg.sender,
            _IDOToken
        );
        bytes32 salt = keccak256(
            abi.encodePacked(msg.sender, _IDOToken, tokenIndex)
        );
        pool = Clones.cloneDeterministic(poolImplementationAddress, salt);

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
