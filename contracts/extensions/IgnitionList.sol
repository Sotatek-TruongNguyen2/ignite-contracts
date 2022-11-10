// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/MerkleProof.sol";

contract IgnitionList {
    bytes32 public root;

    function _verifyUser(
        address _candidate,
        uint _maxPurchaseAmount,
        bytes32[] memory proof
    ) internal view returns (bool) {
        // leaf = {address + max purchase amount}

        bytes32 leaf = keccak256(
            abi.encodePacked(_candidate, _maxPurchaseAmount)
        );
        return MerkleProof.verify(proof, root, leaf);
    }
}