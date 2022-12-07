// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract ERC20Token is ERC20Permit{
    uint8 _decimals = 18;
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20Permit(name) ERC20(name, symbol){
        ERC20._mint(msg.sender, 10**9*10**18);
        setDecimals(decimals_);
    }

    function mint(address _to, uint _amount) public {
        ERC20._mint(_to, _amount);
    }

    function decimals() public view override returns(uint8){
        return _decimals;
    }

    function setDecimals(uint8 decimals_) public {
        _decimals = decimals_;
    } 
}