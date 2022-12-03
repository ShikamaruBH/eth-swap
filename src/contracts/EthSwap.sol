pragma solidity ^0.5.0;

import './Token.sol';

contract EthSwap {
  string public name = "EthSwap Instant Exchange";
  Token public token;
  uint public rate = 1000;

  event TokensPurchased(
    address buyer,
    address token,
    uint amount,
    uint rate
  );

  event TokensSold(
    address seller,
    address token,
    uint amount,
    uint rate
  );

  constructor(Token _token) public {
    token = _token;
  }

  function buyTokens() public payable {
    uint amount = msg.value * rate;
    require(token.balanceOf(address(this)) >= amount, 'Insufficient token balance');
    token.transfer(msg.sender, amount);
    emit TokensPurchased(msg.sender, address(token), amount, rate);
  }

  function sellTokens(uint _amount) public {
    require(token.balanceOf(msg.sender) >= _amount, 'Token balance not enough');
    uint amount = _amount / rate;
    require(address(this).balance >= amount, 'Insuffience eth balance');
    token.transferFrom(msg.sender, address(this), _amount);
    msg.sender.transfer(amount);
    emit TokensSold(msg.sender, address(token), _amount, rate);
  }
}
