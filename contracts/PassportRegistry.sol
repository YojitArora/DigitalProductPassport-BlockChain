// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PassportRegistry
 * @author Digital Product Passport Team
 * @notice Canonical registry smart contract for the Blockchain-Based Digital Product Passport System.
 * @dev Sprint 1 & Sprint 2: Core Authorization, Role Management, and Access Control layer (Admin, Manufacturer, Service Center).
 *      Follows PROJECT_SPEC_v2.md specifications and EVM storage optimization patterns.
 */
contract PassportRegistry {
    /* ================================================================ */
    /* 1. STATE VARIABLES, STRUCTS & CONSTANTS                           */
    /* ================================================================ */

    /**
     * @notice Maximum allowed byte length for registered organization names.
     * @dev Bounds storage gas and prevents spam data injection.
     */
    uint256 public constant MAX_NAME_LENGTH = 128;

    /**
     * @notice Representation of an authorized product manufacturer entity.
     * @dev Fields are ordered for optimal 32-byte EVM storage slot packing:
     *      - Slot 0: `walletAddress` (20 bytes) + `approved` (1 byte) = 21 bytes (saves 1 storage slot)
     *      - Slot 1: `registeredAt` (32 bytes)
     *      - Slot 2: `name` (dynamic string)
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
     * @dev Fields are ordered for optimal 32-byte EVM storage slot packing:
     *      - Slot 0: `walletAddress` (20 bytes) + `approved` (1 byte) = 21 bytes (saves 1 storage slot)
     *      - Slot 1: `registeredAt` (32 bytes)
     *      - Slot 2: `name` (dynamic string)
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

    /// @dev Internal mapping tracking platform admin privileges (address => bool)
    mapping(address => bool) private admins;

    /// @dev Internal mapping from manufacturer wallet address to Manufacturer storage entity
    mapping(address => Manufacturer) private manufacturers;

    /// @dev Internal mapping from service center wallet address to ServiceCenter storage entity
    mapping(address => ServiceCenter) private serviceCenters;

    /* ================================================================ */
    /* 2. ENUMS (Reserved for future sprints)                           */
    /* ================================================================ */

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

    /* ================================================================ */
    /* 6. CONSTRUCTOR & ADMIN FUNCTIONS                                 */
    /* ================================================================ */

    /**
     * @notice Initializes the PassportRegistry and designates contract deployer as the initial platform admin.
     * @dev Emits `AdminAdded` event with `addedBy` set to address(0) for initial genesis admin.
     */
    constructor() {
        admins[msg.sender] = true;
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
        if (bytes(name).length == 0) {
            revert EmptyString("name");
        }
        if (bytes(name).length > MAX_NAME_LENGTH) {
            revert StringTooLong("name", MAX_NAME_LENGTH);
        }
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
        if (bytes(name).length == 0) {
            revert EmptyString("name");
        }
        if (bytes(name).length > MAX_NAME_LENGTH) {
            revert StringTooLong("name", MAX_NAME_LENGTH);
        }
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
    /* 7. MANUFACTURER FUNCTIONS (Reserved for future sprints)          */
    /* ================================================================ */

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

    /* ================================================================ */
    /* 11. INTERNAL/PRIVATE HELPER FUNCTIONS                            */
    /* ================================================================ */
}
