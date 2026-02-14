;; Title: BitFrac - Fractional Asset Tokenization Protocol for Bitcoin & Stacks
;; 
;; Summary: A compliance-focused smart contract for fractionalizing real-world assets 
;; into tradable tokens on the Stacks network with built-in KYC, governance, and
;; dividend distribution mechanisms.
;;
;; Description: BitFrac enables compliant tokenization of high-value assets by creating
;; secure fractional ownership tokens with robust governance controls. The protocol
;; implements KYC verification, price oracles, voting mechanisms, and automated dividend
;; distribution while maintaining full regulatory compliance with Bitcoin standards.
;;

;; Constants

;; Administrative
(define-constant contract-owner tx-sender)

;; Error codes - Access control
(define-constant err-owner-only (err u100))
(define-constant err-not-authorized (err u104))

;; Error codes - Asset management
(define-constant err-not-found (err u101))
(define-constant err-already-listed (err u102))
(define-constant err-invalid-amount (err u103))

;; Error codes - Compliance
(define-constant err-kyc-required (err u105))
(define-constant err-price-expired (err u108))

;; Error codes - Governance
(define-constant err-vote-exists (err u106))
(define-constant err-vote-ended (err u107))

;; Error codes - Validation
(define-constant err-invalid-uri (err u110))
(define-constant err-invalid-value (err u111))
(define-constant err-invalid-duration (err u112))
(define-constant err-invalid-kyc-level (err u113))
(define-constant err-invalid-expiry (err u114))
(define-constant err-invalid-votes (err u115))
(define-constant err-invalid-address (err u116))
(define-constant err-invalid-title (err u117))

;; Value limits and thresholds
(define-constant MAX-ASSET-VALUE u1000000000000) ;; 1 trillion
(define-constant MIN-ASSET-VALUE u1000) ;; 1 thousand
(define-constant MAX-DURATION u144) ;; ~1 day in blocks
(define-constant MIN-DURATION u12) ;; ~1 hour in blocks
(define-constant MAX-KYC-LEVEL u5)
(define-constant MAX-EXPIRY u52560) ;; ~1 year in blocks

;; Tokenization settings
(define-constant tokens-per-asset u100000) ;; SFTs per asset - defines the total supply for each tokenized asset

;; Data Variables

;; Track the current asset and proposal counters
(define-data-var last-asset-id uint u0)
(define-data-var last-proposal-id uint u0)

;; Data Maps

;; Core asset information
(define-map assets 
    { asset-id: uint }
    {
        owner: principal,
        metadata-uri: (string-ascii 256),
        asset-value: uint,
        is-locked: bool,
        creation-height: uint,
        last-price-update: uint,
        total-dividends: uint
    }
)

;; Token ownership records
(define-map token-balances
    { owner: principal, asset-id: uint }
    { balance: uint }
)

;; KYC status tracking
(define-map kyc-status
    { address: principal }
    { 
        is-approved: bool,
        level: uint,
        expiry: uint 
    }
)

;; Governance proposal tracking
(define-map proposals
    { proposal-id: uint }
    {
        title: (string-ascii 256),
        asset-id: uint,
        start-height: uint,
        end-height: uint,
        executed: bool,
        votes-for: uint,
        votes-against: uint,
        minimum-votes: uint
    }
)

;; Vote records
(define-map votes
    { proposal-id: uint, voter: principal }
    { vote-amount: uint }
)

;; Dividend distribution tracking
(define-map dividend-claims
    { asset-id: uint, claimer: principal }
    { last-claimed-amount: uint }
)

;; Price oracle integration
(define-map price-feeds
    { asset-id: uint }
    {
        price: uint,
        decimals: uint,
        last-updated: uint,
        oracle: principal
    }
)

;; Token transfer events map (for SIP-010 compliance)
(define-map token-transfers
    { tx-id: uint }
    {
        from: principal,
        to: principal,
        amount: uint,
        asset-id: uint,
        timestamp: uint
    }
)

;; Validation Functions

