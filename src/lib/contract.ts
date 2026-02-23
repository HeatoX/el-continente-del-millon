import abiJson from './abi.json';

// Export the complete ABI from JSON
export const CONTRACT_ABI = abiJson;

// BSC Testnet for development
export const BSC_TESTNET = {
    chainId: 97,
    chainIdHex: "0x61",
    name: "BSC Testnet",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    explorer: "https://testnet.bscscan.com",
};

// BSC Mainnet for production
export const BSC_MAINNET = {
    chainId: 56,
    chainIdHex: "0x38",
    name: "BNB Smart Chain",
    rpc: "https://bsc-dataseed1.binance.org/",
    explorer: "https://bscscan.com",
};

// Set to mainnet since we deployed to mainnet
export const ACTIVE_CHAIN = BSC_MAINNET;

// The newly deployed Level God Contract Address
export const CONTRACT_ADDRESS = "0xC24cc2bD219bACF4E3B35ba4b03dBE9453668D08";
