import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployPoolImplementation: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy('Pool', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })
}

deployPoolImplementation.tags = ['POOL']

export default deployPoolImplementation