let web3; // Web3 instance
let contractInstance; // Contract instance

async function connectMetamask() {
    try {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
            const accounts = await web3.eth.getAccounts();

            if (accounts.length > 0) {
                web3.eth.defaultAccount = accounts[0]; // Set the first account as default

                console.log('Connected:', web3.eth.defaultAccount);

                // Contract ABI and address
                const contractABI = [{"constant":true,"inputs":[{"name":"_userAddress","type":"address"},{"name":"_salt","type":"bytes32"}],"name":"getUserDataHashes","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},
                {"constant":true,"inputs":[{"name":"_userAddress","type":"address"},{"name":"_salt","type":"bytes32"}],"name":"retrieveData","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},
                {"constant":false,"inputs":[{"name":"_data","type":"bytes"},{"name":"_salt","type":"bytes32"}],"name":"storeData","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},
                {"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"dataHash","type":"bytes32"},{"indexed":false,"name":"data","type":"bytes"}],"name":"DataStored","type":"event"}]; // Replace with your contract ABI
                const contractAddress = '0x4ad351870cda14C908346D4aBa902f001Ae7Aceb'; // Replace with your actual contract address

                // Create an instance of the contract
                contractInstance = new web3.eth.Contract(contractABI, contractAddress);

                // Display interaction element
                document.getElementById('interaction').style.display = 'block';
            } else {
                console.log('No accounts found.');
            }
        } else {
            console.log('Metamask not detected');
        }
    } catch (error) {
        console.error('Error connecting to Metamask:', error);
    }
}

// Function to store data
window.storeData = async () => {
    const dataFileInput = document.getElementById('dataFileInput').files[0];
    const saltInput = document.getElementById('saltInput').value;

    const reader = new FileReader();
    
    reader.onloadend = async function() {
        try {
            const base64data = reader.result.split(',')[1]; // Extracting Base64 data
            
            // Convert data and salt to bytes for storage
            const dataBytes = web3.utils.fromAscii(base64data);
            const saltBytes32 = web3.utils.fromAscii(saltInput);
    
            // Call contract method to store data
            await contractInstance.methods.storeData(dataBytes, saltBytes32).send({ from: web3.eth.defaultAccount });
            console.log('Data stored successfully!');
        } catch (error) {
            console.error('Error storing data:', error);
        }
    };
    
    if (dataFileInput) {
        reader.readAsDataURL(dataFileInput); // Read the file as data URL (Base64)
    } else {
        console.error('No file selected.');
    }
};

// Function to retrieve data
window.retrieveData = async () => {
    const retrieveSaltInput = document.getElementById('retrieveSaltInput').value;

    const saltBytes32 = web3.utils.fromAscii(retrieveSaltInput);
    const userAddress = web3.eth.defaultAccount;

    // Get data hashes associated with the user and salt
    const dataHashes = await contractInstance.methods.getUserDataHashes(userAddress, saltBytes32).call();

    if (dataHashes.length > 0) {
        const latestDataHash = dataHashes[dataHashes.length - 1];
        // Retrieve and display decrypted data
        const retrievedData = await contractInstance.methods.retrieveData(userAddress, saltBytes32).call();
        const decryptedData = web3.utils.toAscii(retrievedData);
        document.getElementById('dataOutput').innerText = decryptedData;
    } else {
        document.getElementById('dataOutput').innerText = 'No data found.';
    }
};