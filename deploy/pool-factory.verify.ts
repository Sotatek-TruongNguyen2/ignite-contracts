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

        const poolFactoryAddr = (await deployments.get('PoolFactory_Implementation')).address
        // const poolFactoryAddr = '0x89AC9209959865B9EfF5AeF042049D97cC1584cF'

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