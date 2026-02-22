// Contract ABI — only the functions we need from frontend
export const CONTRACT_ABI = [
    // Read functions
    "function currentSeasonId() view returns (uint256)",
    "function currentSeasonSold() view returns (uint256)",
    "function carryOverPot() view returns (uint256)",
    "function drawPhase() view returns (uint8)",
    "function TOTAL_PARCELS() view returns (uint256)",
    "function PARCEL_PRICE() view returns (uint256)",
    "function GRID_SIZE() view returns (uint256)",
    "function getSoldCount() view returns (uint256)",
    "function getRemainingParcels() view returns (uint256)",
    "function getTotalPrizePool() view returns (uint256)",
    "function getParcelOwner(uint256 x, uint256 y) view returns (address)",
    "function getSeasonInfo(uint256 seasonId) view returns (tuple(uint256 id, uint256 totalSold, uint256 totalPrize, uint256 winningIndex, address winner, address godfather, bool completed))",
    "function pendingPrize(address) view returns (uint256)",
    "function getPendingPrize(address user) view returns (uint256)",
    "function referrers(address) view returns (address)",
    "function totalReferrals(address) view returns (uint256)",
    "function userParcelCount(address) view returns (uint256)",
    "function commitHash() view returns (bytes32)",

    // Write functions
    "function buyParcels(uint256[] xs, uint256[] ys, address referrer) payable",
    "function claim()",

    // Events
    "event ParcelPurchased(address indexed buyer, uint256 x, uint256 y, address indexed referrer, uint256 season)",
    "event DrawRevealed(uint256 indexed season, address indexed winner, uint256 winningIndex, uint256 totalPrize)",
    "event PrizeClaimed(address indexed recipient, uint256 amount)",
    "event EarthquakeTriggered(uint256 season, uint256 threshold)",
    "event SeasonReset(uint256 newSeasonId, uint256 carryOver)",
] as const;

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

// Set to testnet for now — change to mainnet for production
export const ACTIVE_CHAIN = BSC_TESTNET;

// Contract address — set after deployment
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
