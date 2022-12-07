// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/MerkleProof.sol";

contract IgnitionList {
    bytes32 public root;

    function _verifyUser(
        address _candidate,
        bytes32 _poolType,
        uint _maxPurchaseWhetherOrNotKYCAmount,
        uint _maxPurchaseBaseOnAllocations,
        bytes32[] memory proof
    ) internal view returns (bool) {
        // leaf = {address + hash("Pool type") + max purchase KYC/notKYC amount + max purchase for each user}
        bytes32 leaf = keccak256(abi.encodePacked(_candidate, _poolType, _maxPurchaseWhetherOrNotKYCAmount, _maxPurchaseBaseOnAllocations));
        return MerkleProof.verify(proof, root, leaf);
    }
}