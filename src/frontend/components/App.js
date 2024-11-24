import {
  Link,
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { useState } from 'react'
import { ethers } from "ethers"
import MusicDistributionAbi from '../contractsData/MusicDistribution.json'
import MusicDistributionAddress from '../contractsData/MusicDistribution-address.json'
import { Spinner, Navbar, Nav, Button, Container } from 'react-bootstrap'
import Home from './Home.js'
import MySongs from './MySongs.js'
import MySales from './MySales.js'
import './App.css';

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState({})

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    loadContract(signer)
  }
  const loadContract = async (signer) => {
    const contract = new ethers.Contract(MusicDistributionAddress.address, MusicDistributionAbi.abi, signer)
    setContract(contract)
    setLoading(false)
  }
  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navbar expand="lg" bg="dark" variant="dark" className="custom-navbar shadow-sm">
            <Container>
              <Navbar.Brand as={Link} to="/">
                <span className="ms-2 brand-title">Dappify</span>
                <span className="ms-2 brand-title">Listen to songs and collect NFTs</span>
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/" className="nav-link-custom">Home</Nav.Link>
                  <Nav.Link as={Link} to="/my-songs" className="nav-link-custom">My Songs</Nav.Link>
                  <Nav.Link as={Link} to="/my-sales" className="nav-link-custom">My Sales</Nav.Link>
                </Nav>
                <Nav>
                  {account ? (
                    <Nav.Link
                      href={`https://etherscan.io/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button nav-button btn-sm mx-4"
                    >
                      <Button variant="outline-light" className="account-button">
                        {account.slice(0, 5) + '...' + account.slice(38, 42)}
                      </Button>
                    </Nav.Link>
                  ) : (
                    <Button onClick={web3Handler} variant="outline-primary" className="connect-button">
                      Connect Wallet
                    </Button>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </>
        <div>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center loading-screen">
              <Spinner animation="border" role="status" />
              <p className="loading-text ms-3">Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home contract={contract} />} />
              <Route path="/my-songs" element={<MySongs contract={contract} />} />
              <Route path="/my-sales" element={<MySales contract={contract} account={account} />} />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
