// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Errors} from "../helpers/Errors.sol";

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
        require(_signature.length == 65, Errors.INVALID_SIGNATURE_LENGTH);
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

    /**
     * @dev Check whether or not an amount greater than 0
     * @param _amount An amount
     */
    function _validAmount(uint _amount) internal pure {
        require(_amount > 0, Errors.ZERO_AMOUNT_NOT_VALID);
    }

    /**
     * @dev Check whether or not an address is zero address
     * @param _address An address
     */
    function _validAddress(address _address) internal pure {
        require(_address != address(0), Errors.ZERO_ADDRESS_NOT_VALID);
    }

    /**
     * @dev verify information of pool: galaxy pool proportion must be greater than 0% and smaller than 100%,
     * early access must be smaller than 100%, total raise must be greater than 0
     * @param addrs Array of address includes: address of IDO token, address of purchase token
     * @param uints Array of pool information includes: max purchase amount for KYC user, max purchase amount for Not KYC user, TGE date, TGE percentage,
     * galaxy participation fee percentage, crowdfunding participation fee percentage, galaxy pool proportion, early access proportion,
     * total raise amount, whale open time, whale duration, community duration, rate and decimal of IDO token
     */
    function _verifyPoolInfo(
        address[2] memory addrs,
        uint[18] memory uints
    ) internal pure {
        _validAddress(addrs[1]); // purchaseToken

        // creationFeePercentage
        require(
            uints[2] <= PERCENTAGE_DENOMINATOR,
            Errors.INVALID_CREATION_FEE_PERCENTAGE
        );

        // galaxyPoolProportion
        _validAmount(uints[5]);
        require(
            uints[5] < PERCENTAGE_DENOMINATOR,
            Errors.INVALID_GALAXY_POOL_PROPORTION
        );

        // earlyAccessProportion
        require(
            uints[6] < PERCENTAGE_DENOMINATOR,
            Errors.INVALID_EARLY_ACCESS_PROPORTION
        );

        // totalRaiseAmount
        _validAmount(uints[7]);
    }
}
