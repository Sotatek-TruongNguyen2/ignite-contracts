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
            }, 300)
        })

        const poolFactoryAddr = (await deployments.get('PoolFactory')).address
        // const poolFactoryAddr = '0x09242411820816D036d4cCcD8554CE1ACA7dE7B2'

        console.log('----- START VERIFICATION -----');

        await hre.run('verify:verify', {
            address: poolFactoryAddr,
            constructorArguments: [],
            contract: "contracts/IDOpool/PoolFactory.sol:PoolFactory"
        })    
    } catch (error) {
        console.log(error);
    }
}

verification.tags = ['VERIFICATION_POOL_FACTORY']
// verification.dependencies = ['POOL_FACTORY']
// verification.runAtTheEnd = true

export default verification