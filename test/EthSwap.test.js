const { assert } = require('chai');

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require('chai').use(require('chai-as-promised')).should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether')
}

contract('EthSwap', ([deployer, investor]) => {
    let ethSwap,token,result

    before(async () => {
        token = await Token.new();
        ethSwap = await EthSwap.new(token.address);
        await token.transfer(ethSwap.address, tokens('1000000'));
    });
    describe('EthSwap deployment', async () => {
        it('should have a name', async () => {
            const name = await ethSwap.name();
            assert.equal(name, 'EthSwap Instant Exchange');
        });
        it('should have tokens', async () => {
            const balance = await token.balanceOf(ethSwap.address);
            assert.equal(balance.toString(), tokens('1000000'));
        });
    })
    describe('Buy Token', async () => {
        before(async () => {
            result = await ethSwap.buyTokens({from: investor, value: tokens('2')})
        })
        it('should allow user to buy token with fixed price', async () => {
            const investorTokenBalance = await token.balanceOf(investor)
            assert.equal(investorTokenBalance.toString(), tokens('2000'))
            const ethSwapTokenBalance = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapTokenBalance.toString(), tokens('998000'))
            const ethSwapEthBalance = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapEthBalance.toString(), tokens('2'))

            const event = result.logs[0].args;
            assert.equal(event.buyer,investor)
            assert.equal(event.token,token.address)
            assert.equal(event.amount.toString(), tokens('2000'))
            assert.equal(event.rate.toString(), '1000')
        })
    })
    describe('Sell Token', async () => {
        before(async () => {
            await token.approve(ethSwap.address,tokens('1000'),{from: investor})
            result = await ethSwap.sellTokens(tokens('1000'),{from: investor})
        })
        it('should allow user to sell token with fixed price', async () => {
            const investorTokenBalance = await token.balanceOf(investor)
            assert.equal(investorTokenBalance.toString(), tokens('1000'))
            const ethSwapTokenBalance = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapTokenBalance.toString(), tokens('999000'))
            const ethSwapEthBalance = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapEthBalance.toString(), tokens('1'))

            const event = result.logs[0].args;
            assert.equal(event.seller,investor)
            assert.equal(event.token,token.address)
            assert.equal(event.amount.toString(), tokens('1000'))
            assert.equal(event.rate.toString(), '1000')

            await ethSwap.sellTokens(tokens('5000'),{from:investor}).should.be.rejected
        })
    })
});

contract('Token', (accounts) => {
    let token;

    before(async () => {
        token = await Token.new();
    });

    describe('EthSwap deployment', async () => {
        it('should have a name', async () => {
            const name = await token.name();
            assert.equal(name, 'ShikamaruBH Token');
        });
        it('should have a symbol', async () => {
            const name = await token.symbol();
            assert.equal(name, 'SBH');
        });
    });
});