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
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute:{
                methodName: 'initialize',
                args: ['0x6Cc3b65850f5d65158542bd8Da8031ea12B183dD']
            }
        }
    })
}

deployPoolFactoryProxy.tags = ['POOL_FACTORY_PROXY']

export default deployPoolFactoryProxy