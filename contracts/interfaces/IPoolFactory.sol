// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

interface IPoolFactory{
    function hasAdminRole(address _admin) external view returns(bool);
}
