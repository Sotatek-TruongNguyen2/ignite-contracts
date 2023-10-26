// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import {Errors} from "../helpers/Errors.sol";

contract BasePausable is
    AccessControlUpgradeable,
    PausableUpgradeable,
    // Initializable,
    ReentrancyGuardUpgradeable
{
    /// @notice keccak256("OWNER_ROLE")
    bytes32 public constant OWNER_ROLE =
        0xb19546dff01e856fb3f010c267a7b1c60363cf8a4664e21cc89c26224620214e;

    modifier onlyOwner() {
        require(isOwner(_msgSender()), Errors.CALLER_NOT_OWNER);
        _;
    }

    function __BasePausable__init(address owner) public onlyInitializing {
        require(owner != address(0), Errors.ZERO_ADDRESS_NOT_VALID);

        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();


        _setupRole(OWNER_ROLE, owner);
        _setRoleAdmin(OWNER_ROLE, OWNER_ROLE);
    }

    function isOwner(address sender) public view returns (bool) {
        return hasRole(OWNER_ROLE, sender);
    }
}
