// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PassportRegistry
 * @author Digital Product Passport Team
 * @notice Canonical registry smart contract for the Blockchain-Based Digital Product Passport System.
 * @dev Sprint 1 & Sprint 2: Core Authorization, Role Management, and Product Passport Registration & Query Layer.
 *      Follows PROJECT_SPEC_v2.md specifications and EVM storage optimization patterns.
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
     * @dev Computed dynamically without storing boolean state flags.
     * @param startTimestamp Timestamp when warranty became active (0 if inactive)
     * @param endTimestamp Expiration timestamp of the warranty (0 if inactive)
     */
    struct Warranty {
        uint256 startTimestamp;
        uint256 endTimestamp;
    }

    /**
     * @notice Comprehensive on-chain Digital Product Passport entity.
     * @dev Stores current state only; history and audit trails are reconstructed from blockchain events.
     *      Storage Slot Layout Analysis:
     *      - Slot 0: `passportId` (32 bytes / uint256)
     *      - Slot 1: `manufacturer` (20 bytes) + `status` (1 byte enum) = 21 bytes (packed together)
     *      - Slot 2: `currentOwner` (20 bytes) (address cannot pack into the 11 remaining bytes of Slot 1)
     *      - Slot 3: `manufactureDate` (32 bytes / uint256 timestamp)
     *      - Slot 4: `createdAt` (32 bytes / uint256 timestamp)
     *      - Slot 5: `warranty.startTimestamp` (32 bytes / uint256)
     *      - Slot 6: `warranty.endTimestamp` (32 bytes / uint256)
     *      - Slots 7-11: Dynamic strings (`productName`, `brand`, `category`, `modelNumber`, `serialNumber`),
     *        each reserving a full 32-byte slot for string length/pointer.
     *      Note: No further layout packing is measurable or beneficial without reducing timestamp precision
     *      or altering the public API.
     * @param passportId Unique auto-incrementing platform identifier (starts at 1)
     * @param manufacturer Address of the authorized manufacturer who minted the passport
     * @param currentOwner Address of the current product owner
     * @param status Current lifecycle status of the physical product
     * @param manufactureDate Unix timestamp of product manufacture
     * @param createdAt Unix timestamp when the passport was registered on-chain
     * @param warranty Warranty time window struct
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
        uint256 manufactureDate;
        uint256 createdAt;
        Warranty warranty;
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
        p.status = ProductStatus.Active;
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

    /* ================================================================ */
    /* 8. SERVICE CENTER FUNCTIONS (Reserved for future sprints)        */
    /* ================================================================ */

    /* ================================================================ */
    /* 9. OWNER FUNCTIONS (Reserved for future sprints)                 */
    /* ================================================================ */

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
     * @notice Computes whether the warranty for a product passport is currently valid and active.
     * @dev Dynamic calculation evaluated against `block.timestamp`. Returns false if passport does not exist or has no warranty.
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
