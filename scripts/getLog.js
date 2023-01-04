// const ethers = require("ethers");

const { BigNumber } = require("ethers");
const { hexlify } = require("ethers/lib/utils");

// async function main() {
//     const provider = new ethers.providers.JsonRpcProvider('https://sparkling-autumn-cloud.bsc-testnet.quiknode.pro/2f8da79eae04980dbc9aa105b8f6d1e52ddfa783/');
//     // const provider = new ethers.providers.EtherscanProvider('')
//     const txHash = '0x7dc3afe2c0ab1749a0f5e9e2bab0109c41c0c4985415e40761d5aa3e3b55e493'

//     // const provider = ethers.getDefaultProvider('goerli')

//     console.log("GG", await provider.getTransactionReceipt(txHash))

//     // const txLog = await provider.getTransactionReceipt(txHash)
//     // console.log(txLog)
// }

// try {
//     main();
// } catch (error) {
//     console.log("EE", error)
// }

// console.log(BigNumber.from('0x'+'62aa9372a9a586a860c4624b'))

// const a = BigNumber.from('0x'+'62aa9372a9a586a860c4624b')
// console.log(a)
// console.log(Number(a))
// const b = Number(a)
// console.log(b.toString(16))

// function paddingTo32Bytes(str) {
//     str.pad
// }

// console.log(hexlify('0x167109585808001'))
// const cc = Number(30535744654852434756767081035)
const cc = BigNumber.from('30535744654852434756767081035')
console.log(cc)
console.log(cc.toHexString())
