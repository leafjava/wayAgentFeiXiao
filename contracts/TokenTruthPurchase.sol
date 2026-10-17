// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TokenTruthPurchase
/// @notice Monad Testnet demo payment receipt. It does not mint or custody an asset.
contract TokenTruthPurchase {
    uint256 public constant PRICE = 0.01 ether;
    address public immutable owner;
    uint256 public nonce;

    struct Order { bytes32 orderId; address buyer; string projectId; string asset; uint256 amount; uint256 timestamp; }
    mapping(bytes32 => Order) public orders;

    event PurchaseRecorded(bytes32 indexed orderId, address indexed buyer, string projectId, string asset, uint256 amount, uint256 timestamp);

    constructor() { owner = msg.sender; }

    function purchase(string calldata projectId, string calldata asset) external payable returns (bytes32 orderId) {
        require(msg.value == PRICE, "TokenTruth: payment must be 0.01 MON");
        orderId = keccak256(abi.encodePacked(address(this), msg.sender, nonce++, block.number, projectId, asset));
        orders[orderId] = Order(orderId, msg.sender, projectId, asset, msg.value, block.timestamp);
        emit PurchaseRecorded(orderId, msg.sender, projectId, asset, msg.value, block.timestamp);
    }

    function withdraw(address payable to) external {
        require(msg.sender == owner, "TokenTruth: only owner");
        require(to != address(0), "TokenTruth: zero address");
        to.transfer(address(this).balance);
    }
}
