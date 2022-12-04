// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract ERC20Token is ERC20Permit{
    constructor(string memory name, string memory symbol) ERC20Permit(name) ERC20(name, symbol){
        ERC20._mint(msg.sender, 10**9*10**18);
    }

    function mint(address _to, uint _amount) public {
        ERC20._mint(_to, _amount);
    }
}