// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "../interfaces/IPool.sol";
import "../libraries/Clones.sol";
import "../interfaces/IIgnitionFactory.sol";
import "../interfaces/IVesting.sol";
import "./BasePausable.sol";
import "../interfaces/IIgnitionFactory.sol";

contract IgnitionFactory is BasePausable {
    /// @dev Address of pool implementation
    address public poolImplementationAddress;

    /// @dev Address of vesting implementation
    address public vestingImplementationAddress;

    event UpdatePoolImplementation(
        address indexed oldPoolImplementation,
        address indexed newPoolImplementation
    );

    event UpdateVestingImplementation(
        address indexed oldVestingImplementation,
        address indexed newVestingImplementation
    );

    event PoolCreated(bytes32 poolInfoHash, address pool);

    event VestingCreated(address sender, address vesting);

    /**
     * @notice Initialize pool factory with address of pool implementation
     * @dev Called only once
     * @param _poolImplementationAddress Address of pool implementation
     */
    function initialize(
        address _poolImplementationAddress,
        address _vestingImplementationAddress
    ) external initializer {
        poolImplementationAddress = _poolImplementationAddress;
        vestingImplementationAddress = _vestingImplementationAddress;
        _setupRole(OWNER_ROLE, _msgSender());
        _setRoleAdmin(OWNER_ROLE, OWNER_ROLE);
    }

    /**
     * @notice Set or change address of pool implementation
     * @dev Only admin can can call it
     * @param _poolImplementationAddress Address of new pool implementation
     */
    function setPoolImplementation(
        address _poolImplementationAddress
    ) external onlyOwner {
        _validAddress(_poolImplementationAddress);
        address oldPoolImplementation = poolImplementationAddress;
        poolImplementationAddress = _poolImplementationAddress;
        emit UpdatePoolImplementation(
            oldPoolImplementation,
            _poolImplementationAddress
        );
    }

    /**
     * @notice Set or change address of vesting implementation
     * @dev Only admin can can call it
     * @param _vestingImplementationAddress Address of new vesting implementation
     */
    function setVestingImplementation(
        address _vestingImplementationAddress
    ) external onlyOwner {
        _validAddress(_vestingImplementationAddress);
        address oldVestingImplementation = vestingImplementationAddress;
        vestingImplementationAddress = _vestingImplementationAddress;
        emit UpdateVestingImplementation(
            oldVestingImplementation,
            _vestingImplementationAddress
        );
    }

    /**
     * @notice Create new pool. One pool has 2 sub-pool: galaxy pool and crowfunding pool, with 2 different participation fee.
     * In crowfunding pool, there is a part for WHALE to buy early (called EARLY ACCESS) and another for NORMAL user to buy
     * (called NORMAL ACCESS). Duration of galaxy pool and EARLY ACCESS are same and before duration of NORMAL ACCESS.
     *
     * There are 3 types of profit: participation fee, token fee and collaborator profit.
     * Token fee + Collaborator profit = total raise amount (IDO token) * price = purchased amount (purchase token)
     * Investors need to pay purchase amount and participation fee
     *
     * If project is success (not be cancelled by admin or funded enough IDO token),
     *  - System's admin claims participation fee and token fee
     *  - Collaborator claims collaborator profit (purchased amount - token fee) based on vesting rule
     *  - Investors claim IDO token based on vesting rule
     *
     * If project is fail (cancelled or not be funded enough IDO token) (of course before TGE date)
     *  - System's admin claims participation fee
     *  - Investors claim purchased amount
     *  - Collaborator claims funded IDO token
     *
     * @dev Only has one pool address respectively for one input params
     * @param addrs Array of address includes:
     * - address of IDO token,
     * - address of purchase token
     * @param uints Array of pool information includes:
     * - max purchase amount for KYC user,
     * - max purchase amount for Not KYC user,
     * - token project fee percentage, // will be sent to admin if success or investor in vice versa
     * - galaxy participation fee percentage, // will be sent to admin
     * - crowdfunding participation fee percentage, // will be sent to admin
     * - galaxy pool proportion,
     * - early access proportion,
     * - total raise amount,
     * - whale open time,
     * - whale duration,
     * - community duration,
     * - rate of IDO token (based on README formula),
     * - decimal of IDO token (based on README formula, is different from decimals in contract of IDO token),
     * - TGE date,
     * - TGE percentage,
     * - vesting cliff,
     * - vesting frequency,
     * - number of vesting release
     * @param dbProjectId Project Id in database
     * @return pool Address of new pool
     */
    function createPool(
        address[2] memory addrs,
        uint[18] memory uints,
        uint dbProjectId
    ) external returns (address pool) {
        bytes32 salt = keccak256(
            abi.encode(addrs, uints, _msgSender(), dbProjectId)
        );

        pool = Clones.cloneDeterministic(poolImplementationAddress, salt);
        IPool(pool).initialize(addrs, uints, _msgSender());

        bytes32 poolInfoHash = keccak256(abi.encode(addrs, uints, dbProjectId));

        emit PoolCreated(poolInfoHash, pool);

        return pool;
    }

    function createVesting() external returns (address) {
        address vesting = Clones.clone(vestingImplementationAddress);
        emit VestingCreated(_msgSender(), vesting);
        return vesting;
    }

    /**
     * @dev Check whether or not an address is zero address
     * @param _address An address
     */
    function _validAddress(address _address) internal pure {
        require(_address != address(0), Errors.ZERO_ADDRESS_NOT_VALID);
    }

    /**
     * @dev Check whether or not an amount greater than 0
     * @param _amount An amount
     */
    function _validAmount(uint _amount) internal pure {
        require(_amount != 0, Errors.ZERO_AMOUNT_NOT_VALID);
    }
}
