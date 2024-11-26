
import React from 'react';
import * as Ethers from 'ethers';

const NFTMinter: React.FC = () => {
  const [walletAddress, setWalletAddress] = React.useState<string>('');
  const [recipientAddress, setRecipientAddress] = React.useState<string>('');
  const [baseURI, setBaseURI] = React.useState<string>('');
  const [currentBaseURI, setCurrentBaseURI] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  const contractAddress = '0x97bCE1CEBBc49535E6F2348E6E4f7a2CF99ec8B8';
  const chainId = 17000; // Ethereum mainnet

  const contractABI = [
    {"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"string","name":"baseURI","type":"string"}],"name":"setBaseURI","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"_baseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}
  ];

  React.useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new Ethers.providers.Web3Provider(window.ethereum);
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
        const provider = new Ethers.providers.Web3Provider(window.ethereum);
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

  const checkNetwork = async (provider: Ethers.providers.Web3Provider) => {
    const network = await provider.getNetwork();
    if (network.chainId !== chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: Ethers.utils.hexValue(chainId) }],
        });
      } catch (switchError) {
        setError('Please switch to the Ethereum mainnet in your wallet.');
      }
    }
  };

  const getContract = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new Ethers.providers.Web3Provider(window.ethereum);
      await checkNetwork(provider);
      const signer = provider.getSigner();
      return new Ethers.Contract(contractAddress, contractABI, signer);
    }
    throw new Error('Please install MetaMask!');
  };

  const mintNFT = async () => {
    if (!Ethers.utils.isAddress(recipientAddress)) {
      setError('Invalid recipient address.');
      return;
    }

    try {
      const contract = await getContract();
      setStatus('Minting...');
      const tx = await contract.mintNFT(recipientAddress);
      await tx.wait();
      setStatus('NFT minted successfully!');
    } catch (err: any) {
      handleError(err, 'Failed to mint NFT. Make sure you are the contract owner.');
    }
  };

  const setNewBaseURI = async () => {
    try {
      const contract = await getContract();
      setStatus('Setting new Base URI...');
      const tx = await contract.setBaseURI(baseURI);
      await tx.wait();
      setStatus('Base URI set successfully!');
    } catch (err: any) {
      handleError(err, 'Failed to set Base URI. Make sure you are the contract owner.');
    }
  };

  const fetchCurrentBaseURI = async () => {
    try {
      const contract = await getContract();
      const uri = await contract._baseURI();
      setCurrentBaseURI(uri);
      setStatus('Base URI fetched successfully!');
    } catch (err: any) {
      handleError(err, 'Failed to fetch current Base URI.');
    }
  };

  const handleError = (err: any, defaultMessage: string) => {
    if (err.code === 'ACTION_REJECTED') {
      setError('Transaction was rejected by the user.');
    } else if (err.message.includes("execution reverted")) {
      setError(defaultMessage);
    } else {
      setError(`${defaultMessage} Please try again.`);
    }
    setStatus('');
  };

  return (
    <div className="bg-gray-900 p-5 text-white min-h-screen">
      <div className="container mx-auto flex flex-col items-center">
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
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg w-full mb-4"
          >
            Set Base URI
          </button>

          <button
            onClick={fetchCurrentBaseURI}
            disabled={!walletAddress}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg w-full"
          >
            Fetch Current Base URI
          </button>
        </div>

        {status && (
          <p className="mt-4 text-green-500">{status}</p>
        )}

        {currentBaseURI && (
          <p className="mt-4 text-yellow-500">Current Base URI: {currentBaseURI}</p>
        )}

        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export { NFTMinter as component };
