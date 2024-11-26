
import React, { useState } from 'react';
import { ethers } from 'ethers';

const NFTMinter: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [mintingStatus, setMintingStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const contractAddress = '0x97bCE1CEBBc49535E6F2348E6E4f7a2CF99ec8B8';
  const chainId = 17000;

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
    }
  ];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        const network = await provider.getNetwork();
        if (network.chainId !== chainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ethers.utils.hexValue(chainId) }],
            });
          } catch (switchError) {
            setError('Please switch to the Holesky testnet in your wallet.');
          }
        }
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet.');
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
        await tx.wait();
        setMintingStatus('NFT minted successfully!');
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to mint NFT. Make sure you are the contract owner.');
      setMintingStatus('');
    }
  };

  return (
    <div className="bg-black py-16 text-white w-full min-h-screen">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8">NFT Minter</h1>
        
        {!walletAddress && (
          <button
            onClick={connectWallet}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4"
          >
            Connect Wallet
          </button>
        )}

        {walletAddress && (
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
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full"
          >
            Mint NFT
          </button>
        </div>

        {mintingStatus && (
          <p className="mt-4 text-green-500">{mintingStatus}</p>
        )}

        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export { NFTMinter as component };
