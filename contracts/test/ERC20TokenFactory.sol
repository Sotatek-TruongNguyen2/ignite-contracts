// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "./ERC20Token.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract ERC20TokenFactory {

    address public codeAddress;

    address public currentToken;

    constructor(address _codeAddress) {
        codeAddress = _codeAddress;
    }

    function createToken(string memory name, string memory symbol, uint8 decimal_) public returns(address) {

        currentToken = Clones.clone(codeAddress);

        ERC20Token token = ERC20Token(currentToken);
        token.initialize(name, symbol, decimal_);

        return currentToken;
    }

}