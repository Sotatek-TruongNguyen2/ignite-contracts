// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract PoolFactory {
    address public masterAdmin;
    address private newMasterAdmin;

    constructor(address _masterAdmin) {
        masterAdmin = _masterAdmin;
    }

    function registerPool(
        address _masterAdmin,
        address _purchaseToken,
        uint _participationFee,
        uint _totalRaiseAmount,
        uint _whaleProportion
    ) public {}

    function grantMasterAdminRole(address _newMasterAdmin) public {
        newMasterAdmin = _newMasterAdmin;
    }

    function acceptMasterAdminRole() public {
        masterAdmin = msg.sender;
        newMasterAdmin = address(0);
    }

    
}
