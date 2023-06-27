// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "forge-std/Test.sol";
import "../../contracts/core/IgnitionFactory.sol";
import "../../contracts/core/Pool.sol";
import "../../contracts/core/Vesting.sol";

contract IgnitionFactoryTest is Test {
    IgnitionFactory public factory;
    Pool public poolImpl;
    Vesting public vestingImpl;

    function setUp() public {
        factory = new IgnitionFactory();
        poolImpl = new Pool();
        vestingImpl = new Vesting();
        factory.initialize(address(poolImpl), address(vestingImpl));
    }

    function testSetPoolImplByAdmin() public {
        Pool newPoolImpl = new Pool();
        factory.setPoolImplementation(address(newPoolImpl));
    }
}
