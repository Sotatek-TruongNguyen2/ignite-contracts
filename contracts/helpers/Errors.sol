// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

library Errors {
    string public constant CALLER_NOT_ADMIN = "1"; // 'The caller of the function is not an admin'
    string public constant CALLER_NOT_OWNER = "2"; // 'The caller of the funtion is not an owner'
    string public constant ZERO_AMOUNT_NOT_VALID = "3"; // 'Amount must be greater than 0'
    string public constant ZERO_ADDRESS_NOT_VALID = "4"; // 'Zero address not valid'
    string public constant INVALID_TOKEN_FEE_PERCENTAGE = "5"; // 'Token fee must not be greater than 100%'
    string public constant INVALID_TGE_PERCENTAGE = "6"; // 'TGE must be smaller than or equal 100%'
    string public constant INVALID_GALAXY_POOL_PROPORTION = "7"; // 'Galaxy pool proportion must be greater than 0% and smaller than 100%'
    string public constant INVALID_EARLY_ACCESS_PROPORTION = "8"; // 'Early access proportion must be smaller than 100%'
    string public constant INVALID_TIME = "9"; // 'Open time must be smaller than close time, close time for whale must not be greater than open time for community and not be greater than TGE date'
    string public constant INVALID_SIGNER = "10"; // 'Signer does not have the right to approve'
    string public constant INVALID_CLAIMABLE_AMOUNT = "11"; // 'Claimable amount must be greater than 0'
    string public constant NOT_IN_WHALE_LIST = "12"; // 'Investor must be in whale list'
    string public constant NOT_IN_INVESTOR_LIST = "13"; // 'Investor must be in the list'
    string public constant NOT_ENOUGH_ALLOWANCE = "14"; // 'Investor need to approve or permit pool for their token before invest'
    string public constant NOT_FUNDED = "15"; // 'Collaborator need to fund enough IDO token'
    string public constant ALREADY_CLAIM_TOTAL_AMOUNT = "16"; // 'User already claim all of their token'
    string public constant TIME_OUT_TO_BUY_IDO_TOKEN = "17"; // 'Time out for investor to buy IDO token'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_USER = "18"; // 'Investor can not buy exceed allocated amount'
    string public constant EXCEED_TOTAL_RAISE_AMOUNT = "19"; // 'Investor can not buy exceed total IDO token raise amount'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_KYC_USER = "20"; // 'Investor who already kyced can not buy exceed allocated amount for KYCed user'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_NOT_KYC_USER = "21"; // 'Investor who not kyc can not buy exceed allocated amount for not KYC user'
    string public constant EXCEED_MAX_PURCHASE_AMOUNT_FOR_EARLY_ACCESS = "22"; // 'Investor can not buy exceed allocated amount for early access'
    string public constant NOT_ALLOWED_TO_CLAIM_IDO_TOKEN = "23"; // 'Need admin's allowance to claim IDO token'
    string public constant NOT_ALLOWED_TO_CLAIM_TOKEN_FEE = "24"; // 'Admin can claim only one single time'
    string public constant NOT_ALLOWED_TO_DO_AFTER_TGE_DATE = "25"; // 'User must execute before TGE Date'
    string public constant NOT_ALLOWED_TO_CLAIM_PARTICIPATION_FEE = "26"; // 'Admin can claim only one single time'
    string public constant NOT_ALLOWED_TO_WITHDRAW_PURCHASED_AMOUNT = "27"; // 'Investor can withdraw their purchased amount if project failed and only one single time'
    string public constant NOT_ALLOWED_TO_FUND_AFTER_TGE_DATE = "28"; // 'Collaborator must fund IDO token before TGE date'
    string public constant NOT_ALLOWED_TO_ALLOW_INVESTOR_TO_CLAIM = "29"; // 'Admin can set claimable status to true if project success'
    string public constant NOT_ALLOWED_TO_CLAIM_PURCHASE_TOKEN = "30"; // 'Collaborator can only claim fund (which exclude token fee) when project successes'
    string public constant NOT_ALLOWED_TO_TRANSFER_BEFORE_TGE_DATE = "31"; // 'User can only claim or withdraw after TGE date'
    string public constant NOT_ALLOWED_TO_TRANSFER_BEFORE_LOCKUP_TIME = "32"; // 'Admin can only claim token fee, participation fee; collaborator can only claim fund after lockup time'
    string public constant NOT_ALLOWED_TO_DO_AFTER_EMERGENCY_CANCELLED = "33"; // 'Collaborator can withdraw redundant IDO token only,claim fund; admin can only claim token fee, participation fee if project is not emergency cancelled'
    string public constant NOT_ALLOWED_TO_CANCEL_AFTER_LOCKUP_TIME = "34"; // 'Admin can only cancel pool before lockup time'
    string public constant NOT_ALLOWED_TO_EXCEED_TOTAL_RAISE_AMOUNT = "35"; // Total Purchased Amount can't exceeds total raise amount
    string public constant NOT_ALLOWED_TO_FUND_BEFORE_COMMUNITY_TIME = "36"; // Not allow to fund IDO token before Community Close Time
    string public constant GALAXY_PARTICIPATION_FEE_PERCENTAGE_NOT_IN_THE_RANGE = "37";
    string public constant CROWN_FUNDING_PARTICIPATION_FEE_PERCENTAGE_NOT_IN_THE_RANGE = "38";
    string public constant NOT_ALLOWED_TO_ADJUST_TGE_DATE_EXCEEDS_ATTEMPTS = "39";
    string public constant MAX_PURCHASE_FOR_KYC_USER_NOT_VALID = "40";
    string public constant POOL_IS_ALREADY_FUNDED = "41";
    string public constant NOT_ALLOWED_TO_ADJUST_TGE_DATE_TOO_FAR= "42";
}
