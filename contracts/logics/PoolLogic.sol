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
     * @dev verify information of pool
     * @param addrs Array of address includes:
     * - address of IDO token,
     * - address of purchase token
     * @param uints Array of pool information includes:
     * - max purchase amount for KYC user,
     * - max purchase amount for Not KYC user,
     * - token fee percentage,
     * - galaxy participation fee percentage,
     * - crowdfunding participation fee percentage,
     * - galaxy pool proportion,
     * - early access proportion,
     * - total raise amount,
     * - whale open time,
     * - whale duration,
     * - community duration,
     * - rate of IDO token (based on README formula),
     * - decimal of IDO token (based on README formula, is different from decimals in contract of IDO token),
     * - TGE date,
     * - TGE percentage,
     * - vesting cliff,
     * - vesting frequency,
     * - number of vesting release
     */
    function _verifyPoolInfo(
        address[2] memory addrs,
        uint[18] memory uints
    ) internal pure {
        _validAddress(addrs[1]); // purchaseToken

        // tokenFeePercentage
        require(
            uints[2] <= PERCENTAGE_DENOMINATOR,
            Errors.INVALID_TOKEN_FEE_PERCENTAGE
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