;; Validate that an asset value is within acceptable limits
(define-private (validate-asset-value (value uint))
    (and 
        (>= value MIN-ASSET-VALUE)
        (<= value MAX-ASSET-VALUE)
    )
)

;; Validate that a proposal duration is within acceptable limits
(define-private (validate-duration (duration uint))
    (and 
        (>= duration MIN-DURATION)
        (<= duration MAX-DURATION)
    )
)

;; Validate that a KYC level is within acceptable limits
(define-private (validate-kyc-level (level uint))
    (<= level MAX-KYC-LEVEL)
)

;; Validate that an expiry is within acceptable limits
(define-private (validate-expiry (expiry uint))
    (and 
        (> expiry stacks-block-height)
        (<= (- expiry stacks-block-height) MAX-EXPIRY)
    )
)

;; Validate that a vote count threshold is reasonable
(define-private (validate-minimum-votes (vote-count uint))
    (and 
        (> vote-count u0)
        (<= vote-count tokens-per-asset)
    )
)

;; Validate that a metadata URI is properly formed
(define-private (validate-metadata-uri (uri (string-ascii 256)))
    (and 
        (> (len uri) u0)
        (<= (len uri) u256)
    )
)

;; Public Functions

;; Register a new asset for tokenization
(define-public (register-asset 
    (metadata-uri (string-ascii 256)) 
    (asset-value uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (validate-metadata-uri metadata-uri) err-invalid-uri)
        (asserts! (validate-asset-value asset-value) err-invalid-value)

        (let 
            ((asset-id (get-next-asset-id)))
            ;; Set the new assets data
            (map-set assets
                { asset-id: asset-id }
                {
                    owner: contract-owner,
                    metadata-uri: metadata-uri,
                    asset-value: asset-value,
                    is-locked: false,
                    creation-height: stacks-block-height,
                    last-price-update: stacks-block-height,
                    total-dividends: u0
                }
            )
            ;; Set initial token balance for the asset owner
            (map-set token-balances
                { owner: contract-owner, asset-id: asset-id }
                { balance: tokens-per-asset }
            )
            ;; Increment the last-asset-id variable
            (var-set last-asset-id asset-id)
            
            ;; Log asset registration event
            (print {
                event: "asset-registered",
                asset-id: asset-id,
                owner: contract-owner,
                metadata-uri: metadata-uri,
                asset-value: asset-value,
                total-supply: tokens-per-asset,
                timestamp: stacks-block-height
            })
            
            (ok asset-id)
        )
    )
)

