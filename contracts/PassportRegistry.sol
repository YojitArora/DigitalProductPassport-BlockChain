// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PassportRegistry
 * @author Digital Product Passport Team
 * @notice Canonical registry smart contract for the Blockchain-Based Digital Product Passport System.
 * @dev Sprint 1, 2, 3, 4 & 5: Authorization, Role Management, Product Registration, Two-Step Ownership Transfer,
 *      Service / Maintenance Lifecycle, Dynamic Warranty Activation, and Theft / Recovery Lifecycle.
 *      Follows PROJECT_SPEC_v2.md specifications, pull-payment / commit-reveal patterns, and event-driven architecture.
 */
contract PassportRegistry {
    /* ================================================================ */
    /* 1. STATE VARIABLES, STRUCTS & CONSTANTS                           */
    /* ================================================================ */

    /// @notice Maximum allowed byte length for registered organization names (Manufacturer / Service Center)
    uint256 public constant MAX_NAME_LENGTH = 128;

    /// @notice Maximum allowed byte length for product name
    uint256 public constant MAX_PRODUCT_NAME_LENGTH = 128;

    /// @notice Maximum allowed byte length for brand name
    uint256 public constant MAX_BRAND_LENGTH = 64;

    /// @notice Maximum allowed byte length for product category
    uint256 public constant MAX_CATEGORY_LENGTH = 64;

    /// @notice Maximum allowed byte length for model number
    uint256 public constant MAX_MODEL_NUMBER_LENGTH = 64;

    /// @notice Maximum allowed byte length for manufacturer serial number
    uint256 public constant MAX_SERIAL_NUMBER_LENGTH = 64;

    /// @notice Maximum allowed byte length for service / repair record description
    uint256 public constant MAX_REPAIR_DESCRIPTION_LENGTH = 256;

    /**
     * @notice Representation of an authorized product manufacturer entity.
     * @dev Packed for EVM storage: Slot 0 (walletAddress + approved = 21 bytes), Slot 1 (registeredAt), Slot 2 (name).
     * @param walletAddress The Ethereum wallet address of the manufacturer
     * @param approved Whitelist approval status for product minting and warranty activation
     * @param registeredAt Block timestamp when the manufacturer was first registered
     * @param name Registered commercial/brand name of the manufacturer (max 128 bytes)
     */
    struct Manufacturer {
        address walletAddress;
        bool approved;
        uint256 registeredAt;
        string name;
    }

    /**
     * @notice Representation of an authorized repair and maintenance service center entity.
     * @dev Packed for EVM storage: Slot 0 (walletAddress + approved = 21 bytes), Slot 1 (registeredAt), Slot 2 (name).
     * @param walletAddress The Ethereum wallet address of the service center
     * @param approved Whitelist approval status for logging authenticated repair records
     * @param registeredAt Block timestamp when the service center was first registered
     * @param name Registered commercial name of the service center (max 128 bytes)
     */
    struct ServiceCenter {
        address walletAddress;
        bool approved;
        uint256 registeredAt;
        string name;
    }

    /**
     * @notice Representation of dynamic product warranty period.
     * @dev Computed dynamically against `block.timestamp` without storing an active boolean flag.
     *      Warranty duration is measured in whole days (converted to seconds via `durationDays * 1 days`).
     *      `startTimestamp` and `endTimestamp` are canonical Unix epoch timestamps in seconds.
     * @param startTimestamp Unix timestamp when warranty became active (0 if unactivated)
     * @param endTimestamp Unix timestamp when warranty expires (0 if unactivated)
     */
    struct Warranty {
        uint256 startTimestamp;
        uint256 endTimestamp;
    }

    /**
     * @notice Representation of an active two-step ownership transfer request.
     * @dev Stored per product; cleared upon acceptance or cancellation.
     *      `requestedAt` exists in contract storage ONLY while the transfer is active/pending.
     *      Historical transfer records and ownership provenance are intentionally event-driven
     *      and must be reconstructed by indexers from `OwnershipTransferRequested`,
     *      `OwnershipTransferAccepted`, and `OwnershipTransferCancelled` events.
     * @param to Ethereum address of the intended recipient
     * @param requestedAt Block timestamp when the transfer was initiated (ephemeral on-chain state)
     * @param exists Flag indicating whether a pending transfer is currently active
     */
    struct PendingTransfer {
        address to;
        uint256 requestedAt;
        bool exists;
    }

    /**
     * @notice Ephemeral representation of an authenticated repair/maintenance log entry.
     * @dev History of repairs is intentionally event-driven via `RepairAdded` events; no arrays stored on-chain.
     * @param serviceCenter Ethereum wallet address of the authorized service center that logged the repair
     * @param description Detailed log description of the service/repair performed (max 256 bytes)
     * @param timestamp Unix block timestamp when the repair was recorded
     */
    struct RepairRecord {
        address serviceCenter;
        string description;
        uint256 timestamp;
    }

    /**
     * @notice Comprehensive on-chain Digital Product Passport entity.
     * @dev Stores current state only; history and audit trails are reconstructed from blockchain events.
     *      Storage Slot Layout Analysis:
     *      - Slot 0: `passportId` (32 bytes / uint256)
     *      - Slot 1: `manufacturer` (20 bytes)
     *      - Slot 2: `currentOwner` (20 bytes) + `status` (1 byte enum) + `previousOperationalStatus` (1 byte enum) = 22 bytes (packed together)
     *      - Slot 3: `currentServiceCenter` (20 bytes)
     *      - Slot 4: `manufactureDate` (32 bytes / uint256 timestamp)
     *      - Slot 5: `createdAt` (32 bytes / uint256 timestamp)
     *      - Slot 6: `repairCount` (32 bytes / uint256)
     *      - Slot 7: `lastRepairTimestamp` (32 bytes / uint256)
     *      - Slot 8: `warranty.startTimestamp` (32 bytes / uint256)
     *      - Slot 9: `warranty.endTimestamp` (32 bytes / uint256)
     *      - Slot 10: `pendingTransfer.to` (20 bytes) + `pendingTransfer.exists` (1 byte) = 21 bytes (packed)
     *      - Slot 11: `pendingTransfer.requestedAt` (32 bytes / uint256)
     *      - Slots 12-16: Dynamic strings (`productName`, `brand`, `category`, `modelNumber`, `serialNumber`),
     *        each reserving a full 32-byte slot for string length/pointer.
     * @param passportId Unique auto-incrementing platform identifier (starts at 1)
     * @param manufacturer Address of the authorized manufacturer who minted the passport
     * @param currentOwner Address of the current product owner
     * @param status Current lifecycle status of the physical product
     * @param previousOperationalStatus Previous operational status stored when transitioning to UnderService
     * @param currentServiceCenter Address of the authorized service center currently servicing the product (0x0 when not in service)
     * @param manufactureDate Unix timestamp of product manufacture
     * @param createdAt Unix timestamp when the passport was registered on-chain
     * @param repairCount Total count of completed authenticated service/repair sessions
     * @param lastRepairTimestamp Unix timestamp of the most recent completed repair session (0 if none)
     * @param warranty Warranty time window struct
     * @param pendingTransfer Current pending two-step ownership transfer struct
     * @param productName Full commercial product name
     * @param brand Brand / company label
     * @param category Product classification category
     * @param modelNumber Manufacturer model identifier
     * @param serialNumber Manufacturer physical serial number
     */
    struct Product {
        uint256 passportId;
        address manufacturer;
        address currentOwner;
        ProductStatus status;
        ProductStatus previousOperationalStatus;
        address currentServiceCenter;
        uint256 manufactureDate;
        uint256 createdAt;
        uint256 repairCount;
        uint256 lastRepairTimestamp;
        Warranty warranty;
        PendingTransfer pendingTransfer;
        string productName;
        string brand;
        string category;
        string modelNumber;
        string serialNumber;
    }

    /// @dev Internal mapping tracking platform admin privileges (address => bool)
    mapping(address => bool) private admins;

    /// @dev Internal mapping from manufacturer wallet address to Manufacturer storage entity
    mapping(address => Manufacturer) private manufacturers;

    /// @dev Internal mapping from service center wallet address to ServiceCenter storage entity
    mapping(address => ServiceCenter) private serviceCenters;

    /// @dev Internal mapping from auto-incrementing Passport ID to Product entity
    mapping(uint256 => Product) private products;

    /// @dev Internal mapping preventing duplicate (manufacturer address + serialNumber) registration
    mapping(bytes32 => bool) private registeredSerialNumbers;

    /// @dev Auto-incrementing Passport ID counter initialized at 1
    uint256 private _nextPassportId;

    /* ================================================================ */
    /* 2. ENUMS                                                         */
    /* ================================================================ */

    /**
     * @notice Lifecycle status state machine for a physical product.
     * @param Active Normal operational state
     * @param UnderService Product is currently undergoing authorized repair/maintenance
     * @param ReportedStolen Product reported stolen by owner or admin
     * @param Recovered Product recovered from previous theft incident
     */
    enum ProductStatus {
        Active,
        UnderService,
        ReportedStolen,
        Recovered
    }

    /* ================================================================ */
    /* 3. EVENTS                                                        */
    /* ================================================================ */

    /**
     * @notice Emitted when platform operator privileges are granted to an address.
     * @param newAdmin The wallet address receiving admin privileges (indexed for log filtering)
     * @param addedBy The wallet address of the admin who granted the privileges (indexed for log filtering)
     * @param timestamp The block timestamp when admin privileges were granted
     */
    event AdminAdded(address indexed newAdmin, address indexed addedBy, uint256 timestamp);

    /**
     * @notice Emitted when a manufacturer is registered and authorized on-chain.
     * @param manufacturer The wallet address of the registered manufacturer (indexed for log filtering)
     * @param name Commercial brand name of the manufacturer
     * @param timestamp The block timestamp when registered
     */
    event ManufacturerRegistered(address indexed manufacturer, string name, uint256 timestamp);

    /**
     * @notice Emitted when an approved manufacturer's write authorization is revoked.
     * @param manufacturer The wallet address of the revoked manufacturer (indexed for log filtering)
     * @param timestamp The block timestamp when revoked
     */
    event ManufacturerRevoked(address indexed manufacturer, uint256 timestamp);

    /**
     * @notice Emitted when an authorized service center is registered on-chain.
     * @param serviceCenter The wallet address of the registered service center (indexed for log filtering)
     * @param name Commercial name of the service center
     * @param timestamp The block timestamp when registered
     */
    event ServiceCenterRegistered(address indexed serviceCenter, string name, uint256 timestamp);

    /**
     * @notice Emitted when an approved service center's write authorization is revoked.
     * @param serviceCenter The wallet address of the revoked service center (indexed for log filtering)
     * @param timestamp The block timestamp when revoked
     */
    event ServiceCenterRevoked(address indexed serviceCenter, uint256 timestamp);

    /**
     * @notice Emitted when a new Digital Product Passport is minted and registered on-chain.
     * @dev Exposes rich metadata for event-driven timelines and decentralized verification dashboards.
     * @param passportId The unique auto-incrementing platform ID assigned to the product (indexed)
     * @param manufacturer The wallet address of the manufacturer who minted the passport (indexed)
     * @param initialOwner The wallet address of the initial product owner (indexed)
     * @param serialNumber The manufacturer physical serial number
     * @param productName Full commercial product name
     * @param timestamp The block timestamp when the product was registered
     */
    event ProductRegistered(
        uint256 indexed passportId,
        address indexed manufacturer,
        address indexed initialOwner,
        string serialNumber,
        string productName,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a product's warranty is activated on-chain by its registering manufacturer.
     * @dev Serves as part of the immutable Digital Product Passport lifecycle audit trail.
     *      Warranty activation timestamps and duration are recorded permanently in the event log.
     * @param passportId The unique platform ID of the product (indexed for log filtering)
     * @param manufacturer The wallet address of the manufacturer activating the warranty (indexed for log filtering)
     * @param startTimestamp The block timestamp when warranty became active
     * @param endTimestamp The computed expiration timestamp of the warranty
     */
    event WarrantyActivated(
        uint256 indexed passportId,
        address indexed manufacturer,
        uint256 startTimestamp,
        uint256 endTimestamp
    );

    /**
     * @notice Emitted when a product is reported stolen by its owner.
     * @dev Serves as part of the immutable Digital Product Passport lifecycle audit trail.
     *      Records the timestamp of theft report and blocks unauthorized ownership transfers and servicing.
     * @param passportId The unique platform ID of the product (indexed for log filtering)
     * @param reportedBy The wallet address of the owner reporting theft (indexed for log filtering)
     * @param timestamp The block timestamp when theft was reported
     */
    event ProductReportedStolen(
        uint256 indexed passportId,
        address indexed reportedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a previously stolen product is reported recovered by its owner.
     * @dev Serves as part of the immutable Digital Product Passport lifecycle audit trail.
     *      Records the restoration of operational capabilities while preserving permanent theft history.
     * @param passportId The unique platform ID of the product (indexed for log filtering)
     * @param recoveredBy The wallet address of the owner reporting recovery (indexed for log filtering)
     * @param timestamp The block timestamp when recovery was reported
     */
    event ProductRecovered(
        uint256 indexed passportId,
        address indexed recoveredBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a product owner initiates a two-step ownership transfer to a new recipient.
     * @dev Serves as part of the immutable on-chain audit trail for ownership history.
     *      All historical transfer timelines and provenance are intentionally reconstructed from events.
     * @param passportId The unique platform ID of the product (indexed for log filtering)
     * @param from The current owner initiating the transfer (indexed for log filtering)
     * @param to The designated recipient address (indexed for log filtering)
     * @param timestamp The block timestamp when the transfer was requested
     */
    event OwnershipTransferRequested(
        uint256 indexed passportId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a designated recipient accepts an ownership transfer, completing the transfer.
     * @dev Serves as the canonical immutable event recording the change of legal product ownership.
     *      Ownership history is intentionally event-driven and not retained in contract storage arrays.
     * @param passportId The unique platform ID of the product (indexed for log filtering)
     * @param from The previous owner address (indexed for log filtering)
     * @param to The new owner address (indexed for log filtering)
     * @param timestamp The block timestamp when the transfer was accepted
     */
    event OwnershipTransferAccepted(
        uint256 indexed passportId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an in-flight ownership transfer is cancelled by the current owner.
     * @dev Serves as part of the immutable event audit trail recording revoked or aborted transfers.
     * @param passportId The unique platform ID of the product (indexed for log filtering)
     * @param from The current owner who cancelled the transfer (indexed for log filtering)
     * @param to The recipient address whose pending transfer was revoked (indexed for log filtering)
     * @param timestamp The block timestamp when the transfer was cancelled
     */
    event OwnershipTransferCancelled(
        uint256 indexed passportId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an authorized service center begins a maintenance/repair session.
     * @param passportId The unique platform ID of the product (indexed)
     * @param serviceCenter The wallet address of the authorized service center (indexed)
     * @param timestamp The block timestamp when service started
     */
    event ServiceStarted(
        uint256 indexed passportId,
        address indexed serviceCenter,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a verified maintenance or repair record is added to a product passport.
     * @dev Primary event used to reconstruct full product repair history and provenance off-chain.
     *      `repairNumber` is a monotonically increasing repair sequence generated from `repairCount`.
     *      Historical repair order, full timelines, and descriptions are intentionally event-driven
     *      and reconstructed from `RepairAdded` events rather than contract storage arrays.
     * @param passportId The unique platform ID of the product (indexed)
     * @param serviceCenter The wallet address of the service center that logged the repair (indexed)
     * @param description Detailed log description of the service performed
     * @param repairNumber Monotonically increasing sequential repair sequence index for this product passport
     * @param timestamp The block timestamp when the repair was recorded
     */
    event RepairAdded(
        uint256 indexed passportId,
        address indexed serviceCenter,
        string description,
        uint256 repairNumber,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a maintenance/repair session is successfully completed.
     * @param passportId The unique platform ID of the product (indexed)
     * @param serviceCenter The wallet address of the authorized service center (indexed)
     * @param timestamp The block timestamp when service was completed
     */
    event ServiceCompleted(
        uint256 indexed passportId,
        address indexed serviceCenter,
        uint256 timestamp
    );

    /* ================================================================ */
    /* 4. CUSTOM ERRORS                                                 */
    /* ================================================================ */

    /// @notice Reverted when an unauthorized caller attempts a restricted operation.
    error Unauthorized();

    /// @notice Reverted when an address parameter is zero address (0x0).
    error ZeroAddress();

    /// @notice Reverted when attempting to add an admin who already holds admin privileges.
    /// @param admin The address that is already an admin
    error AdminAlreadyExists(address admin);

    /// @notice Reverted when attempting to register a manufacturer that is already actively approved.
    /// @param manufacturer The address of the existing manufacturer
    error ManufacturerAlreadyExists(address manufacturer);

    /// @notice Reverted when an operation targets a manufacturer address that was never registered.
    /// @param manufacturer The non-existent manufacturer address
    error ManufacturerNotFound(address manufacturer);

    /// @notice Reverted when attempting to revoke a manufacturer that is already revoked.
    /// @param manufacturer The already revoked manufacturer address
    error ManufacturerAlreadyRevoked(address manufacturer);

    /// @notice Reverted when attempting to register a service center that is already actively approved.
    /// @param serviceCenter The address of the existing service center
    error ServiceCenterAlreadyExists(address serviceCenter);

    /// @notice Reverted when an operation targets a service center address that was never registered.
    /// @param serviceCenter The non-existent service center address
    error ServiceCenterNotFound(address serviceCenter);

    /// @notice Reverted when attempting to revoke a service center that is already revoked.
    /// @param serviceCenter The already revoked service center address
    error ServiceCenterAlreadyRevoked(address serviceCenter);

    /// @notice Reverted when querying or operating on a Passport ID that does not exist.
    /// @param passportId The non-existent passport ID
    error PassportNotFound(uint256 passportId);

    /// @notice Reverted when attempting to register a duplicate serial number for the same manufacturer.
    /// @param manufacturer The manufacturer address
    /// @param serialNumber The duplicate serial number
    error DuplicateSerialNumber(address manufacturer, string serialNumber);

    /// @notice Reverted when manufacture date is zero or in the future.
    /// @param manufactureDate The invalid manufacture date timestamp
    error InvalidManufactureDate(uint256 manufactureDate);

    /// @notice Reverted when a required string parameter is empty (0 bytes).
    /// @param fieldName The name of the empty input field
    error EmptyString(string fieldName);

    /// @notice Reverted when a string parameter exceeds its defined maximum byte length limit.
    /// @param fieldName The name of the input field exceeding the limit
    /// @param maxLength The maximum allowed byte length for this field
    error StringTooLong(string fieldName, uint256 maxLength);

    /// @notice Reverted when a product owner attempts to transfer ownership to their own address.
    error TransferToSelf();

    /// @notice Reverted when an ownership transfer is initiated while another transfer is already pending.
    /// @param passportId The numeric Passport ID
    error TransferAlreadyPending(uint256 passportId);

    /// @notice Reverted when attempting to accept or cancel a transfer on a passport with no pending transfer.
    /// @param passportId The numeric Passport ID
    error NoPendingTransfer(uint256 passportId);

    /// @notice Reverted when a caller other than the designated recipient attempts to accept a pending transfer.
    /// @param passportId The numeric Passport ID
    /// @param caller The unauthorized caller address
    error NotPendingRecipient(uint256 passportId, address caller);

    /// @notice Reverted when attempting to start service on a product that is already in UnderService status.
    /// @param passportId The numeric Passport ID
    error AlreadyUnderService(uint256 passportId);

    /// @notice Reverted when attempting to complete service on a product that is not currently in UnderService status.
    /// @param passportId The numeric Passport ID
    error NotUnderService(uint256 passportId);

    /// @notice Reverted when an approved service center attempts to complete service started by a different service center.
    /// @param passportId The numeric Passport ID
    error NotCurrentServiceCenter(uint256 passportId);

    /// @notice Reverted when attempting to activate warranty on a product that already has an active or expired warranty.
    /// @param passportId The numeric Passport ID
    error WarrantyAlreadyActivated(uint256 passportId);

    /// @notice Reverted when attempting to activate warranty with 0 duration days.
    error InvalidWarrantyDuration();

    /// @notice Reverted when an unauthorized manufacturer attempts an action on a product they did not register.
    /// @param passportId The numeric Passport ID
    /// @param caller The unauthorized manufacturer address
    error NotProductManufacturer(uint256 passportId, address caller);

    /// @notice Reverted when attempting to report a product stolen that is already in ReportedStolen status.
    /// @param passportId The numeric Passport ID
    error AlreadyReportedStolen(uint256 passportId);

    /// @notice Reverted when attempting to report a product recovered that is not in ReportedStolen status.
    /// @param passportId The numeric Passport ID
    error ProductNotReportedStolen(uint256 passportId);

    /* ================================================================ */
    /* 5. MODIFIERS (ACCESS CONTROL)                                    */
    /* ================================================================ */

    /**
     * @notice Restricts function execution to registered platform admins only.
     * @dev Reverts with `Unauthorized()` if `msg.sender` is not an active admin.
     */
    modifier onlyAdmin() {
        if (!admins[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Restricts function execution to actively approved manufacturers only.
     * @dev Reverts with `Unauthorized()` if `msg.sender` is not an approved manufacturer.
     */
    modifier onlyApprovedManufacturer() {
        if (!manufacturers[msg.sender].approved) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Alias for `onlyApprovedManufacturer` modifier.
     * @dev Reverts with `Unauthorized()` if `msg.sender` is not an approved manufacturer.
     */
    modifier onlyManufacturer() {
        if (!manufacturers[msg.sender].approved) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Restricts function execution to the authorized manufacturer that originally registered the product passport.
     * @dev Reverts with `NotProductManufacturer(passportId, msg.sender)` if caller is not the registering manufacturer.
     * @param passportId The numeric Passport ID.
     */
    modifier onlyProductManufacturer(uint256 passportId) {
        Product storage product = _getValidatedProduct(passportId);
        if (msg.sender != product.manufacturer) {
            revert NotProductManufacturer(passportId, msg.sender);
        }
        _;
    }

    /**
     * @notice Restricts function execution to actively approved service centers only.
     * @dev Reverts with `Unauthorized()` if `msg.sender` is not an approved service center.
     */
    modifier onlyApprovedServiceCenter() {
        if (!serviceCenters[msg.sender].approved) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Alias for `onlyApprovedServiceCenter` modifier.
     * @dev Reverts with `Unauthorized()` if `msg.sender` is not an approved service center.
     */
    modifier onlyServiceCenter() {
        if (!serviceCenters[msg.sender].approved) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Restricts function execution to the registered current owner of a product passport.
     * @dev Reverts with `Unauthorized()` if `msg.sender` is not the current owner.
     * @param passportId The numeric Passport ID to check.
     */
    modifier onlyProductOwner(uint256 passportId) {
        if (msg.sender != _getValidatedProduct(passportId).currentOwner) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Restricts function execution when a product is flagged as ReportedStolen.
     * @dev Reverts with `AlreadyReportedStolen(passportId)` if status is `ReportedStolen`.
     * @param passportId The numeric Passport ID to check.
     */
    modifier notReportedStolen(uint256 passportId) {
        if (_getValidatedProduct(passportId).status == ProductStatus.ReportedStolen) {
            revert AlreadyReportedStolen(passportId);
        }
        _;
    }

    /**
     * @notice Validates that a passport with the specified ID exists and has been registered.
     * @dev Reverts with `PassportNotFound(passportId)` if the passport does not exist.
     * @param passportId The ID to validate
     */
    modifier requirePassportExists(uint256 passportId) {
        _getValidatedProduct(passportId);
        _;
    }

    /* ================================================================ */
    /* 6. CONSTRUCTOR & ADMIN FUNCTIONS                                 */
    /* ================================================================ */

    /**
     * @notice Initializes the PassportRegistry, designates contract deployer as initial admin, and initializes passport counter.
     * @dev Initializes `_nextPassportId` to 1. Emits `AdminAdded` event for the initial admin.
     */
    constructor() {
        admins[msg.sender] = true;
        _nextPassportId = 1;
        emit AdminAdded(msg.sender, address(0), block.timestamp);
    }

    /**
     * @notice Grants platform admin privileges to a new address.
     * @dev Only existing platform admins can invoke this function.
     * @param newAdmin The Ethereum wallet address receiving platform admin privileges.
     */
    function addAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) {
            revert ZeroAddress();
        }
        if (admins[newAdmin]) {
            revert AdminAlreadyExists(newAdmin);
        }

        admins[newAdmin] = true;
        emit AdminAdded(newAdmin, msg.sender, block.timestamp);
    }

    /**
     * @notice Registers a new manufacturer or re-authorizes a previously revoked manufacturer.
     * @dev Only platform admins can invoke this function. Preserves initial `registeredAt` on re-authorization.
     * @param manufacturer The Ethereum wallet address of the manufacturer.
     * @param name Commercial / brand name of the manufacturer (1 to 128 bytes).
     */
    function registerManufacturer(address manufacturer, string calldata name) external onlyAdmin {
        if (manufacturer == address(0)) {
            revert ZeroAddress();
        }
        _validateStringField(name, "name", MAX_NAME_LENGTH);
        if (manufacturers[manufacturer].approved) {
            revert ManufacturerAlreadyExists(manufacturer);
        }

        uint256 registeredAt = manufacturers[manufacturer].registeredAt;
        if (registeredAt == 0) {
            registeredAt = block.timestamp;
        }

        manufacturers[manufacturer] = Manufacturer({
            walletAddress: manufacturer,
            approved: true,
            registeredAt: registeredAt,
            name: name
        });

        emit ManufacturerRegistered(manufacturer, name, block.timestamp);
    }

    /**
     * @notice Revokes write authorization for an actively approved manufacturer.
     * @dev Only platform admins can invoke this function. Preserves historical records while blocking future writes.
     * @param manufacturer The Ethereum wallet address of the manufacturer to revoke.
     */
    function revokeManufacturer(address manufacturer) external onlyAdmin {
        if (manufacturer == address(0)) {
            revert ZeroAddress();
        }
        if (manufacturers[manufacturer].registeredAt == 0) {
            revert ManufacturerNotFound(manufacturer);
        }
        if (!manufacturers[manufacturer].approved) {
            revert ManufacturerAlreadyRevoked(manufacturer);
        }

        manufacturers[manufacturer].approved = false;
        emit ManufacturerRevoked(manufacturer, block.timestamp);
    }

    /**
     * @notice Registers a new authorized service center or re-authorizes a previously revoked service center.
     * @dev Only platform admins can invoke this function. Preserves initial `registeredAt` on re-authorization.
     * @param serviceCenter The Ethereum wallet address of the service center.
     * @param name Commercial name of the service center (1 to 128 bytes).
     */
    function registerServiceCenter(address serviceCenter, string calldata name) external onlyAdmin {
        if (serviceCenter == address(0)) {
            revert ZeroAddress();
        }
        _validateStringField(name, "name", MAX_NAME_LENGTH);
        if (serviceCenters[serviceCenter].approved) {
            revert ServiceCenterAlreadyExists(serviceCenter);
        }

        uint256 registeredAt = serviceCenters[serviceCenter].registeredAt;
        if (registeredAt == 0) {
            registeredAt = block.timestamp;
        }

        serviceCenters[serviceCenter] = ServiceCenter({
            walletAddress: serviceCenter,
            approved: true,
            registeredAt: registeredAt,
            name: name
        });

        emit ServiceCenterRegistered(serviceCenter, name, block.timestamp);
    }

    /**
     * @notice Revokes write authorization for an actively approved service center.
     * @dev Only platform admins can invoke this function. Preserves historical records while blocking future writes.
     * @param serviceCenter The Ethereum wallet address of the service center to revoke.
     */
    function revokeServiceCenter(address serviceCenter) external onlyAdmin {
        if (serviceCenter == address(0)) {
            revert ZeroAddress();
        }
        if (serviceCenters[serviceCenter].registeredAt == 0) {
            revert ServiceCenterNotFound(serviceCenter);
        }
        if (!serviceCenters[serviceCenter].approved) {
            revert ServiceCenterAlreadyRevoked(serviceCenter);
        }

        serviceCenters[serviceCenter].approved = false;
        emit ServiceCenterRevoked(serviceCenter, block.timestamp);
    }

    /* ================================================================ */
    /* 7. MANUFACTURER FUNCTIONS                                         */
    /* ================================================================ */

    /**
     * @notice Mints and registers a new Digital Product Passport on-chain.
     * @dev Restricts execution to approved manufacturers. Generates an auto-incrementing Passport ID.
     *      Enforces uniqueness on (msg.sender, serialNumber).
     * @param initialOwner Wallet address of the initial product owner (cannot be address(0)).
     * @param productName Commercial name of the product (1 to 128 bytes).
     * @param brand Brand label or manufacturer brand identifier (1 to 64 bytes).
     * @param category Classification category of the product (1 to 64 bytes).
     * @param modelNumber Model code or reference number (1 to 64 bytes).
     * @param serialNumber Physical serial number unique to the manufacturer (1 to 64 bytes).
     * @param manufactureDate Unix timestamp of manufacturing (must be > 0 and <= block.timestamp).
     * @return passportId The newly allocated unique Passport ID.
     */
    function registerProduct(
        address initialOwner,
        string calldata productName,
        string calldata brand,
        string calldata category,
        string calldata modelNumber,
        string calldata serialNumber,
        uint256 manufactureDate
    ) external onlyApprovedManufacturer returns (uint256 passportId) {
        if (initialOwner == address(0)) {
            revert ZeroAddress();
        }
        _validateStringField(productName, "productName", MAX_PRODUCT_NAME_LENGTH);
        _validateStringField(brand, "brand", MAX_BRAND_LENGTH);
        _validateStringField(category, "category", MAX_CATEGORY_LENGTH);
        _validateStringField(modelNumber, "modelNumber", MAX_MODEL_NUMBER_LENGTH);
        _validateStringField(serialNumber, "serialNumber", MAX_SERIAL_NUMBER_LENGTH);

        if (manufactureDate == 0 || manufactureDate > block.timestamp) {
            revert InvalidManufactureDate(manufactureDate);
        }

        bytes32 serialHash = keccak256(abi.encodePacked(msg.sender, serialNumber));
        if (registeredSerialNumbers[serialHash]) {
            revert DuplicateSerialNumber(msg.sender, serialNumber);
        }
        registeredSerialNumbers[serialHash] = true;

        passportId = _nextPassportId++;

        Product storage p = products[passportId];
        p.passportId = passportId;
        p.manufacturer = msg.sender;
        p.currentOwner = initialOwner;
        _updateProductStatus(p, ProductStatus.Active);
        p.previousOperationalStatus = ProductStatus.Active;
        p.manufactureDate = manufactureDate;
        p.createdAt = block.timestamp;
        p.productName = productName;
        p.brand = brand;
        p.category = category;
        p.modelNumber = modelNumber;
        p.serialNumber = serialNumber;

        emit ProductRegistered(
            passportId,
            msg.sender,
            initialOwner,
            serialNumber,
            productName,
            block.timestamp
        );
    }

    /**
     * @notice Activates product warranty for a specified duration in whole days.
     * @dev Restricts execution to the approved manufacturer that originally registered the product. Can only be activated once.
     *      Duration is specified in whole days and converted to Unix timestamp bounds (`durationDays * 1 days`).
     *      Warranty validity is evaluated dynamically through `isWarrantyActive()` without storing an on-chain boolean flag.
     * @param passportId The unique platform ID of the product passport.
     * @param durationDays Warranty duration in whole days (must be > 0).
     */
    function activateWarranty(uint256 passportId, uint256 durationDays)
        external
        onlyApprovedManufacturer
        onlyProductManufacturer(passportId)
    {
        Product storage product = _getValidatedProduct(passportId);

        if (product.warranty.endTimestamp > 0) {
            revert WarrantyAlreadyActivated(passportId);
        }
        if (durationDays == 0) {
            revert InvalidWarrantyDuration();
        }

        uint256 startTimestamp = block.timestamp;
        uint256 endTimestamp = block.timestamp + (durationDays * 1 days);

        product.warranty.startTimestamp = startTimestamp;
        product.warranty.endTimestamp = endTimestamp;

        emit WarrantyActivated(passportId, msg.sender, startTimestamp, endTimestamp);
    }

    /* ================================================================ */
    /* 8. SERVICE CENTER FUNCTIONS                                      */
    /* ================================================================ */

    /**
     * @notice Initiates a maintenance or repair service lifecycle for a physical product passport.
     * @dev Restricts execution to approved service centers. Saves previous operational status, tracks current service center, and sets status to UnderService.
     * @param passportId The unique platform ID of the product passport.
     */
    function startService(uint256 passportId)
        external
        onlyApprovedServiceCenter
        notReportedStolen(passportId)
    {
        Product storage product = _getValidatedProduct(passportId);

        if (product.status == ProductStatus.UnderService) {
            revert AlreadyUnderService(passportId);
        }

        product.previousOperationalStatus = product.status;
        _updateProductStatus(product, ProductStatus.UnderService);
        product.currentServiceCenter = msg.sender;

        emit ServiceStarted(passportId, msg.sender, block.timestamp);
    }

    /**
     * @notice Completes an active service session, logs repair event metadata, and restores operational status.
     * @dev Restricts execution to the specific approved service center that started the active service session. Increments repair count and records timestamp.
     * @param passportId The unique platform ID of the product passport.
     * @param description Detailed log description of the service/repair performed (1 to 256 bytes).
     */
    function completeService(uint256 passportId, string calldata description)
        external
        onlyApprovedServiceCenter
    {
        Product storage product = _getValidatedProduct(passportId);
        _validateActiveServiceCenter(product, passportId);

        _validateStringField(description, "description", MAX_REPAIR_DESCRIPTION_LENGTH);

        _updateProductStatus(product, product.previousOperationalStatus);
        product.currentServiceCenter = address(0);
        product.repairCount++;
        product.lastRepairTimestamp = block.timestamp;

        emit RepairAdded(
            passportId,
            msg.sender,
            description,
            product.repairCount,
            block.timestamp
        );

        emit ServiceCompleted(passportId, msg.sender, block.timestamp);
    }

    /* ================================================================ */
    /* 9. OWNER FUNCTIONS                                               */
    /* ================================================================ */

    /**
     * @notice Initiates a two-step ownership transfer to a designated recipient address.
     * @dev Restricts caller to current owner. Enforces recipient validation, no active transfer, and product not stolen.
     * @param passportId The unique platform ID of the product.
     * @param recipient The Ethereum wallet address of the designated new owner.
     */
    function initiateTransfer(uint256 passportId, address recipient)
        external
        onlyProductOwner(passportId)
        notReportedStolen(passportId)
    {
        if (recipient == address(0)) {
            revert ZeroAddress();
        }
        if (recipient == msg.sender) {
            revert TransferToSelf();
        }

        Product storage product = _getValidatedProduct(passportId);
        if (product.pendingTransfer.exists) {
            revert TransferAlreadyPending(passportId);
        }

        product.pendingTransfer = PendingTransfer({
            to: recipient,
            requestedAt: block.timestamp,
            exists: true
        });

        emit OwnershipTransferRequested(passportId, msg.sender, recipient, block.timestamp);
    }

    /**
     * @notice Accepts a pending ownership transfer, making the caller the new legal current owner.
     * @dev Restricts caller to the designated pending recipient. Clears pending transfer and updates owner.
     * @param passportId The unique platform ID of the product.
     */
    function acceptTransfer(uint256 passportId) external {
        Product storage product = _getValidatedProduct(passportId);
        PendingTransfer storage pending = _requirePendingTransfer(product, passportId);

        if (msg.sender != pending.to) {
            revert NotPendingRecipient(passportId, msg.sender);
        }

        address previousOwner = product.currentOwner;
        product.currentOwner = msg.sender;
        delete product.pendingTransfer;

        emit OwnershipTransferAccepted(passportId, previousOwner, msg.sender, block.timestamp);
    }

    /**
     * @notice Cancels an active pending ownership transfer before it has been accepted.
     * @dev Restricts caller to the current product owner. Clears pending transfer.
     * @param passportId The unique platform ID of the product.
     */
    function cancelTransfer(uint256 passportId)
        external
        onlyProductOwner(passportId)
    {
        Product storage product = _getValidatedProduct(passportId);
        PendingTransfer storage pending = _requirePendingTransfer(product, passportId);

        address recipient = pending.to;
        delete product.pendingTransfer;

        emit OwnershipTransferCancelled(passportId, msg.sender, recipient, block.timestamp);
    }

    /**
     * @notice Reports a physical product passport as stolen.
     * @dev Restricts execution to current product owner. Blocks future transfers and servicing until recovered.
     * @param passportId The unique platform ID of the product passport.
     */
    function reportStolen(uint256 passportId)
        external
        onlyProductOwner(passportId)
    {
        Product storage product = _getValidatedProduct(passportId);

        if (product.status == ProductStatus.ReportedStolen) {
            revert AlreadyReportedStolen(passportId);
        }

        _updateProductStatus(product, ProductStatus.ReportedStolen);

        emit ProductReportedStolen(passportId, msg.sender, block.timestamp);
    }

    /**
     * @notice Reports a previously stolen product as recovered.
     * @dev Restricts execution to current product owner. Transitions status to Recovered (does NOT revert to Active).
     * @param passportId The unique platform ID of the product passport.
     */
    function reportRecovered(uint256 passportId)
        external
        onlyProductOwner(passportId)
    {
        Product storage product = _getValidatedProduct(passportId);

        if (product.status != ProductStatus.ReportedStolen) {
            revert ProductNotReportedStolen(passportId);
        }

        _updateProductStatus(product, ProductStatus.Recovered);

        emit ProductRecovered(passportId, msg.sender, block.timestamp);
    }

    /* ================================================================ */
    /* 10. PUBLIC VIEW FUNCTIONS                                        */
    /* ================================================================ */

    /**
     * @notice Queries whether an address holds platform admin privileges.
     * @dev Gas-free view call.
     * @param account The address to inspect.
     * @return True if the address has platform admin privileges, false otherwise.
     */
    function isAdmin(address account) external view returns (bool) {
        return admins[account];
    }

    /**
     * @notice Queries whether an address is an actively approved manufacturer.
     * @dev Gas-free view call.
     * @param account The address to inspect.
     * @return True if the manufacturer is actively approved, false otherwise.
     */
    function isApprovedManufacturer(address account) external view returns (bool) {
        return manufacturers[account].approved;
    }

    /**
     * @notice Queries whether an address is an actively approved service center.
     * @dev Gas-free view call.
     * @param account The address to inspect.
     * @return True if the service center is actively approved, false otherwise.
     */
    function isApprovedServiceCenter(address account) external view returns (bool) {
        return serviceCenters[account].approved;
    }

    /**
     * @notice Retrieves the full registered Manufacturer entity for a given address.
     * @dev Gas-free view call.
     * @param account The manufacturer wallet address to query.
     * @return Manufacturer struct containing walletAddress, approved status, registeredAt timestamp, and name.
     */
    function getManufacturer(address account) external view returns (Manufacturer memory) {
        return manufacturers[account];
    }

    /**
     * @notice Retrieves the full registered ServiceCenter entity for a given address.
     * @dev Gas-free view call.
     * @param account The service center wallet address to query.
     * @return ServiceCenter struct containing walletAddress, approved status, registeredAt timestamp, and name.
     */
    function getServiceCenter(address account) external view returns (ServiceCenter memory) {
        return serviceCenters[account];
    }

    /**
     * @notice Checks if a product passport exists for a given Passport ID.
     * @dev Gas-free view call.
     * @param passportId The ID to query.
     * @return True if the passport exists, false otherwise.
     */
    function passportExists(uint256 passportId) external view returns (bool) {
        return _passportExists(passportId);
    }

    /**
     * @notice Retrieves the full Product passport entity for a given Passport ID.
     * @dev Reverts with `PassportNotFound` if the passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return Product struct containing all product passport metadata and current status.
     */
    function getProduct(uint256 passportId) external view returns (Product memory) {
        return _getValidatedProduct(passportId);
    }

    /**
     * @notice Queries the current legal owner address of a passport.
     * @dev Reverts with `PassportNotFound` if the passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return The wallet address of the current owner.
     */
    function getCurrentOwner(uint256 passportId) external view returns (address) {
        return _getValidatedProduct(passportId).currentOwner;
    }

    /**
     * @notice Queries the current lifecycle status enum of a product.
     * @dev Reverts with `PassportNotFound` if the passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return ProductStatus enum value (Active, UnderService, ReportedStolen, Recovered).
     */
    function getProductStatus(uint256 passportId) external view returns (ProductStatus) {
        return _getValidatedProduct(passportId).status;
    }

    /**
     * @notice Retrieves the full Warranty window struct for a product passport.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return Warranty struct containing startTimestamp and endTimestamp.
     */
    function getWarranty(uint256 passportId) external view returns (Warranty memory) {
        return _getValidatedProduct(passportId).warranty;
    }

    /**
     * @notice Queries the exact warranty expiration timestamp for a product passport.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist. Returns 0 if warranty is unactivated.
     * @param passportId The numeric Passport ID.
     * @return Unix timestamp when warranty expires (0 if unactivated).
     */
    function getWarrantyEndTimestamp(uint256 passportId) external view returns (uint256) {
        return _getValidatedProduct(passportId).warranty.endTimestamp;
    }

    /**
     * @notice Computes whether the warranty for a product passport is currently valid and active.
     * @dev Dynamic calculation evaluated against `block.timestamp`. No stored boolean flag exists.
     *      Returns false if passport does not exist or has no warranty activated (`endTimestamp == 0`).
     * @param passportId The numeric Passport ID.
     * @return True if warranty is active as of the current block timestamp, false otherwise.
     */
    function isWarrantyActive(uint256 passportId) external view returns (bool) {
        if (!_passportExists(passportId)) {
            return false;
        }
        Warranty memory w = products[passportId].warranty;
        return w.endTimestamp > 0 && block.timestamp <= w.endTimestamp && (w.startTimestamp == 0 || block.timestamp >= w.startTimestamp);
    }

    /**
     * @notice Retrieves the current pending ownership transfer details for a product passport.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return PendingTransfer struct containing recipient address, request timestamp, and existence flag.
     */
    function getPendingTransfer(uint256 passportId) external view returns (PendingTransfer memory) {
        return _getValidatedProduct(passportId).pendingTransfer;
    }

    /**
     * @notice Checks whether a product passport currently has an active pending ownership transfer.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return True if a pending transfer is active, false otherwise.
     */
    function hasPendingTransfer(uint256 passportId) external view returns (bool) {
        return _getValidatedProduct(passportId).pendingTransfer.exists;
    }

    /**
     * @notice Queries the total number of authenticated repairs logged for a product passport.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return The total count of completed repairs.
     */
    function getRepairCount(uint256 passportId) external view returns (uint256) {
        return _getValidatedProduct(passportId).repairCount;
    }

    /**
     * @notice Queries the block timestamp of the most recent completed repair on a product passport.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist. Returns 0 if no repairs logged.
     * @param passportId The numeric Passport ID.
     * @return Unix timestamp of the last completed repair.
     */
    function getLastRepairTimestamp(uint256 passportId) external view returns (uint256) {
        return _getValidatedProduct(passportId).lastRepairTimestamp;
    }

    /**
     * @notice Queries whether a product passport is currently under active maintenance/service.
     * @dev Gas-free view call. Reverts with `PassportNotFound` if passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return True if product status is UnderService, false otherwise.
     */
    function isUnderService(uint256 passportId) external view returns (bool) {
        return _getValidatedProduct(passportId).status == ProductStatus.UnderService;
    }

    /**
     * @notice Returns the next Passport ID that will be assigned to a new product.
     * @dev Gas-free view call.
     * @return The next auto-incrementing Passport ID.
     */
    function getNextPassportId() external view returns (uint256) {
        return _nextPassportId;
    }

    /* ================================================================ */
    /* 11. INTERNAL/PRIVATE HELPER FUNCTIONS                            */
    /* ================================================================ */

    /**
     * @dev Internal helper to determine whether a passport ID has been minted.
     * @param passportId The numeric Passport ID to check.
     * @return True if the ID is within minted bounds and has a non-zero manufacturer address.
     */
    function _passportExists(uint256 passportId) internal view returns (bool) {
        return passportId > 0 && passportId < _nextPassportId && products[passportId].manufacturer != address(0);
    }

    /**
     * @dev Internal helper to retrieve a validated storage reference to a Product.
     *      Reverts with `PassportNotFound` if the passport does not exist.
     * @param passportId The numeric Passport ID.
     * @return productRef Direct storage pointer to the validated Product entity.
     */
    function _getValidatedProduct(uint256 passportId) internal view returns (Product storage productRef) {
        if (!_passportExists(passportId)) {
            revert PassportNotFound(passportId);
        }
        return products[passportId];
    }

    /**
     * @dev Internal helper to update the product status enum.
     * @param product Direct storage reference to the Product entity.
     * @param newStatus The target ProductStatus lifecycle enum value.
     */
    function _updateProductStatus(Product storage product, ProductStatus newStatus) internal {
        product.status = newStatus;
    }

    /**
     * @dev Internal helper to validate and retrieve an active PendingTransfer on a Product.
     *      Reverts with `NoPendingTransfer(passportId)` if no transfer is currently in-flight.
     * @param product The storage reference to the Product entity being inspected.
     * @param passportId The numeric Passport ID for error reporting.
     * @return transferRef Direct storage pointer to the active PendingTransfer struct.
     */
    function _requirePendingTransfer(Product storage product, uint256 passportId)
        internal
        view
        returns (PendingTransfer storage transferRef)
    {
        if (!product.pendingTransfer.exists) {
            revert NoPendingTransfer(passportId);
        }
        return product.pendingTransfer;
    }

    /**
     * @dev Internal helper to validate that a product is currently under service and that the caller
     *      is the authorized service center that initiated the active service session.
     *      Reverts with `NotUnderService(passportId)` if the product is not UnderService.
     *      Reverts with `NotCurrentServiceCenter(passportId)` if `msg.sender` does not match `currentServiceCenter`.
     * @param product The storage reference to the Product entity being inspected.
     * @param passportId The numeric Passport ID for error reporting.
     */
    function _validateActiveServiceCenter(Product storage product, uint256 passportId) internal view {
        if (product.status != ProductStatus.UnderService) {
            revert NotUnderService(passportId);
        }
        if (product.currentServiceCenter != msg.sender) {
            revert NotCurrentServiceCenter(passportId);
        }
    }

    /**
     * @dev Internal helper to validate string length constraints and non-emptiness.
     * @param val The string value to validate.
     * @param fieldName The name of the input field for error reporting.
     * @param maxLen The maximum allowed byte length for this field.
     */
    function _validateStringField(
        string calldata val,
        string memory fieldName,
        uint256 maxLen
    ) internal pure {
        if (bytes(val).length == 0) {
            revert EmptyString(fieldName);
        }
        if (bytes(val).length > maxLen) {
            revert StringTooLong(fieldName, maxLen);
        }
    }
}
