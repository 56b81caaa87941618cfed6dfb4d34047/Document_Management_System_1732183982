
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const NFTMinter: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [baseURI, setBaseURI] = useState<string>('');
  const [mintingStatus, setMintingStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');

  const contractAddress = '0x97bCE1CEBBc49535E6F2348E6E4f7a2CF99ec8B8';
  const chainId = 1; // Ethereum mainnet

  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "mintNFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "baseURI",
          "type": "string"
        }
      ],
      "name": "setBaseURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await checkNetwork(provider);
      }
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        await checkNetwork(provider);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet.');
    }
  };

  const checkNetwork = async (provider: ethers.providers.Web3Provider) => {
    const network = await provider.getNetwork();
    if (network.chainId !== chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(chainId) }],
        });
      } catch (switchError) {
        setError('Please switch to the Ethereum mainnet in your wallet.');
      }
    }
  };

  const mintNFT = async () => {
    if (!ethers.utils.isAddress(recipientAddress)) {
      setError('Invalid recipient address.');
      return;
    }

    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        setMintingStatus('Minting...');
        const tx = await contract.mintNFT(recipientAddress);
        const receipt = await tx.wait();
        const event = receipt.events?.find(e => e.event === 'NFTMinted');
        if (event && event.args) {
          setTokenId(event.args.tokenId.toString());
        }
        setMintingStatus('NFT minted successfully!');
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err: any) {
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by the user.');
      } else if (err.message.includes("execution reverted")) {
        setError('Minting failed. Make sure you are the contract owner.');
      } else {
        setError('Failed to mint NFT. Please try again.');
      }
      setMintingStatus('');
    }
  };

  const setNewBaseURI = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const tx = await contract.setBaseURI(baseURI);
        await tx.wait();
        setMintingStatus('Base URI set successfully!');
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err: any) {
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by the user.');
      } else if (err.message.includes("execution reverted")) {
        setError('Failed to set Base URI. Make sure you are the contract owner.');
      } else {
        setError('Failed to set Base URI. Please try again.');
      }
    }
  };

  return (
    <div className="bg-gray-900 py-16 text-white w-full min-h-screen">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8">NFT Minter on Ethereum</h1>
        
        {!walletAddress ? (
          <button
            onClick={connectWallet}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="mb-4">
            <p>Connected Address: {walletAddress}</p>
          </div>
        )}

        <div className="w-full max-w-xs">
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
          />
          <button
            onClick={mintNFT}
            disabled={!walletAddress}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full mb-4"
          >
            Mint NFT
          </button>

          <input
            type="text"
            placeholder="New Base URI"
            value={baseURI}
            onChange={(e) => setBaseURI(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
          />
          <button
            onClick={setNewBaseURI}
            disabled={!walletAddress}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg w-full"
          >
            Set Base URI
          </button>
        </div>

        {mintingStatus && (
          <p className="mt-4 text-green-500">{mintingStatus}</p>
        )}

        {tokenId && (
          <p className="mt-4 text-yellow-500">Minted Token ID: {tokenId}</p>
        )}

        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export { NFTMinter as component };
