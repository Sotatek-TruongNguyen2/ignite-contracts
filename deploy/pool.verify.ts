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

        // const poolImplementationAddr = (await deployments.get('Pool')).address
        const poolImplementationAddr = '0x6Cc3b65850f5d65158542bd8Da8031ea12B183dD'

        console.log('----- START VERIFICATION -----');

        await hre.run('verify:verify', {
            address: poolImplementationAddr,
            constructorArguments: [],
            contract: "contracts/IDOpool/Pool.sol:Pool"
        })    
    } catch (error) {
        console.log(error);
    }
}

verification.tags = ['VERIFICATION_POOL']
// verification.dependencies = ['POOL']
// verification.runAtTheEnd = true

export default verification