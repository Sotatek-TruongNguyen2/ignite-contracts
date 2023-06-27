// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "forge-std/Test.sol";

abstract contract BaseTest is Test {
  struct Impersonation {
    address sender;
    address origin;
  }

  Impersonation[] private _pranks;

  function setUp() public virtual {
  }
}