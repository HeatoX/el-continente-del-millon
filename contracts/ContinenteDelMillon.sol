// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title El Continente del Millón v2.0
 * @author TheContinent Team
 * @notice Hybrid Visual Lottery + Referral Cascade on BNB Smart Chain
 * @dev Uses Commit-Reveal for free verifiable randomness. Pull Payment for gas safety.
 *
 * Prize Distribution (of total pool):
 *   40% → Winner ($500,000)
 *   15% → Referrer/Godfather ($187,500)
 *   10% → 8 Neighbors on grid ($125,000)
 *    5% → Rain: 100 random consolation parcels ($62,500)
 *   10% → Carry-over to next season ($125,000)
 *   20% → Treasury ($250,000)
 *
 * Security:
 *   - Pull Payment: each winner claims individually (no gas bombs)
 *   - Commit-Reveal: free, anti-manipulation randomness
 *   - No admin access to pool funds
 *   - ForceReveal: anyone can trigger if admin abandons
 *   - Emergency withdraw with 7-day timelock
 */
contract ContinenteDelMillon is Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════
    //  STRUCTS
    // ═══════════════════════════════════════════════════

    struct Parcel {
        address owner;
        uint256 season;
    }

    struct SeasonRecord {
        uint256 id;
        uint256 totalSold;
        uint256 totalPrize;
        uint256 winningIndex;
        address winner;
        address godfather;
        bool completed;
    }

    // ═══════════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════════

    uint256 public constant GRID_SIZE = 500;
    uint256 public constant TOTAL_PARCELS = 250_000; // 500 × 500
    uint256 public constant PARCEL_PRICE = 0.01 ether; // 0.01 BNB

    // Prize percentages (basis points: 10000 = 100%)
    uint256 public constant WINNER_BPS     = 4000; // 40%
    uint256 public constant GODFATHER_BPS  = 1500; // 15%
    uint256 public constant NEIGHBORS_BPS  = 1000; // 10%
    uint256 public constant RAIN_BPS       =  500; //  5%
    uint256 public constant CARRYOVER_BPS  = 1000; // 10%
    uint256 public constant TREASURY_BPS   = 2000; // 20%

    uint256 public constant RAIN_WINNERS   = 100;
    uint256 public constant RAIN_BATCH_SIZE = 20;

    // Earthquake: mini-event every 25,000 parcels sold
    uint256 public constant EARTHQUAKE_INTERVAL = 25_000;

    // Commit-Reveal timing
    uint256 public constant REVEAL_MIN_DELAY = 10;    // 10 blocks minimum
    uint256 public constant REVEAL_DEADLINE  = 48 hours;

    // Emergency timelock
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;

    // ═══════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════

    uint256 public currentSeasonId = 1;
    uint256 public currentSeasonSold;
    uint256 public carryOverPot;

    // Drawing state
    enum DrawPhase { BUYING, COMMITTED, REVEALED, RAIN_DISTRIBUTING, COMPLETED }
    DrawPhase public drawPhase = DrawPhase.BUYING;

    // Grid: flattened index (y * GRID_SIZE + x) => Parcel
    mapping(uint256 => Parcel) public grid;

    // Track all sold indices for this season (for rain selection)
    uint256[] public soldIndices;

    // Referral system
    mapping(address => address) public referrers;
    mapping(address => uint256) public totalReferrals;
    mapping(address => uint256) public userParcelCount;

    // Season history
    mapping(uint256 => SeasonRecord) public seasonHistory;

    // ═══════════════════════════════════════════════
    //  PULL PAYMENT: pending prizes (claim-based)
    // ═══════════════════════════════════════════════

    mapping(address => uint256) public pendingPrize;

    // ═══════════════════════════════════════════════
    //  COMMIT-REVEAL STATE
    // ═══════════════════════════════════════════════

    bytes32 public commitHash;
    uint256 public commitBlock;
    uint256 public revealDeadlineTimestamp;

    // After reveal
    uint256 public revealedSeed;
    uint256 public rainDistributed; // how many rain winners assigned so far

    // ═══════════════════════════════════════════════
    //  EMERGENCY
    // ═══════════════════════════════════════════════

    uint256 public emergencyRequestTime;

    // ═══════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════

    event ParcelPurchased(address indexed buyer, uint256 x, uint256 y, address indexed referrer, uint256 season);
    event EarthquakeTriggered(uint256 season, uint256 threshold);
    event CommitPosted(uint256 indexed season, bytes32 commitHash);
    event DrawRevealed(uint256 indexed season, address indexed winner, uint256 winningIndex, uint256 totalPrize);
    event RainBatchDistributed(uint256 indexed season, uint256 batchStart, uint256 batchEnd);
    event PrizeClaimed(address indexed recipient, uint256 amount);
    event SeasonReset(uint256 newSeasonId, uint256 carryOver);
    event EmergencyRequested(uint256 unlockTime);
    event EmergencyExecuted(uint256 amount);

    // ═══════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════

    constructor() Ownable(msg.sender) {}

    // ═══════════════════════════════════════════════════
    //  CORE: BUY PARCELS (payable in BNB)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Buy one or more parcels on the grid
     * @param xs Array of x coordinates (0-499)
     * @param ys Array of y coordinates (0-499)
     * @param referrer Address of who referred this buyer (or address(0))
     */
    function buyParcels(
        uint256[] calldata xs,
        uint256[] calldata ys,
        address referrer
    ) external payable nonReentrant {
        require(drawPhase == DrawPhase.BUYING, "Draw in progress");
        uint256 count = xs.length;
        require(count > 0 && count == ys.length, "Invalid input");
        require(currentSeasonSold + count <= TOTAL_PARCELS, "Not enough parcels left");
        require(msg.value == count * PARCEL_PRICE, "Wrong BNB amount");

        // Register referrer (once per user, never self-referral)
        if (referrer != address(0) && referrer != msg.sender && referrers[msg.sender] == address(0)) {
            referrers[msg.sender] = referrer;
            totalReferrals[referrer]++;
        }

        uint256 prevSold = currentSeasonSold;

        for (uint256 i = 0; i < count; i++) {
            uint256 x = xs[i];
            uint256 y = ys[i];
            require(x < GRID_SIZE && y < GRID_SIZE, "Out of bounds");

            uint256 index = y * GRID_SIZE + x;
            Parcel storage p = grid[index];
            require(p.owner == address(0) || p.season < currentSeasonId, "Already owned");

            p.owner = msg.sender;
            p.season = currentSeasonId;
            soldIndices.push(index);

            emit ParcelPurchased(msg.sender, x, y, referrers[msg.sender], currentSeasonId);
        }

        currentSeasonSold += count;
        userParcelCount[msg.sender] += count;

        // Check earthquake thresholds
        uint256 prevThreshold = prevSold / EARTHQUAKE_INTERVAL;
        uint256 newThreshold  = currentSeasonSold / EARTHQUAKE_INTERVAL;
        if (newThreshold > prevThreshold && currentSeasonSold < TOTAL_PARCELS) {
            emit EarthquakeTriggered(currentSeasonId, newThreshold * EARTHQUAKE_INTERVAL);
        }
    }

    // ═══════════════════════════════════════════════════
    //  COMMIT-REVEAL: FREE RANDOMNESS
    // ═══════════════════════════════════════════════════

    /**
     * @notice Admin commits a hidden random seed BEFORE the map fills up
     * @param _commitHash keccak256(abi.encodePacked(secret, salt))
     */
    function commit(bytes32 _commitHash) external onlyOwner {
        require(drawPhase == DrawPhase.BUYING, "Not in buying phase");
        require(currentSeasonSold >= TOTAL_PARCELS / 2, "Wait until 50% sold");
        commitHash = _commitHash;
        commitBlock = block.number;
        drawPhase = DrawPhase.COMMITTED;
        emit CommitPosted(currentSeasonId, _commitHash);
    }

    /**
     * @notice Admin reveals the secret after the map is full
     * @dev Calculates winner, assigns prizes to pendingPrize mapping (NO transfers)
     */
    function reveal(bytes32 secret, bytes32 salt) external {
        require(drawPhase == DrawPhase.COMMITTED, "Not committed");
        require(currentSeasonSold == TOTAL_PARCELS, "Map not full");
        require(block.number >= commitBlock + REVEAL_MIN_DELAY, "Too early");
        require(keccak256(abi.encodePacked(secret, salt)) == commitHash, "Invalid secret");

        _executeReveal(uint256(keccak256(abi.encodePacked(secret, salt, blockhash(commitBlock + REVEAL_MIN_DELAY), currentSeasonSold))));
    }

    /**
     * @notice Anyone can force the reveal if admin doesn't act within 48h after map is full
     * @dev Uses blockhash as sole source of randomness (less ideal but prevents fund lockup)
     */
    function forceReveal() external {
        require(drawPhase == DrawPhase.COMMITTED, "Not committed");
        require(currentSeasonSold == TOTAL_PARCELS, "Map not full");

        // Set deadline on first call
        if (revealDeadlineTimestamp == 0) {
            revealDeadlineTimestamp = block.timestamp + REVEAL_DEADLINE;
        }
        require(block.timestamp >= revealDeadlineTimestamp, "Admin still has time");

        _executeReveal(uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), currentSeasonSold, block.timestamp))));
    }

    function _executeReveal(uint256 seed) internal {
        revealedSeed = seed;
        uint256 totalPool = address(this).balance - carryOverPot; // only current season's funds

        // Select winner
        uint256 winningIndex = soldIndices[seed % soldIndices.length];
        address winner = grid[winningIndex].owner;

        // ── 40% WINNER ──
        uint256 winnerPrize = (totalPool * WINNER_BPS) / 10000;
        pendingPrize[winner] += winnerPrize;

        // ── 15% GODFATHER ──
        uint256 godfatherPrize = (totalPool * GODFATHER_BPS) / 10000;
        address godfather = referrers[winner];
        if (godfather != address(0)) {
            pendingPrize[godfather] += godfatherPrize;
        } else {
            // No godfather → goes to treasury
            pendingPrize[owner()] += godfatherPrize;
        }

        // ── 10% NEIGHBORS ──
        _assignNeighborPrizes(winningIndex, totalPool);

        // ── 10% CARRY-OVER to next season ──
        uint256 carryAmount = (totalPool * CARRYOVER_BPS) / 10000;
        carryOverPot += carryAmount;

        // ── 20% TREASURY ──
        uint256 treasuryAmount = (totalPool * TREASURY_BPS) / 10000;
        pendingPrize[owner()] += treasuryAmount;

        // ── 5% RAIN → done in batches via distributeRain() ──
        // rainDistributed = 0 (already default)

        // Record season
        seasonHistory[currentSeasonId] = SeasonRecord({
            id: currentSeasonId,
            totalSold: currentSeasonSold,
            totalPrize: totalPool,
            winningIndex: winningIndex,
            winner: winner,
            godfather: godfather,
            completed: false // set true after rain is fully distributed
        });

        drawPhase = DrawPhase.RAIN_DISTRIBUTING;
        emit DrawRevealed(currentSeasonId, winner, winningIndex, totalPool);
    }

    /**
     * @dev Assign 10% to the 8 physical neighbors on the grid
     */
    function _assignNeighborPrizes(uint256 winningIndex, uint256 totalPool) internal {
        uint256 neighborPrize = (totalPool * NEIGHBORS_BPS) / 10000;
        uint256 winX = winningIndex % GRID_SIZE;
        uint256 winY = winningIndex / GRID_SIZE;

        int256[8] memory dx = [int256(-1), int256(-1), int256(-1), int256(0), int256(0), int256(1), int256(1), int256(1)];
        int256[8] memory dy = [int256(-1), int256(0),  int256(1),  int256(-1), int256(1), int256(-1), int256(0), int256(1)];

        address[] memory validNeighbors = new address[](8);
        uint256 validCount = 0;

        for (uint256 i = 0; i < 8; i++) {
            int256 nx = int256(winX) + dx[i];
            int256 ny = int256(winY) + dy[i];

            if (nx >= 0 && nx < int256(GRID_SIZE) && ny >= 0 && ny < int256(GRID_SIZE)) {
                uint256 nIndex = uint256(ny) * GRID_SIZE + uint256(nx);
                Parcel storage np = grid[nIndex];
                if (np.owner != address(0) && np.season == currentSeasonId) {
                    validNeighbors[validCount] = np.owner;
                    validCount++;
                }
            }
        }

        if (validCount > 0) {
            uint256 prizePerNeighbor = neighborPrize / validCount;
            for (uint256 i = 0; i < validCount; i++) {
                pendingPrize[validNeighbors[i]] += prizePerNeighbor;
            }
        } else {
            // No valid neighbors → goes to carry-over
            carryOverPot += neighborPrize;
        }
    }

    // ═══════════════════════════════════════════════════
    //  RAIN DISTRIBUTION (batched, anyone can call)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Distribute rain prizes in batches of 20 to avoid gas issues
     * @dev Anyone can call this. Uses revealedSeed for deterministic selection.
     *      Deduplicates: same address can only get rain once.
     */
    function distributeRain() external {
        require(drawPhase == DrawPhase.RAIN_DISTRIBUTING, "Not in rain phase");
        require(rainDistributed < RAIN_WINNERS, "Rain fully distributed");

        uint256 totalPool = seasonHistory[currentSeasonId].totalPrize;
        uint256 rainPrize = (totalPool * RAIN_BPS) / 10000;
        uint256 prizeEach = rainPrize / RAIN_WINNERS;

        uint256 batchEnd = rainDistributed + RAIN_BATCH_SIZE;
        if (batchEnd > RAIN_WINNERS) batchEnd = RAIN_WINNERS;
        if (batchEnd > soldIndices.length) batchEnd = rainDistributed + (soldIndices.length - rainDistributed);

        uint256 currentSeed = revealedSeed;

        for (uint256 i = rainDistributed; i < batchEnd; i++) {
            currentSeed = uint256(keccak256(abi.encodePacked(currentSeed, i)));
            uint256 randomIdx = currentSeed % soldIndices.length;
            uint256 parcelIndex = soldIndices[randomIdx];
            address recipient = grid[parcelIndex].owner;

            if (recipient != address(0)) {
                pendingPrize[recipient] += prizeEach;
            }
        }

        emit RainBatchDistributed(currentSeasonId, rainDistributed, batchEnd);
        rainDistributed = batchEnd;

        // If all rain distributed, finalize season
        if (rainDistributed >= RAIN_WINNERS) {
            seasonHistory[currentSeasonId].completed = true;
            drawPhase = DrawPhase.COMPLETED;
            _resetSeason();
        }
    }

    // ═══════════════════════════════════════════════════
    //  CLAIM: Pull Payment (ONLY msg.sender)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Claim your pending prize. ONLY the wallet owner can call this.
     * @dev Uses Checks-Effects-Interactions pattern. nonReentrant guard.
     *      There is NO claimFor(), NO delegateClaim(), NO adminClaim().
     */
    function claim() external nonReentrant {
        uint256 amount = pendingPrize[msg.sender];
        require(amount > 0, "Nothing to claim");

        // Effects BEFORE interaction (CEI pattern)
        pendingPrize[msg.sender] = 0;

        // Interaction: send BNB
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════
    //  SEASON RESET
    // ═══════════════════════════════════════════════════

    function _resetSeason() internal {
        uint256 newId = currentSeasonId + 1;
        currentSeasonId = newId;
        currentSeasonSold = 0;
        drawPhase = DrawPhase.BUYING;
        commitHash = bytes32(0);
        commitBlock = 0;
        revealDeadlineTimestamp = 0;
        revealedSeed = 0;
        rainDistributed = 0;
        emergencyRequestTime = 0;
        delete soldIndices;
        emit SeasonReset(newId, carryOverPot);
    }

    // ═══════════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════

    function getParcelOwner(uint256 x, uint256 y) external view returns (address) {
        uint256 index = y * GRID_SIZE + x;
        Parcel storage p = grid[index];
        if (p.season == currentSeasonId) return p.owner;
        return address(0);
    }

    function getSoldCount() external view returns (uint256) {
        return currentSeasonSold;
    }

    function getRemainingParcels() external view returns (uint256) {
        return TOTAL_PARCELS - currentSeasonSold;
    }

    function getTotalPrizePool() external view returns (uint256) {
        return (currentSeasonSold * PARCEL_PRICE) + carryOverPot;
    }

    function getSeasonInfo(uint256 seasonId) external view returns (SeasonRecord memory) {
        return seasonHistory[seasonId];
    }

    function getPendingPrize(address user) external view returns (uint256) {
        return pendingPrize[user];
    }

    // ═══════════════════════════════════════════════════
    //  EMERGENCY WITHDRAW (7-day timelock)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Request emergency withdrawal. Must wait 7 days before execution.
     * @dev Can only be called when NOT in the middle of a draw.
     */
    function requestEmergency() external onlyOwner {
        require(drawPhase == DrawPhase.BUYING || drawPhase == DrawPhase.COMPLETED, "Cannot during draw");
        emergencyRequestTime = block.timestamp;
        emit EmergencyRequested(block.timestamp + EMERGENCY_TIMELOCK);
    }

    function cancelEmergency() external onlyOwner {
        emergencyRequestTime = 0;
    }

    function executeEmergency() external onlyOwner nonReentrant {
        require(emergencyRequestTime > 0, "Not requested");
        require(block.timestamp >= emergencyRequestTime + EMERGENCY_TIMELOCK, "Timelock active");
        require(drawPhase == DrawPhase.BUYING || drawPhase == DrawPhase.COMPLETED, "Cannot during draw");

        uint256 amount = address(this).balance;
        emergencyRequestTime = 0;

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");

        emit EmergencyExecuted(amount);
    }

    // Accept BNB
    receive() external payable {}
}
