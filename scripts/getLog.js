const ethers = require("ethers");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('https://sparkling-autumn-cloud.bsc-testnet.quiknode.pro/2f8da79eae04980dbc9aa105b8f6d1e52ddfa783/');
    // const provider = new ethers.providers.EtherscanProvider('')
    const txHash = '0x7dc3afe2c0ab1749a0f5e9e2bab0109c41c0c4985415e40761d5aa3e3b55e493'

    // const provider = ethers.getDefaultProvider('goerli')

    console.log("GG", await provider.getTransactionReceipt(txHash))

    // const txLog = await provider.getTransactionReceipt(txHash)
    // console.log(txLog)
}

try {
    main();
} catch (error) {
    console.log("EE", error)
}

