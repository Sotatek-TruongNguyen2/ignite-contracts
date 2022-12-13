require('dotenv').config()

import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const verification: DeployFunction = async(hre: HardhatRuntimeEnvironment) =>{

    try {
        const { ethers, deployments, getNamedAccounts} = hre
        const { deployer } = await getNamedAccounts()

        await new Promise((res, _) =>{
            setTimeout(()=>{
                res(true)
            }, 30000)
        })

        const erc20TokenAddress = (await deployments.get('ERC20Token')).address
        // const erc20TokenAddress = '0x6Cc3b65850f5d65158542bd8Da8031ea12B183dD'

        console.log('----- START VERIFICATION -----');

        await hre.run('verify:verify', {
            address: erc20TokenAddress,
            constructorArguments: [],
            contract: "contracts/test/ERC20Token.sol:ERC20Token"
        })    
    } catch (error) {
        console.log(error);
    }
}

verification.tags = ['VERIFICATION_ERC20TOKEN']
// verification.dependencies = ['ERC20TOKEN']
// verification.runAtTheEnd = true

export default verification