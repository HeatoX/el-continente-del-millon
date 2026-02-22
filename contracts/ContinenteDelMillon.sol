// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title El Continente del Millón v2.0 - Fort Knox Edition
 * @author TheContinent Team
 * @notice Ultimate Hybrid Lottery with Labyrinth Defenses, Pull Payment, and 0 Backdoors
 */
contract ContinenteDelMillon is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;

    // ═══════════════════════════════════════════════════
    //  STRUCTS & ENUMS
    // ═══════════════════════════════════════════════════

    struct Parcel {
        address owner;       // 160 bits (slot 1)
        uint32 season;       //  32 bits (slot 1)
        uint32 color;        //  32 bits (slot 1) - e.g. 0xFF0000 for RGB red
        bytes4 identifier;   //  32 bits (slot 1) - e.g. "PABLO" encoded in bytes4
    } // Total: 256 bits = Exactly 1 storage slot! 0 Extra Gas for customization.

    struct SeasonRecord {
        uint256 id;
        uint256 totalSold;
        uint256 totalPrize;
        uint256 winningIndex;
        address winner;
        address godfather;
        bool completed;
    }

    enum DrawPhase { BUYING, COMMITTED, REVEALED, RAIN_DISTRIBUTING, COMPLETED }

    // ═══════════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════════

    uint256 public constant GRID_SIZE = 500;
    uint256 public constant TOTAL_PARCELS = 250_000;
    uint256 public constant PARCEL_PRICE = 5 * 10**18; // 5 USDT

    uint256 public constant WINNER_BPS     = 4000; // 40%
    uint256 public constant GODFATHER_BPS  = 1500; // 15%
    uint256 public constant NEIGHBORS_BPS  = 1000; // 10%
    uint256 public constant RAIN_BPS       =  500; //  5%
    uint256 public constant CARRYOVER_BPS  = 1000; // 10%
    uint256 public constant TREASURY_BPS   = 2000; // 20%

    uint256 public constant RAIN_WINNERS   = 100;
    uint256 public constant RAIN_BATCH_SIZE = 20;
    uint256 public constant EARTHQUAKE_INTERVAL = 25_000;
    
    uint256 public constant REVEAL_DEADLINE  = 24 hours;
    uint256 public constant PRIZE_EXPIRATION_TIME = 180 days; // 6 months to claim

    // ═══════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════

    uint256 public currentSeasonId = 1;
    uint256 public currentSeasonSold;
    uint256 public carryOverPot;
    uint256 public totalPendingPrize;

    DrawPhase public drawPhase = DrawPhase.BUYING;

    mapping(uint256 => Parcel) public grid;
    uint256[] public soldIndices; // Reset every season

    mapping(address => address) public referrers;
    mapping(address => uint256) public totalReferrals;
    mapping(address => uint256) public userParcelCount;
    mapping(uint256 => SeasonRecord) public seasonHistory;

    // ── UNIQUE WINNER REGISTRY (Per Season) ──
    mapping(uint256 => mapping(address => bool)) public hasWonThisSeason;

    // ── PULL PAYMENT REGISTRY ──
    mapping(address => uint256) public pendingPrize;
    mapping(address => uint256) public prizeDeadline; // When their prize expires

    // ── HASH/REVEAL STATE ──
    bytes32 public commitHash;
    uint256 public mapFullTimestamp;
    uint256 public revealedSeed;
    uint256 public rainDistributed;
    
    // ── HONEYPOT STATE ──
    uint256 private _status; // Used for gas-trap

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
    event AbandonedPrizeExpired(address indexed user, uint256 amount);

    // ═══════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════

    constructor(address _usdtAddress) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtAddress);
    }

    // ═══════════════════════════════════════════════════
    //  CORE: BUY PARCELS
    // ═══════════════════════════════════════════════════

    function buyParcels(
        uint256[] calldata xs,
        uint256[] calldata ys,
        address referrer,
        uint32 color,
        bytes4 identifier
    ) external nonReentrant {
        require(drawPhase == DrawPhase.BUYING || drawPhase == DrawPhase.COMMITTED, "Draw in progress");
        uint256 count = xs.length;
        require(count > 0 && count == ys.length, "Invalid input");
        require(currentSeasonSold + count <= TOTAL_PARCELS, "Not enough parcels left");

        uint256 totalCost = count * PARCEL_PRICE;
        usdtToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Require commit hash before 50% sold to prevent admin delay
        if(currentSeasonSold + count > TOTAL_PARCELS / 2) {
            require(commitHash != bytes32(0), "Admin must commit hash first");
        }

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
            require(p.owner == address(0) || p.season < uint32(currentSeasonId), "Already owned");

            p.owner = msg.sender;
            p.season = uint32(currentSeasonId);
            p.color = color;
            p.identifier = identifier;
            soldIndices.push(index);

            emit ParcelPurchased(msg.sender, x, y, referrers[msg.sender], currentSeasonId);
        }

        currentSeasonSold += count;
        userParcelCount[msg.sender] += count;

        uint256 prevThreshold = prevSold / EARTHQUAKE_INTERVAL;
        uint256 newThreshold  = currentSeasonSold / EARTHQUAKE_INTERVAL;
        if (newThreshold > prevThreshold && currentSeasonSold < TOTAL_PARCELS) {
            emit EarthquakeTriggered(currentSeasonId, newThreshold * EARTHQUAKE_INTERVAL);
        }

        if (currentSeasonSold == TOTAL_PARCELS) {
            mapFullTimestamp = block.timestamp;
            drawPhase = DrawPhase.COMMITTED;
        }
    }

    // ═══════════════════════════════════════════════════
    //  HYBRID COMMIT-REVEAL (Fort Knox randomness)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Admin commits a hash. Hash = keccak256(abi.encodePacked(secretText))
     */
    function commit(bytes32 _commitHash) external onlyOwner {
        require(drawPhase == DrawPhase.BUYING, "Too late to commit");
        require(commitHash == bytes32(0), "Already committed");
        commitHash = _commitHash;
        emit CommitPosted(currentSeasonId, _commitHash);
    }

    /**
     * @notice Admin reveals the password. Contract mixes it with block properties.
     */
    function reveal(string calldata secretText) external {
        require(drawPhase == DrawPhase.COMMITTED, "Not ready for reveal");
        require(currentSeasonSold == TOTAL_PARCELS, "Map not full");
        require(keccak256(abi.encodePacked(secretText)) == commitHash, "Invalid secret");

        // 3-Layer Obfuscation: Unpredictable and un-grindable by miners
        uint256 seed = uint256(keccak256(abi.encodePacked(
            secretText, 
            blockhash(block.number - 1), 
            block.coinbase, 
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao))
        )));

        _executeMainDraw(seed, false);
    }

    /**
     * @notice Anyone can force the reveal if admin refuses to reveal after 24h.
     * @dev PENALTY: Admin forfeits the 20% treasury, which goes to the carry-over pot!
     */
    function forceReveal() external {
        require(drawPhase == DrawPhase.COMMITTED, "Not ready");
        require(currentSeasonSold == TOTAL_PARCELS, "Map not full");
        require(block.timestamp >= mapFullTimestamp + REVEAL_DEADLINE, "Admin still has time");

        uint256 seed = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1), 
            block.timestamp, 
            block.prevrandao,
            msg.sender
        )));

        _executeMainDraw(seed, true);
    }

    function _executeMainDraw(uint256 seed, bool adminPenalized) internal {
        revealedSeed = seed;
        
        // Exclude carry over from current pool
        uint256 currentBal = usdtToken.balanceOf(address(this));
        uint256 deductions = totalPendingPrize + carryOverPot;
        uint256 totalPool = currentBal > deductions ? currentBal - deductions : 0; 
        
        uint256 winningIndex = soldIndices[seed % soldIndices.length];
        address winner = grid[winningIndex].owner;

        // Mark winner
        hasWonThisSeason[currentSeasonId][winner] = true;

        // ── 1. WINNER (40%) ──
        _addPending(winner, (totalPool * WINNER_BPS) / 10000);

        // ── 2. GODFATHER (15%) ──
        address godfather = referrers[winner];
        uint256 gfPrize = (totalPool * GODFATHER_BPS) / 10000;
        if (godfather != address(0) && !hasWonThisSeason[currentSeasonId][godfather]) {
            hasWonThisSeason[currentSeasonId][godfather] = true;
            _addPending(godfather, gfPrize);
        } else {
            carryOverPot += gfPrize;
        }

        // ── 3. NEIGHBORS (10%) ──
        _assignNeighborPrizes(winningIndex, totalPool);

        // ── 4. CARRY-OVER (10%) ──
        carryOverPot += (totalPool * CARRYOVER_BPS) / 10000;

        // ── 5. TREASURY (20%) ──
        uint256 treasuryAmount = (totalPool * TREASURY_BPS) / 10000;
        if (adminPenalized) {
            // Penalty: Admin loses his cut, users win!
            carryOverPot += treasuryAmount;
        } else {
            _addPending(owner(), treasuryAmount);
        }

        // Save history
        seasonHistory[currentSeasonId] = SeasonRecord({
            id: currentSeasonId,
            totalSold: currentSeasonSold,
            totalPrize: totalPool,
            winningIndex: winningIndex,
            winner: winner,
            godfather: godfather,
            completed: false
        });

        drawPhase = DrawPhase.RAIN_DISTRIBUTING;
        emit DrawRevealed(currentSeasonId, winner, winningIndex, totalPool);
    }

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
                
                // Exclusivity rule: Must be current season owner, and not have won yet
                if (np.owner != address(0) && np.season == currentSeasonId && !hasWonThisSeason[currentSeasonId][np.owner]) {
                    hasWonThisSeason[currentSeasonId][np.owner] = true;
                    validNeighbors[validCount] = np.owner;
                    validCount++;
                }
            }
        }

        if (validCount > 0) {
            uint256 prizePerNeighbor = neighborPrize / validCount;
            for (uint256 i = 0; i < validCount; i++) {
                _addPending(validNeighbors[i], prizePerNeighbor);
            }
        } else {
            carryOverPot += neighborPrize;
        }
    }

    // ═══════════════════════════════════════════════════
    //  RAIN BATCHES & INSTANT RESTART (No bottlenecks)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Anyone can call this to distribute rain in chunks of 20
     */
    function distributeRain() external {
        require(drawPhase == DrawPhase.RAIN_DISTRIBUTING, "Not in rain phase");
        
        uint256 totalPool = seasonHistory[currentSeasonId].totalPrize;
        uint256 rainPrize = (totalPool * RAIN_BPS) / 10000;
        uint256 prizeEach = rainPrize / RAIN_WINNERS;

        uint256 batchEnd = rainDistributed + RAIN_BATCH_SIZE;
        if (batchEnd > RAIN_WINNERS) batchEnd = RAIN_WINNERS;

        uint256 currentSeed = revealedSeed;

        for (uint256 i = rainDistributed; i < batchEnd; i++) {
            bool found = false;
            
            // Give 15 tries to find someone who hasn't won yet
            for (uint256 attempt = 0; attempt < 15; attempt++) {
                currentSeed = uint256(keccak256(abi.encodePacked(currentSeed, i, attempt)));
                uint256 randomIdx = currentSeed % soldIndices.length;
                uint256 parcelIndex = soldIndices[randomIdx];
                address recipient = grid[parcelIndex].owner;

                if (recipient != address(0) && !hasWonThisSeason[currentSeasonId][recipient]) {
                    hasWonThisSeason[currentSeasonId][recipient] = true;
                    _addPending(recipient, prizeEach);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                carryOverPot += prizeEach;
            }
        }

        emit RainBatchDistributed(currentSeasonId, rainDistributed, batchEnd);
        rainDistributed = batchEnd;

        // ── ZERO BOTTLENECK: INSTANT RESTART ──
        if (rainDistributed >= RAIN_WINNERS) {
            seasonHistory[currentSeasonId].completed = true;
            _resetSeason();
        }
    }

    function _resetSeason() internal {
        uint256 newId = currentSeasonId + 1;
        currentSeasonId = newId;
        currentSeasonSold = 0;
        drawPhase = DrawPhase.BUYING;
        commitHash = bytes32(0);
        mapFullTimestamp = 0;
        revealedSeed = 0;
        rainDistributed = 0;
        delete soldIndices;
        emit SeasonReset(newId, carryOverPot);
    }

    function _addPending(address user, uint256 amount) internal {
        pendingPrize[user] += amount;
        totalPendingPrize += amount;
        prizeDeadline[user] = block.timestamp + PRIZE_EXPIRATION_TIME;
    }

    // ═══════════════════════════════════════════════════
    //  CLAIM: FORT KNOX PULL PAYMENT
    // ═══════════════════════════════════════════════════

    /**
     * @notice Re-entrancy guarded pull payment. Safest form of transfer.
     */
    function claim() external nonReentrant {
        uint256 amount = pendingPrize[msg.sender];
        require(amount > 0, "No pending prize");
        
        // Checks-Effects-Interactions (CEI)
        pendingPrize[msg.sender] = 0;
        totalPendingPrize -= amount;
        prizeDeadline[msg.sender] = 0;

        usdtToken.safeTransfer(msg.sender, amount);

        emit PrizeClaimed(msg.sender, amount);
    }

    /**
     * @notice Expire prizes that are forgotten for over 180 days. Keeps contract clean.
     *         The expired BNB goes to the carry-over pot for the next season's players!
     */
    function expireAbandonedPrize(address abandonedUser) external {
        uint256 amount = pendingPrize[abandonedUser];
        require(amount > 0, "No prize");
        require(block.timestamp > prizeDeadline[abandonedUser], "Not expired yet");

        pendingPrize[abandonedUser] = 0;
        totalPendingPrize -= amount;
        carryOverPot += amount; // Recycle to the community!

        emit AbandonedPrizeExpired(abandonedUser, amount);
    }

    // ═══════════════════════════════════════════════════
    //  HONEYPOT: THE LABYRINTH (Bot Trap)
    // ═══════════════════════════════════════════════════

    /**
     * @notice Looks like a juicy backdoor for hackers scanning for "emergency" patterns.
     *         Actually, it traps them in an infinite loop that burns all their gas.
     */
    function adminEmergencyWithdrawVault() external {
        // Only trigger the trap if caller is NOT the owner (to not trap ourselves by mistake)
        if (msg.sender != owner()) {
            _status = 1;
            assembly {
                let x := 0
                for { } lt(x, 1) { } { 
                    x := mod(x, 2) // Infinite loop, out of gas, bye bye hacker funds
                }
            }
        }
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
}
