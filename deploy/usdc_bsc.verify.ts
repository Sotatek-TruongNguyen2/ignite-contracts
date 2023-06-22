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
            }, 30)
        })

        const usdcAddr = (await deployments.get('BEP20TokenImplementation')).address

        console.log('----- START VERIFICATION -----');

        await hre.run('verify:verify', {
            address: usdcAddr,
            constructorArguments: [],
            contract: "contracts/test/USDC_BSC.sol:BEP20TokenImplementation"
        })    
    } catch (error) {
        console.log(error);
    }
}

verification.tags = ['VERIFICATION_USDC_BSC']
// verification.dependencies = ['ERC20TOKEN']
// verification.runAtTheEnd = true

export default verification
