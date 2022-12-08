import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployPoolProxy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy('Pool', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy'
        }
    })
}

deployPoolProxy.tags = ['POOL_PROXY']

export default deployPoolProxy