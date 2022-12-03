import React, { Component } from 'react';
import './App.css';
import NavBar from './NavBar';
import Web3 from 'web3';
import EthSwap from '../abis/EthSwap.json'
import Token from '../abis/Token.json'
import Main from './Main';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      account: '',
      ethBalance: '',
      tokenBalace: '',
      token: {},
      ethSwap: {},
      loading: true,
    }
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    console.log(`current account adress: ${this.state.account}`)
    const ethBalance = await web3.eth.getBalance(this.state.account)
    this.setState({ethBalance})
    console.log(`eth balance: ${this.state.ethBalance}`)


    const networkId = await web3.eth.net.getId()
    let networkData = Token.networks[networkId]
    if (networkData) {
      const address = Token.networks[networkId].address
      const token = web3.eth.Contract(Token.abi, address)
      this.setState({token})
      const tokenBalance = await token.methods.balanceOf(this.state.account).call()
      this.setState({tokenBalance: tokenBalance.toString()})
      console.log(`token balance: ${this.state.tokenBalance}`)
    } else {
      window.alert('Token not deployed to detected network')
    }
    
    networkData = EthSwap.networks[networkId]
    if (networkData) {
      const address = EthSwap.networks[networkId].address
      const ethSwap = web3.eth.Contract(EthSwap.abi, address)
      this.setState({ethSwap})
      const ethSwapBalance = await this.state.token.methods.balanceOf(address).call()
      console.log(`ethSwap token balance: ${ethSwapBalance}`)
    } else {
      window.alert('EthSwap not deployed to detected network')
    }

    this.setState({loading: false})
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Install Metamask !!')
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({loading: true})
    this.state.ethSwap.methods.buyTokens().send({from: this.state.account, value: etherAmount})
    .on('transactionHash', (hash) => {
      this.setState({loading: false})
    })
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true })
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.state.ethSwap.methods.sellTokens(tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  render() {
    let content
    if (this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main
      ethBalance={this.state.ethBalance}
      tokenBalance={this.state.tokenBalance}
      buyTokens={this.buyTokens}
      sellTokens={this.sellTokens}
    />
    }
    return (
      <div>
        <NavBar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
