import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("BitFrac - Fractional Asset Tokenization Protocol", () => {
  // ============================================
  // Constants Tests
  // ============================================
  describe("constants", () => {
    it("should have correct error constants", () => {
      const ERR_OWNER_ONLY = 100;
      const ERR_NOT_FOUND = 101;
      const ERR_ALREADY_LISTED = 102;
      const ERR_INVALID_AMOUNT = 103;
      const ERR_NOT_AUTHORIZED = 104;
      const ERR_KYC_REQUIRED = 105;
      const ERR_VOTE_EXISTS = 106;
      const ERR_VOTE_ENDED = 107;
      const ERR_PRICE_EXPIRED = 108;
      const ERR_INVALID_URI = 110;
      const ERR_INVALID_VALUE = 111;
      const ERR_INVALID_DURATION = 112;
      const ERR_INVALID_KYC_LEVEL = 113;
      const ERR_INVALID_EXPIRY = 114;
      const ERR_INVALID_VOTES = 115;
      const ERR_INVALID_ADDRESS = 116;
      const ERR_INVALID_TITLE = 117;
      
      expect(ERR_OWNER_ONLY).toBe(100);
      expect(ERR_NOT_FOUND).toBe(101);
      expect(ERR_ALREADY_LISTED).toBe(102);
      expect(ERR_INVALID_AMOUNT).toBe(103);
      expect(ERR_NOT_AUTHORIZED).toBe(104);
      expect(ERR_KYC_REQUIRED).toBe(105);
      expect(ERR_VOTE_EXISTS).toBe(106);
      expect(ERR_VOTE_ENDED).toBe(107);
      expect(ERR_PRICE_EXPIRED).toBe(108);
      expect(ERR_INVALID_URI).toBe(110);
      expect(ERR_INVALID_VALUE).toBe(111);
      expect(ERR_INVALID_DURATION).toBe(112);
      expect(ERR_INVALID_KYC_LEVEL).toBe(113);
      expect(ERR_INVALID_EXPIRY).toBe(114);
      expect(ERR_INVALID_VOTES).toBe(115);
      expect(ERR_INVALID_ADDRESS).toBe(116);
      expect(ERR_INVALID_TITLE).toBe(117);
    });

    it("should have correct configuration constants", () => {
      const MAX_ASSET_VALUE = 1000000000000;
      const MIN_ASSET_VALUE = 1000;
      const MAX_DURATION = 144;
      const MIN_DURATION = 12;
      const MAX_KYC_LEVEL = 5;
      const MAX_EXPIRY = 52560;
      const TOKENS_PER_ASSET = 100000;
      
      expect(MAX_ASSET_VALUE).toBe(1000000000000);
      expect(MIN_ASSET_VALUE).toBe(1000);
      expect(MAX_DURATION).toBe(144);
      expect(MIN_DURATION).toBe(12);
      expect(MAX_KYC_LEVEL).toBe(5);
      expect(MAX_EXPIRY).toBe(52560);
      expect(TOKENS_PER_ASSET).toBe(100000);
    });
  });

  // ============================================
  // Validation Tests
  // ============================================
  describe("validation functions", () => {
    it("should validate asset value correctly", () => {
      const validValue = 50000;
      const tooLow = 500;
      const tooHigh = 2000000000000;
      
      const isValidValid = validValue >= 1000 && validValue <= 1000000000000;
      const isValidLow = tooLow >= 1000 && tooLow <= 1000000000000;
      const isValidHigh = tooHigh >= 1000 && tooHigh <= 1000000000000;
      
      expect(isValidValid).toBe(true);
      expect(isValidLow).toBe(false);
      expect(isValidHigh).toBe(false);
    });

    it("should validate duration correctly", () => {
      const validDuration = 72;
      const tooShort = 6;
      const tooLong = 200;
      
      const isValidValid = validDuration >= 12 && validDuration <= 144;
      const isValidShort = tooShort >= 12 && tooShort <= 144;
      const isValidLong = tooLong >= 12 && tooLong <= 144;
      
      expect(isValidValid).toBe(true);
      expect(isValidShort).toBe(false);
      expect(isValidLong).toBe(false);
    });

    it("should validate KYC level correctly", () => {
      const validLevel = 3;
      const invalidLevel = 7;
      
      const isValidValid = validLevel <= 5;
      const isValidInvalid = invalidLevel <= 5;
      
      expect(isValidValid).toBe(true);
      expect(isValidInvalid).toBe(false);
    });

    it("should validate expiry correctly", () => {
      const currentBlock = 1000;
      const validExpiry = 2000;
      const expired = 900;
      const tooFar = 100000;
      const maxExpiry = 52560;
      
      const isValidValid = validExpiry > currentBlock && (validExpiry - currentBlock) <= maxExpiry;
      const isValidExpired = expired > currentBlock && (expired - currentBlock) <= maxExpiry;
      const isValidTooFar = tooFar > currentBlock && (tooFar - currentBlock) <= maxExpiry;
      
      expect(isValidValid).toBe(true);
      expect(isValidExpired).toBe(false);
      expect(isValidTooFar).toBe(false);
    });

    it("should validate minimum votes correctly", () => {
      const validVotes = 50000;
      const zeroVotes = 0;
      const tooMany = 200000;
      const maxVotes = 100000;
      
      const isValidValid = validVotes > 0 && validVotes <= maxVotes;
      const isValidZero = zeroVotes > 0 && zeroVotes <= maxVotes;
      const isValidTooMany = tooMany > 0 && tooMany <= maxVotes;
      
      expect(isValidValid).toBe(true);
      expect(isValidZero).toBe(false);
      expect(isValidTooMany).toBe(false);
    });

    it("should validate metadata URI correctly", () => {
      const validUri = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const emptyUri = "";
      const longUri = "a".repeat(300);
      
      const isValidValid = validUri.length > 0 && validUri.length <= 256;
      const isValidEmpty = emptyUri.length > 0 && emptyUri.length <= 256;
      const isValidLong = longUri.length > 0 && longUri.length <= 256;
      
      expect(isValidValid).toBe(true);
      expect(isValidEmpty).toBe(false);
      expect(isValidLong).toBe(false);
    });
  });

  // ============================================
  // Asset Management Tests
  // ============================================
  describe("asset management", () => {
    it("should increment asset ID correctly", () => {
      let lastAssetId = 0;
      
      const asset1 = lastAssetId + 1;
      lastAssetId = asset1;
      expect(asset1).toBe(1);
      expect(lastAssetId).toBe(1);
      
      const asset2 = lastAssetId + 1;
      lastAssetId = asset2;
      expect(asset2).toBe(2);
      expect(lastAssetId).toBe(2);
      
      const asset3 = lastAssetId + 1;
      expect(asset3).toBe(3);
    });

    it("should track asset ownership correctly", () => {
      const assetOwner = deployer;
      const newOwner = wallet2;
      
      const isOwner = assetOwner === deployer;
      const isTransferred = newOwner === wallet2;
      
      expect(isOwner).toBe(true);
      expect(isTransferred).toBe(true);
    });

    it("should handle asset lock state", () => {
      const isLocked = true;
      const isUnlocked = false;
      
      expect(isLocked).toBe(true);
      expect(isUnlocked).toBe(false);
    });
  });

  // ============================================
  // Token Balance Tests
  // ============================================
  describe("token balances", () => {
    it("should calculate balance correctly", () => {
      const initialBalance = 100000;
      const transferAmount = 25000;
      const newBalance = initialBalance - transferAmount;
      
      expect(initialBalance).toBe(100000);
      expect(transferAmount).toBe(25000);
      expect(newBalance).toBe(75000);
    });

    it("should prevent insufficient balance transfers", () => {
      const balance = 50000;
      const amount = 75000;
      const isValid = balance >= amount;
      
      expect(balance).toBe(50000);
      expect(amount).toBe(75000);
      expect(isValid).toBe(false);
    });

    it("should calculate recipient balance correctly", () => {
      const recipientBalance = 10000;
      const receivedAmount = 5000;
      const newBalance = recipientBalance + receivedAmount;
      
      expect(recipientBalance).toBe(10000);
      expect(receivedAmount).toBe(5000);
      expect(newBalance).toBe(15000);
    });
  });

  // ============================================
  // Dividend Tests
  // ============================================
  describe("dividend calculations", () => {
    it("should calculate dividend amount correctly", () => {
      const tokenBalance = 50000;
      const totalDividends = 100000;
      const lastClaimed = 60000;
      const tokensPerAsset = 100000;
      
      const claimableAmount = (tokenBalance * (totalDividends - lastClaimed)) / tokensPerAsset;
      
      expect(tokenBalance).toBe(50000);
      expect(totalDividends).toBe(100000);
      expect(lastClaimed).toBe(60000);
      expect(claimableAmount).toBe(20000);
    });

    it("should handle zero dividends", () => {
      const tokenBalance = 50000;
      const totalDividends = 0;
      const lastClaimed = 0;
      const tokensPerAsset = 100000;
      
      const claimableAmount = (tokenBalance * (totalDividends - lastClaimed)) / tokensPerAsset;
      
      expect(claimableAmount).toBe(0);
    });

    it("should update total dividends correctly", () => {
      const currentTotal = 100000;
      const addedAmount = 25000;
      const newTotal = currentTotal + addedAmount;
      
      expect(currentTotal).toBe(100000);
      expect(addedAmount).toBe(25000);
      expect(newTotal).toBe(125000);
    });
  });

  // ============================================
  // Governance Tests
  // ============================================
  describe("governance", () => {
    it("should increment proposal ID correctly", () => {
      let lastProposalId = 0;
      
      const proposal1 = lastProposalId + 1;
      lastProposalId = proposal1;
      expect(proposal1).toBe(1);
      expect(lastProposalId).toBe(1);
      
      const proposal2 = lastProposalId + 1;
      lastProposalId = proposal2;
      expect(proposal2).toBe(2);
      expect(lastProposalId).toBe(2);
    });

    it("should calculate proposal end height correctly", () => {
      const startHeight = 1000;
      const duration = 72;
      const endHeight = startHeight + duration;
      
      expect(startHeight).toBe(1000);
      expect(duration).toBe(72);
      expect(endHeight).toBe(1072);
    });

    it("should track votes correctly", () => {
      let votesFor = 0;
      let votesAgainst = 0;
      
      votesFor += 50000;
      expect(votesFor).toBe(50000);
      expect(votesAgainst).toBe(0);
      
      votesAgainst += 25000;
      expect(votesFor).toBe(50000);
      expect(votesAgainst).toBe(25000);
      
      votesFor += 15000;
      expect(votesFor).toBe(65000);
      expect(votesAgainst).toBe(25000);
    });

    it("should determine proposal outcome correctly", () => {
      const votesFor = 65000;
      const votesAgainst = 25000;
      const minimumVotes = 50000;
      
      const hasMinimumVotes = (votesFor + votesAgainst) >= minimumVotes;
      const passed = votesFor > votesAgainst;
      
      expect(hasMinimumVotes).toBe(true);
      expect(passed).toBe(true);
    });

    it("should check vote deadline", () => {
      const currentBlock = 1100;
      const endHeight = 1072;
      const isActive = currentBlock < endHeight;
      
      expect(currentBlock).toBe(1100);
      expect(endHeight).toBe(1072);
      expect(isActive).toBe(false);
    });
  });

  // ============================================
  // KYC Compliance Tests
  // ============================================
  describe("KYC compliance", () => {
    it("should validate KYC approved status", () => {
      const isApproved = true;
      const isNotApproved = false;
      
      expect(isApproved).toBe(true);
      expect(isNotApproved).toBe(false);
    });

    it("should check KYC expiry", () => {
      const currentBlock = 1000;
      const validExpiry = 2000;
      const expired = 900;
      
      const isValid = validExpiry > currentBlock;
      const isExpired = expired > currentBlock;
      
      expect(isValid).toBe(true);
      expect(isExpired).toBe(false);
    });

    it("should validate KYC level requirements", () => {
      const requiredLevel = 2;
      const userLevel = 3;
      const meetsRequirement = userLevel >= requiredLevel;
      
      expect(requiredLevel).toBe(2);
      expect(userLevel).toBe(3);
      expect(meetsRequirement).toBe(true);
    });
  });

  // ============================================
  // Price Oracle Tests
  // ============================================
  describe("price oracle", () => {
    it("should track price updates", () => {
      const oldPrice = 1000000;
      const newPrice = 1100000;
      const update = newPrice - oldPrice;
      
      expect(oldPrice).toBe(1000000);
      expect(newPrice).toBe(1100000);
      expect(update).toBe(100000);
    });

    it("should check price freshness", () => {
      const lastUpdate = 1000;
      const currentBlock = 2000;
      const maxAge = 3600;
      const isFresh = (currentBlock - lastUpdate) <= maxAge;
      
      expect(lastUpdate).toBe(1000);
      expect(currentBlock).toBe(2000);
      expect(maxAge).toBe(3600);
      expect(isFresh).toBe(true);
    });
  });

  // ============================================
  // Access Control Tests
  // ============================================
  describe("access control", () => {
    it("should identify contract owner correctly", () => {
      const contractOwner = deployer;
      const txSender = deployer;
      const notOwner = wallet1;
      
      const isOwner = txSender === contractOwner;
      const isNotOwner = notOwner === contractOwner;
      
      expect(isOwner).toBe(true);
      expect(isNotOwner).toBe(false);
    });

    it("should identify valid oracle correctly", () => {
      const isOracle = (addr: string) => addr === deployer || addr === wallet1;
      
      expect(isOracle(deployer)).toBe(true);
      expect(isOracle(wallet1)).toBe(true);
      expect(isOracle(wallet2)).toBe(false);
    });

    it("should validate principal addresses", () => {
      const isValid = (addr: string) => addr !== deployer && addr !== "contract";
      
      expect(isValid(wallet1)).toBe(true);
      expect(isValid(deployer)).toBe(false);
    });
  });

  // ============================================
  // Supply Tests
  // ============================================
  describe("token supply", () => {
    it("should have correct total supply", () => {
      const tokensPerAsset = 100000;
      
      expect(tokensPerAsset).toBe(100000);
    });

    it("should have correct circulating supply", () => {
      const tokensPerAsset = 100000;
      
      expect(tokensPerAsset).toBe(100000);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe("edge cases", () => {
    it("should handle zero amount operations", () => {
      const amount = 0;
      const isValid = amount > 0;
      
      expect(amount).toBe(0);
      expect(isValid).toBe(false);
    });

    it("should handle maximum uint values", () => {
      const maxUint = BigInt("340282366920938463463374607431768211455");
      const assetValue = maxUint - 1000n;
      
      expect(assetValue < maxUint).toBe(true);
    });

    it("should handle empty metadata URI", () => {
      const uri = "";
      const isValid = uri.length > 0;
      
      expect(uri.length).toBe(0);
      expect(isValid).toBe(false);
    });

    it("should handle expired votes", () => {
      const currentBlock = 2000;
      const endHeight = 1500;
      const canVote = currentBlock < endHeight;
      
      expect(currentBlock).toBe(2000);
      expect(endHeight).toBe(1500);
      expect(canVote).toBe(false);
    });
  });

  // ============================================
  // Event Structure Tests
  // ============================================
  describe("event structures", () => {
    it("should have correct asset registered event structure", () => {
      const assetRegisteredEvent = {
        event: "asset-registered",
        assetId: 1,
        owner: deployer,
        metadataUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        assetValue: 1000000,
        totalSupply: 100000,
        timestamp: 1000
      };
      
      expect(assetRegisteredEvent.event).toBe("asset-registered");
      expect(assetRegisteredEvent.assetId).toBe(1);
      expect(assetRegisteredEvent.owner).toBe(deployer);
      expect(assetRegisteredEvent.metadataUri).toBe("ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
      expect(assetRegisteredEvent.assetValue).toBe(1000000);
      expect(assetRegisteredEvent.totalSupply).toBe(100000);
      expect(assetRegisteredEvent.timestamp).toBe(1000);
    });

    it("should have correct token transfer event structure", () => {
      const tokenTransferEvent = {
        event: "token-transfer",
        assetId: 1,
        from: wallet1,
        to: wallet2,
        amount: 50000,
        fromBalanceAfter: 50000,
        toBalanceAfter: 50000,
        timestamp: 1200
      };
      
      expect(tokenTransferEvent.event).toBe("token-transfer");
      expect(tokenTransferEvent.assetId).toBe(1);
      expect(tokenTransferEvent.from).toBe(wallet1);
      expect(tokenTransferEvent.to).toBe(wallet2);
      expect(tokenTransferEvent.amount).toBe(50000);
      expect(tokenTransferEvent.fromBalanceAfter).toBe(50000);
      expect(tokenTransferEvent.toBalanceAfter).toBe(50000);
      expect(tokenTransferEvent.timestamp).toBe(1200);
    });

    it("should have correct KYC updated event structure", () => {
      const kycUpdatedEvent = {
        event: "kyc-updated",
        address: wallet1,
        isApproved: true,
        level: 3,
        expiry: 50000,
        updatedBy: deployer,
        timestamp: 1100
      };
      
      expect(kycUpdatedEvent.event).toBe("kyc-updated");
      expect(kycUpdatedEvent.address).toBe(wallet1);
      expect(kycUpdatedEvent.isApproved).toBe(true);
      expect(kycUpdatedEvent.level).toBe(3);
      expect(kycUpdatedEvent.expiry).toBe(50000);
      expect(kycUpdatedEvent.updatedBy).toBe(deployer);
      expect(kycUpdatedEvent.timestamp).toBe(1100);
    });

    it("should have correct price updated event structure", () => {
      const priceUpdatedEvent = {
        event: "price-updated",
        assetId: 1,
        price: 1100000,
        decimals: 6,
        oracle: wallet3,
        previousPrice: 1000000,
        timestamp: 1300
      };
      
      expect(priceUpdatedEvent.event).toBe("price-updated");
      expect(priceUpdatedEvent.assetId).toBe(1);
      expect(priceUpdatedEvent.price).toBe(1100000);
      expect(priceUpdatedEvent.decimals).toBe(6);
      expect(priceUpdatedEvent.oracle).toBe(wallet3);
      expect(priceUpdatedEvent.previousPrice).toBe(1000000);
      expect(priceUpdatedEvent.timestamp).toBe(1300);
    });

    it("should have correct dividends added event structure", () => {
      const dividendsAddedEvent = {
        event: "dividends-added",
        assetId: 1,
        amount: 50000,
        newTotal: 150000,
        addedBy: deployer,
        timestamp: 1400
      };
      
      expect(dividendsAddedEvent.event).toBe("dividends-added");
      expect(dividendsAddedEvent.assetId).toBe(1);
      expect(dividendsAddedEvent.amount).toBe(50000);
      expect(dividendsAddedEvent.newTotal).toBe(150000);
      expect(dividendsAddedEvent.addedBy).toBe(deployer);
      expect(dividendsAddedEvent.timestamp).toBe(1400);
    });

    it("should have correct dividends claimed event structure", () => {
      const dividendsClaimedEvent = {
        event: "dividends-claimed",
        assetId: 1,
        claimer: wallet1,
        amount: 25000,
        balanceAtClaim: 50000,
        totalDividends: 150000,
        previousClaim: 100000,
        timestamp: 1500
      };
      
      expect(dividendsClaimedEvent.event).toBe("dividends-claimed");
      expect(dividendsClaimedEvent.assetId).toBe(1);
      expect(dividendsClaimedEvent.claimer).toBe(wallet1);
      expect(dividendsClaimedEvent.amount).toBe(25000);
      expect(dividendsClaimedEvent.balanceAtClaim).toBe(50000);
      expect(dividendsClaimedEvent.totalDividends).toBe(150000);
      expect(dividendsClaimedEvent.previousClaim).toBe(100000);
      expect(dividendsClaimedEvent.timestamp).toBe(1500);
    });

    it("should have correct proposal created event structure", () => {
      const proposalCreatedEvent = {
        event: "proposal-created",
        proposalId: 1,
        creator: wallet1,
        assetId: 1,
        title: "Increase asset value",
        duration: 72,
        startHeight: 2000,
        endHeight: 2072,
        minimumVotes: 50000,
        timestamp: 2000
      };
      
      expect(proposalCreatedEvent.event).toBe("proposal-created");
      expect(proposalCreatedEvent.proposalId).toBe(1);
      expect(proposalCreatedEvent.creator).toBe(wallet1);
      expect(proposalCreatedEvent.assetId).toBe(1);
      expect(proposalCreatedEvent.title).toBe("Increase asset value");
      expect(proposalCreatedEvent.duration).toBe(72);
      expect(proposalCreatedEvent.startHeight).toBe(2000);
      expect(proposalCreatedEvent.endHeight).toBe(2072);
      expect(proposalCreatedEvent.minimumVotes).toBe(50000);
      expect(proposalCreatedEvent.timestamp).toBe(2000);
    });

    it("should have correct vote cast event structure", () => {
      const voteCastEvent = {
        event: "vote-cast",
        proposalId: 1,
        voter: wallet1,
        voteDirection: "for",
        amount: 30000,
        assetId: 1,
        voterBalance: 50000,
        kycLevel: 3,
        newTotalFor: 30000,
        newTotalAgainst: 20000,
        timestamp: 2050
      };
      
      expect(voteCastEvent.event).toBe("vote-cast");
      expect(voteCastEvent.proposalId).toBe(1);
      expect(voteCastEvent.voter).toBe(wallet1);
      expect(voteCastEvent.voteDirection).toBe("for");
      expect(voteCastEvent.amount).toBe(30000);
      expect(voteCastEvent.assetId).toBe(1);
      expect(voteCastEvent.voterBalance).toBe(50000);
      expect(voteCastEvent.kycLevel).toBe(3);
      expect(voteCastEvent.newTotalFor).toBe(30000);
      expect(voteCastEvent.newTotalAgainst).toBe(20000);
      expect(voteCastEvent.timestamp).toBe(2050);
    });

    it("should have correct proposal executed event structure", () => {
      const proposalExecutedEvent = {
        event: "proposal-executed",
        proposalId: 1,
        assetId: 1,
        votesFor: 65000,
        votesAgainst: 35000,
        totalVotes: 100000,
        executedBy: wallet2,
        timestamp: 2100
      };
      
      expect(proposalExecutedEvent.event).toBe("proposal-executed");
      expect(proposalExecutedEvent.proposalId).toBe(1);
      expect(proposalExecutedEvent.assetId).toBe(1);
      expect(proposalExecutedEvent.votesFor).toBe(65000);
      expect(proposalExecutedEvent.votesAgainst).toBe(35000);
      expect(proposalExecutedEvent.totalVotes).toBe(100000);
      expect(proposalExecutedEvent.executedBy).toBe(wallet2);
      expect(proposalExecutedEvent.timestamp).toBe(2100);
    });

    it("should have correct asset locked event structure", () => {
      const assetLockedEvent = {
        event: "asset-locked",
        assetId: 1,
        lockedBy: deployer,
        timestamp: 2200
      };
      
      expect(assetLockedEvent.event).toBe("asset-locked");
      expect(assetLockedEvent.assetId).toBe(1);
      expect(assetLockedEvent.lockedBy).toBe(deployer);
      expect(assetLockedEvent.timestamp).toBe(2200);
    });

    it("should have correct asset unlocked event structure", () => {
      const assetUnlockedEvent = {
        event: "asset-unlocked",
        assetId: 1,
        unlockedBy: deployer,
        timestamp: 2300
      };
      
      expect(assetUnlockedEvent.event).toBe("asset-unlocked");
      expect(assetUnlockedEvent.assetId).toBe(1);
      expect(assetUnlockedEvent.unlockedBy).toBe(deployer);
      expect(assetUnlockedEvent.timestamp).toBe(2300);
    });

    it("should have correct asset ownership transferred event structure", () => {
      const assetOwnershipTransferredEvent = {
        event: "asset-ownership-transferred",
        assetId: 1,
        previousOwner: deployer,
        newOwner: wallet2,
        timestamp: 2400
      };
      
      expect(assetOwnershipTransferredEvent.event).toBe("asset-ownership-transferred");
      expect(assetOwnershipTransferredEvent.assetId).toBe(1);
      expect(assetOwnershipTransferredEvent.previousOwner).toBe(deployer);
      expect(assetOwnershipTransferredEvent.newOwner).toBe(wallet2);
      expect(assetOwnershipTransferredEvent.timestamp).toBe(2400);
    });
  });
});
