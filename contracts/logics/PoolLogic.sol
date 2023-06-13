// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

library PoolLogic {
    /// @dev Percentage denominator
    uint16 public constant PERCENTAGE_DENOMINATOR = 10000;

    enum PoolType {
        GALAXY_POOL,
        EARLY_ACCESS,
        NORMAL_ACCESS
    }

    /**
     * @dev Calculate fee when investor buy token
     * @param _purchaseAmount Purchase amount of investor
     * @param _participationFeePercentage Fee percentage when buying token
     * @return Return amount of fee when investor buy token
     */
    function _calculateParticipantFee(
        uint _purchaseAmount,
        uint _participationFeePercentage
    ) internal pure returns (uint) {
        if (_participationFeePercentage == 0) return 0;
        return
            (_purchaseAmount * _participationFeePercentage) /
            PERCENTAGE_DENOMINATOR;
    }

    /**
     * @dev Check whether or not length of a signature is valid
     * @param _signature Signature of investor
     */
    function _validSignature(bytes memory _signature) internal pure {
        require(_signature.length == 65, "Invalid signature length");
    }

    /**
     * @dev Split signature of investor to v,r,s
     * @param _signature Signature of investor
     * @return r r element of signature
     * @return s s element of signature
     * @return v v element of signature
     */
    function _splitSignature(
        bytes memory _signature
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        _validSignature(_signature);
        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }
    }
}
