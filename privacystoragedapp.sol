// SPDX-License-Identifier: MIT
pragma solidity ^0.5.8;

contract PrivacyStorageDApp {
    // Struct to manage privacy-related data
    struct PrivacyStorage {
        bytes32 root; // Merkle tree root to maintain data integrity
        mapping(address => mapping(bytes32 => bytes)) userDataByHash; // Stores data hashes associated with each user and salt
        mapping(address => mapping(bytes32 => bytes32[])) userSaltHashes; // Stores data hashes associated with each user and salt
    }

    PrivacyStorage private storageInstance; // Instance of PrivacyStorage for data storage

    event DataStored(address indexed user, bytes32 indexed dataHash, bytes data); // Event for data storage

    /**
     * @dev Function to store data in the privacy storage with a custom salt.
     * @param _data The data to be stored.
     * @param _salt The custom salt provided by the user.
     */
    function storeData(bytes memory _data, bytes32 _salt) public {
        require(_data.length > 0, "Data must not be empty");

        // Calculate hash of the data combined with the salt
        bytes32 dataHash = keccak256(abi.encodePacked(_data, _salt));

        // Update Merkle tree root with the new data hash
        storageInstance.root = keccak256(abi.encodePacked(storageInstance.root, dataHash));

        // Store data hash in mappings associated with the user and salt
        storageInstance.userDataByHash[msg.sender][dataHash] = _data;
        storageInstance.userSaltHashes[msg.sender][_salt].push(dataHash);

        // Emit event for data storage
        emit DataStored(msg.sender, dataHash, _data);
    }

    /**
     * @dev Function to retrieve data from the privacy storage with a custom salt.
     * @param _userAddress The user's address.
     * @param _salt The custom salt associated with the data.
     * @return Data associated with the hash and user's address.
     */
    function retrieveData(address _userAddress, bytes32 _salt) public view returns (bytes memory) {
        require(_userAddress == msg.sender, "Unauthorized access");

        // Retrieve data hashes associated with the user and salt
        bytes32[] memory hashes = storageInstance.userSaltHashes[_userAddress][_salt];
        require(hashes.length > 0, "No data hash found");

        // Retrieve the latest data hash associated with the salt and return the data
        bytes32 hashWithSalt = hashes[hashes.length - 1];
        return storageInstance.userDataByHash[_userAddress][hashWithSalt];
    }

    /**
     * @dev Function to retrieve the list of data hashes associated with the user's address and salt.
     * @param _userAddress The user's address.
     * @param _salt The custom salt associated with the data.
     * @return An array of data hashes associated with the user and salt.
     */
    function getUserDataHashes(address _userAddress, bytes32 _salt) public view returns (bytes32[] memory) {
        require(_userAddress == msg.sender, "Unauthorized access");

        // Retrieve data hashes associated with the user and salt
        bytes32[] memory hashes = storageInstance.userSaltHashes[_userAddress][_salt];
        require(hashes.length > 0, "No data hash found");

        return hashes;
    }
}