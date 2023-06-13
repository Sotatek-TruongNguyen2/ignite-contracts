// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

library Errors {
    string public constant CALLER_NOT_ADMIN = "1"; // 'The caller of the function is not an admin'
    string public constant ZERO_AMOUNT_NOT_VALID = "2"; // 'Amount must be greater than 0'
    string public constant ZERO_ADDRESS_NOT_VALID = "3"; // 'Zero address not valid'
    string public constant INVALID_CREATION_FEE_PERCENTAGE = "4"; // 'Creation fee must not be greater than 100%'
    string public constant INVALID_TGE_PERCENTAGE = "5"; // 'TGE must be smaller than or equal 100%'
    string public constant INVALID_GALAXY_POOL_PROPORTION = "6"; // 'Galaxy pool proportion must be greater than 0% and smaller than 100%'
    string public constant INVALID_EARLY_ACCESS_PROPORTION = "7"; // 'Early access proportion must be smaller than 100%'
    string public constant NOT_IN_WHALE_LIST = "8"; // 'Investor must be in whale list'
    string public constant NOT_ALLOWED_TO_REDEEM_IDO_TOKEN = "9"; // 'Need admin's allowance to redeem IDO token'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_USER = "10"; // 'Investor can not buy exceed allocated amount'
    string public constant ALREADY_SET_IDO_TOKEN_REDEEMABLE_STATUS = "11"; // 'Admin already set this value for IDO token redeemable status'
    string public constant EXCEED_TOTAL_RAISE_AMOUNT = "12"; // 'Investor can not buy exceed total IDO token raise amount'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_KYC_USER = "13"; // 'Investor who already kyced can not buy exceed allocated amount for KYCed user'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_NOT_KYC_USER = "14"; // 'Investor who not kyc can not buy exceed allocated amount for not KYC user'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_EARLY_ACCESS = "15"; // 'Investor can not buy exceed allocated amount for early access'
    string public constant NOT_ENOUGH_ALLOWANCE = "16"; // 'Investor need to approve or permit pool for their token before invest'
    string public constant INVALID_TIME = "17"; // 'Open time must be smaller than close time and close time for whale must not be greater than open time for community'
    string public constant TIME_OUT_TO_BUY_IDO_TOKEN = "18"; // 'Time out for investor to buy IDO token'
    string public constant CALLER_NOT_OWNER = "19"; // 'The caller of the funtion is not an owner'
}
