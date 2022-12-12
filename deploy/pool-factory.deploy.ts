import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployPoolFactoryProxy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy('PoolFactory', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })
}

deployPoolFactoryProxy.tags = ['POOL_FACTORY']

export default deployPoolFactoryProxy

// test