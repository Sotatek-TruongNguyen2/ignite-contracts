import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployERC20Token: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy('ERC20Token', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })
}

deployERC20Token.tags = ['ERC20TOKEN']

export default deployERC20Token
