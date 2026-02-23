// Complete Human-Readable ABI for The Continent v2.0 (USDT Fort Knox)
export const CONTRACT_ABI = [
    "function currentSeasonId() view returns (uint256)",
    "function getSoldCount() view returns (uint256)",
    "function getTotalPrizePool() view returns (uint256)",
    "function carryOverPot() view returns (uint256)",
    "function PARCEL_PRICE() view returns (uint256)",
    "function drawPhase() view returns (uint8)",
    "function userParcelCount(address) view returns (uint256)",
    "function totalReferrals(address) view returns (uint256)",
    "function pendingPrize(address) view returns (uint256)",
    "function getParcelOwner(uint256 x, uint256 y) view returns (address)",
    "function buyParcels(uint256[] xs, uint256[] ys, address referrer, uint32 color, bytes4 identifier)",
    "function claim()"
];

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

// The newly deployed Level God Contract Address (Verified via Remix)
export const CONTRACT_ADDRESS = "0x8b75907EF2Dac4a03dFa5A8a0538dd67c2b3479e";
