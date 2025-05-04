# BitFrac - Fractional Asset Tokenization Protocol

**BitFrac** is a compliance-centric smart contract protocol for tokenizing real-world assets into fractional ownership tokens on the **Stacks** blockchain. Built with a strong emphasis on regulatory compliance, governance, and automated income distribution, BitFrac leverages Bitcoin’s security through the Stacks ecosystem.

## 🌐 Overview

BitFrac empowers asset owners to tokenize high-value real-world assets into fungible tokens, enabling fractional ownership, decentralized governance, and streamlined dividend distribution. The protocol is suitable for tokenizing a wide array of asset classes, such as real estate, fine art, collectibles, and private equity, while maintaining compliance with KYC/AML standards.

## Features

* **Secure Asset Tokenization:** Converts real-world assets into programmable, divisible tokens (SFTs) on the Stacks blockchain.
* **Regulatory Compliance:** Integrated KYC levels and expiry tracking to ensure legal conformity.
* **On-Chain Governance:** Asset token holders can propose and vote on governance matters.
* **Dividend Distribution:** Token holders earn dividends based on ownership stake.
* **Oracle Integration:** Reliable pricing via registered oracles with expiration safeguards.
* **Metadata Support:** URI-based off-chain asset metadata management.
* **Access Control:** Contract owner administrative privileges and validation enforcement.

## Core Components

### Smart Contract Primitives

#### Constants

* `contract-owner`: The principal authorized to manage asset registration.
* Defined error codes for precise and readable error handling across domains (compliance, governance, access control, etc.).
* Value limits like `MAX-ASSET-VALUE`, `MAX-KYC-LEVEL`, etc., ensure asset and data constraints.

#### Data Variables

* `last-asset-id`: Tracks the latest asset registered.
* `last-proposal-id`: Tracks the latest governance proposal.

#### Data Maps

* `assets`: Stores metadata, ownership, value, and history for each tokenized asset.
* `token-balances`: Tracks token distribution per asset and owner.
* `kyc-status`: Manages KYC level, approval, and expiry per address.
* `proposals`: Contains governance proposals with voting windows and outcomes.
* `votes`: Tracks individual votes for each proposal.
* `dividend-claims`: Prevents double claiming by tracking last claimed dividend points.
* `price-feeds`: Integrates trusted oracles to reflect updated asset pricing.

## Key Functions

### Public Functions

* **`register-asset(metadata-uri, asset-value)`**
  Registers a new tokenized asset. Only the `contract-owner` can execute this.

* **`claim-dividends(asset-id)`**
  Distributes dividends proportionally to token holders.

* **`create-proposal(asset-id, title, duration, minimum-votes)`**
  Initiates a proposal to be voted on by stakeholders of a specific asset.

* **`vote(proposal-id, vote-for, amount)`**
  Enables asset holders to cast votes proportional to their holdings.

### Read-Only Functions

* **`get-asset-info(asset-id)`**, **`get-proposal(proposal-id)`**
  Fetches asset and proposal metadata.

* **`get-balance(owner, asset-id)`**
  Retrieves token balance for an owner.

* **`get-vote(proposal-id, voter)`**, **`get-last-claim(asset-id, claimer)`**
  Retrieves voting and dividend history.

* **`get-price-feed(asset-id)`**
  Returns oracle-reported asset pricing.

## Validation & Security

The protocol includes robust private validation functions to ensure:

* Asset values, durations, and thresholds are within logical limits.
* URI formats and proposal titles meet string constraints.
* KYC levels and expirations are up to date and enforceable.
* No double voting, dividend abuse, or unauthorized access.

## KYC Integration

KYC approval and verification is essential to maintain compliance. Each participant is:

* Assigned a `level` of verification.
* Provided an `expiry` to ensure periodic review.
* Required to be `is-approved` to interact with sensitive functions.

## Governance

Token holders with a minimum of 10% stake can propose governance actions. Proposals go through:

1. **Creation** with a defined duration and vote threshold.
2. **Voting** by eligible token holders within the proposal window.
3. **Outcome** execution based on the vote count and minimum vote condition.

## Dividend Distribution

Dividends are distributed pro rata based on token balances. Token holders can claim their share by:

* Calling `claim-dividends(asset-id)`
* The system calculates unpaid dividends since the last claim using `last-claimed-amount`.

## Oracle Support

Each asset’s valuation is tracked via an external oracle, stored in the `price-feeds` map with:

* Oracle address
* Price and decimals
* Last update height

Ensures dynamic, up-to-date asset valuation integrity.

## Integration Possibilities

* Asset token marketplaces
* Fractional investment platforms
* DAO-based asset management
* Real estate and collectibles digitization

## Contributing

We welcome collaboration! To contribute:

1. Fork the repository.
2. Write and test your feature.
3. Submit a pull request with a detailed description.

## Final Thoughts

**BitFrac** bridges the world of traditional assets with the decentralized future—allowing anyone, anywhere to own and benefit from fractionalized, real-world value backed by the security of Bitcoin via the Stacks ecosystem.
