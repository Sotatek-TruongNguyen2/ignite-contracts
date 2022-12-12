// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

interface IPool{
    function initialize(address[2] memory addresses, uint[13] memory numbers) external;
}