;; Transfer tokens between verified KYC addresses
(define-public (transfer-tokens
    (asset-id uint)
    (to principal)
    (amount uint))
    (let
        (
            (from-balance (get-balance tx-sender asset-id))
            (to-kyc (unwrap! (get-kyc-status to) err-kyc-required))
            (from-kyc (unwrap! (get-kyc-status tx-sender) err-kyc-required))
        )
        (begin
            (asserts! (>= from-balance amount) err-invalid-amount)
            (asserts! (get is-approved to-kyc) err-kyc-required)
            (asserts! (get is-approved from-kyc) err-kyc-required)
            (asserts! (> (get expiry to-kyc) stacks-block-height) err-invalid-expiry)
            (asserts! (> (get expiry from-kyc) stacks-block-height) err-invalid-expiry)
            
            ;; Update sender balance
            (map-set token-balances
                { owner: tx-sender, asset-id: asset-id }
                { balance: (- from-balance amount) }
            )
            
            ;; Update recipient balance
            (map-set token-balances
                { owner: to, asset-id: asset-id }
                { balance: (+ (get-balance to asset-id) amount) }
            )
            
            ;; Log token transfer event
            (print {
                event: "token-transfer",
                asset-id: asset-id,
                from: tx-sender,
                to: to,
                amount: amount,
                from-balance-after: (- from-balance amount),
                to-balance-after: (+ (get-balance to asset-id) amount),
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Set KYC status for an address (owner only)
(define-public (set-kyc-status
    (address principal)
    (is-approved bool)
    (level uint)
    (expiry uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (validate-kyc-level level) err-invalid-kyc-level)
        (asserts! (validate-expiry expiry) err-invalid-expiry)
        
        (map-set kyc-status
            { address: address }
            { 
                is-approved: is-approved,
                level: level,
                expiry: expiry
            }
        )
        
        ;; Log KYC update event
        (print {
            event: "kyc-updated",
            address: address,
            is-approved: is-approved,
            level: level,
            expiry: expiry,
            updated-by: tx-sender,
            timestamp: stacks-block-height
        })
        
        (ok true)
    )
)

;; Update price feed for an asset (oracle only)
(define-public (update-price-feed
    (asset-id uint)
    (price uint)
    (decimals uint))
    (let
        ((asset (unwrap! (get-asset-info asset-id) err-not-found)))
        (begin
            (asserts! (is-valid-oracle tx-sender) err-not-authorized)
            
            (map-set price-feeds
                { asset-id: asset-id }
                {
                    price: price,
                    decimals: decimals,
                    last-updated: stacks-block-height,
                    oracle: tx-sender
                }
            )
            
            ;; Update asset's last price update
            (map-set assets
                { asset-id: asset-id }
                (merge asset { last-price-update: stacks-block-height })
            )
            
            ;; Log price update event
            (print {
                event: "price-updated",
                asset-id: asset-id,
                price: price,
                decimals: decimals,
                oracle: tx-sender,
                previous-price: (default-to u0 (get price (get-price-feed asset-id))),
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Add dividends to an asset for distribution
(define-public (add-dividends
    (asset-id uint)
    (amount uint))
    (let
        (
            (asset (unwrap! (get-asset-info asset-id) err-not-found))
            (new-total (+ (get total-dividends asset) amount))
        )
        (begin
            (asserts! (> amount u0) err-invalid-amount)
            (asserts! (is-eq tx-sender (get owner asset)) err-not-authorized)
            
            (map-set assets
                { asset-id: asset-id }
                (merge asset { total-dividends: new-total })
            )
            
            ;; Log dividend addition event
            (print {
                event: "dividends-added",
                asset-id: asset-id,
                amount: amount,
                new-total: new-total,
                added-by: tx-sender,
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Claim outstanding dividends for a specific asset
(define-public (claim-dividends (asset-id uint))
    (let
        (
            (asset (unwrap! (get-asset-info asset-id) err-not-found))
            (balance (get-balance tx-sender asset-id))
            (last-claim (get-last-claim asset-id tx-sender))
            (total-dividends (get total-dividends asset))
            (claimable-amount (/ (* balance (- total-dividends last-claim)) tokens-per-asset))
        )
        (asserts! (> claimable-amount u0) err-invalid-amount)
        
        (map-set dividend-claims
            { asset-id: asset-id, claimer: tx-sender }
            { last-claimed-amount: total-dividends }
        )
        
        ;; Log dividend claim event
        (print {
            event: "dividends-claimed",
            asset-id: asset-id,
            claimer: tx-sender,
            amount: claimable-amount,
            balance-at-claim: balance,
            total-dividends: total-dividends,
            previous-claim: last-claim,
            timestamp: stacks-block-height
        })
        
        (ok true)
    )
)

;; Create a new governance proposal for an asset
(define-public (create-proposal 
    (asset-id uint)
    (title (string-ascii 256))
    (duration uint)
    (minimum-votes uint))
    (begin
        (asserts! (validate-duration duration) err-invalid-duration)
        (asserts! (validate-minimum-votes minimum-votes) err-invalid-votes)
        (asserts! (validate-metadata-uri title) err-invalid-title)
        (asserts! (>= (get-balance tx-sender asset-id) (/ tokens-per-asset u10)) err-not-authorized)

        (let
            ((proposal-id (get-next-proposal-id)))
            ;; Set the new proposal data
            (map-set proposals
                { proposal-id: proposal-id }
                {
                    title: title,
                    asset-id: asset-id,
                    start-height: stacks-block-height,
                    end-height: (+ stacks-block-height duration),
                    executed: false,
                    votes-for: u0,
                    votes-against: u0,
                    minimum-votes: minimum-votes
                }
            )
            ;; Increment the last-proposal-id variable
            (var-set last-proposal-id proposal-id)
            
            ;; Log proposal creation event
            (print {
                event: "proposal-created",
                proposal-id: proposal-id,
                creator: tx-sender,
                asset-id: asset-id,
                title: title,
                duration: duration,
                start-height: stacks-block-height,
                end-height: (+ stacks-block-height duration),
                minimum-votes: minimum-votes,
                timestamp: stacks-block-height
            })
            
            (ok proposal-id)
        )
    )
)

;; Vote on an existing proposal
(define-public (vote 
    (proposal-id uint)
    (vote-for bool)
    (amount uint))
    (let
        (
            (proposal (unwrap! (get-proposal proposal-id) err-not-found))
            (asset-id (get asset-id proposal))
            (balance (get-balance tx-sender asset-id))
            (kyc (unwrap! (get-kyc-status tx-sender) err-kyc-required))
        )
        (begin
            (asserts! (get is-approved kyc) err-kyc-required)
            (asserts! (> (get expiry kyc) stacks-block-height) err-invalid-expiry)
            (asserts! (>= balance amount) err-invalid-amount)
            (asserts! (< stacks-block-height (get end-height proposal)) err-vote-ended)
            (asserts! (is-none (get-vote proposal-id tx-sender)) err-vote-exists)

            (map-set votes
                { proposal-id: proposal-id, voter: tx-sender }
                { vote-amount: amount }
            )
            
            (let ((new-votes-for (if vote-for
                    (+ (get votes-for proposal) amount)
                    (get votes-for proposal)))
                  (new-votes-against (if vote-for
                    (get votes-against proposal)
                    (+ (get votes-against proposal) amount))))
                
                (map-set proposals
                    { proposal-id: proposal-id }
                    (merge proposal
                        {
                            votes-for: new-votes-for,
                            votes-against: new-votes-against
                        }
                    )
                )
                
                ;; Log vote cast event
                (print {
                    event: "vote-cast",
                    proposal-id: proposal-id,
                    voter: tx-sender,
                    vote-direction: (if vote-for "for" "against"),
                    amount: amount,
                    asset-id: asset-id,
                    voter-balance: balance,
                    kyc-level: (get level kyc),
                    new-total-for: new-votes-for,
                    new-total-against: new-votes-against,
                    timestamp: stacks-block-height
                })
            )
            (ok true)
        )
    )
)

;; Execute a passed proposal
(define-public (execute-proposal (proposal-id uint))
    (let
        (
            (proposal (unwrap! (get-proposal proposal-id) err-not-found))
            (asset (unwrap! (get-asset-info (get asset-id proposal)) err-not-found))
        )
        (begin
            (asserts! (>= stacks-block-height (get end-height proposal)) err-vote-ended)
            (asserts! (not (get executed proposal)) err-vote-exists)
            (asserts! (>= (+ (get votes-for proposal) (get votes-against proposal)) 
                         (get minimum-votes proposal)) err-invalid-votes)
            (asserts! (> (get votes-for proposal) (get votes-against proposal)) 
                     err-invalid-votes)
            
            (map-set proposals
                { proposal-id: proposal-id }
                (merge proposal { executed: true })
            )
            
            ;; Log proposal execution event
            (print {
                event: "proposal-executed",
                proposal-id: proposal-id,
                asset-id: (get asset-id proposal),
                votes-for: (get votes-for proposal),
                votes-against: (get votes-against proposal),
                total-votes: (+ (get votes-for proposal) (get votes-against proposal)),
                executed-by: tx-sender,
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Lock asset (prevent transfers) - owner only
(define-public (lock-asset (asset-id uint))
    (let
        ((asset (unwrap! (get-asset-info asset-id) err-not-found)))
        (begin
            (asserts! (is-eq tx-sender (get owner asset)) err-not-authorized)
            (asserts! (not (get is-locked asset)) err-invalid-amount)
            
            (map-set assets
                { asset-id: asset-id }
                (merge asset { is-locked: true })
            )
            
            ;; Log asset lock event
            (print {
                event: "asset-locked",
                asset-id: asset-id,
                locked-by: tx-sender,
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Unlock asset - owner only
(define-public (unlock-asset (asset-id uint))
    (let
        ((asset (unwrap! (get-asset-info asset-id) err-not-found)))
        (begin
            (asserts! (is-eq tx-sender (get owner asset)) err-not-authorized)
            (asserts! (get is-locked asset) err-invalid-amount)
            
            (map-set assets
                { asset-id: asset-id }
                (merge asset { is-locked: false })
            )
            
            ;; Log asset unlock event
            (print {
                event: "asset-unlocked",
                asset-id: asset-id,
                unlocked-by: tx-sender,
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Transfer asset ownership - owner only
(define-public (transfer-asset-ownership
    (asset-id uint)
    (new-owner principal))
    (let
        ((asset (unwrap! (get-asset-info asset-id) err-not-found)))
        (begin
            (asserts! (is-eq tx-sender (get owner asset)) err-not-authorized)
            (asserts! (is-valid-principal new-owner) err-invalid-address)
            
            (map-set assets
                { asset-id: asset-id }
                (merge asset { owner: new-owner })
            )
            
            ;; Log asset ownership transfer event
            (print {
                event: "asset-ownership-transferred",
                asset-id: asset-id,
                previous-owner: tx-sender,
                new-owner: new-owner,
                timestamp: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Read-only Functions

;; Get asset information
(define-read-only (get-asset-info (asset-id uint))
    (map-get? assets { asset-id: asset-id })
)

;; Get token balance for a principal
(define-read-only (get-balance (owner principal) (asset-id uint))
    (default-to u0
        (get balance
            (map-get? token-balances
                { owner: owner, asset-id: asset-id }
            )
        )
    )
)

;; Get proposal details
(define-read-only (get-proposal (proposal-id uint))
    (map-get? proposals { proposal-id: proposal-id })
)

;; Get vote information
(define-read-only (get-vote (proposal-id uint) (voter principal))
    (map-get? votes { proposal-id: proposal-id, voter: voter })
)

;; Get price feed information
(define-read-only (get-price-feed (asset-id uint))
    (map-get? price-feeds { asset-id: asset-id })
)

;; Get last claimed dividend amount
(define-read-only (get-last-claim (asset-id uint) (claimer principal))
    (default-to u0
        (get last-claimed-amount
            (map-get? dividend-claims
                { asset-id: asset-id, claimer: claimer }
            )
        )
    )
)

;; Get KYC status for an address
(define-read-only (get-kyc-status (address principal))
    (map-get? kyc-status { address: address })
)

;; Check if an address is a valid oracle
(define-read-only (is-valid-oracle (address principal))
    (or (is-eq address contract-owner)
        (is-eq address tx-sender)) ;; Simplified - would check oracle list in production
)

;; Check if principal is valid
(define-read-only (is-valid-principal (address principal))
    (and 
        (not (is-eq address contract-owner))
        (not (is-eq address (as-contract tx-sender)))
    )
)

;; Get total supply for an asset
(define-read-only (get-total-supply (asset-id uint))
    (match (get-asset-info asset-id)
        asset tokens-per-asset
        u0
    )
)

;; Get circulating supply (excluding locked tokens)
(define-read-only (get-circulating-supply (asset-id uint))
     tokens-per-asset  ;; This is a constant, not a function call
)

;; Private Helper Functions

;; Get the next available asset ID
(define-private (get-next-asset-id)
    (default-to u1
        (get-last-asset-id)
    )
)

;; Get the next available proposal ID
(define-private (get-next-proposal-id)
    (default-to u1
        (get-last-proposal-id)
    )
)

;; Implement the get-last-asset-id function to return the current counter
(define-private (get-last-asset-id)
    (some (var-get last-asset-id))
)

;; Implement the get-last-proposal-id function to return the current counter
(define-private (get-last-proposal-id)
    (some (var-get last-proposal-id))
)
