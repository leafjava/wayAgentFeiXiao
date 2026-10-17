// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DisclosureRegistry
/// @notice TokenTruth · 项目披露/研究/风险状态链上存证
/// @dev 单合约；链上仅存摘要哈希与关键元数据，原始文档保留链下
contract DisclosureRegistry {
    enum EvidenceType {
        PROJECT_DISCLOSURE,
        RESEARCH_REPORT,
        RISK_STATUS_CHANGE,
        INVESTOR_QA,
        CONTENT_PUBLISH,
        EXECUTION_CONSENT
    }

    struct Evidence {
        bytes32 evidenceHash;
        string  evidenceId;
        uint8   evidenceType;
        uint256 timestamp;
        string  projectId;
        string  docVersion;
        bytes32 fromStatus;
        bytes32 toStatus;
        address recorder;
        uint256 blockNumber;
    }

    mapping(bytes32 => Evidence) public records;
    mapping(string => bytes32) public idToHash;
    bytes32[] public allHashes;
    mapping(address => bool) public authorizedRecorders;
    address public owner;

    event EvidenceRecorded(
        bytes32 indexed evidenceHash,
        string  evidenceId,
        uint8   evidenceType,
        uint256 timestamp,
        string  projectId,
        string  docVersion,
        bytes32 fromStatus,
        bytes32 toStatus,
        address recorder,
        uint256 blockNumber
    );

    event RecorderAuthorized(address indexed recorder, bool authorized);
    event OwnershipTransferred(address indexed previous, address indexed current);

    modifier onlyOwner() {
        require(msg.sender == owner, "DisclosureRegistry: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedRecorders[msg.sender] || msg.sender == owner, "DisclosureRegistry: not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        authorizedRecorders[msg.sender] = true;
        emit RecorderAuthorized(msg.sender, true);
    }

    function setRecorder(address recorder, bool authorized) external onlyOwner {
        authorizedRecorders[recorder] = authorized;
        emit RecorderAuthorized(recorder, authorized);
    }

    function recordEvidence(
        bytes32 evidenceHash,
        string calldata evidenceId,
        uint8 evidenceType,
        uint256 timestamp,
        string calldata projectId,
        string calldata docVersion,
        bytes32 fromStatus,
        bytes32 toStatus
    ) external onlyAuthorized returns (bool) {
        require(evidenceHash != bytes32(0), "DisclosureRegistry: empty hash");
        require(bytes(evidenceId).length > 0, "DisclosureRegistry: empty evidenceId");
        require(idToHash[evidenceId] == bytes32(0), "DisclosureRegistry: duplicate evidenceId");
        require(evidenceType <= uint8(EvidenceType.EXECUTION_CONSENT), "DisclosureRegistry: invalid type");

        Evidence memory rec = Evidence({
            evidenceHash: evidenceHash,
            evidenceId: evidenceId,
            evidenceType: evidenceType,
            timestamp: timestamp,
            projectId: projectId,
            docVersion: docVersion,
            fromStatus: fromStatus,
            toStatus: toStatus,
            recorder: msg.sender,
            blockNumber: block.number
        });
        records[evidenceHash] = rec;
        idToHash[evidenceId] = evidenceHash;
        allHashes.push(evidenceHash);

        emit EvidenceRecorded(
            evidenceHash, evidenceId, evidenceType, timestamp,
            projectId, docVersion, fromStatus, toStatus,
            msg.sender, block.number
        );
        return true;
    }

    function verify(bytes32 evidenceHash) external view returns (bool exists, Evidence memory rec) {
        rec = records[evidenceHash];
        exists = rec.evidenceHash != bytes32(0);
    }

    function getByEvidenceId(string calldata evidenceId) external view returns (bool exists, Evidence memory rec) {
        bytes32 h = idToHash[evidenceId];
        if (h == bytes32(0)) return (false, rec);
        rec = records[h];
        return (true, rec);
    }

    function totalEvidence() external view returns (uint256) {
        return allHashes.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DisclosureRegistry: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
