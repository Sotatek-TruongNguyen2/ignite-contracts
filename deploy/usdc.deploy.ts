import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployUSDC: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy, execute } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy('FiatTokenV2_1', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })

    // await execute(
    //     'ERC20Token',
    //     {from: deployer, log: true},
    //     'initialize',
    //     'USD Coin', 'USDC', 6
    // )
}

deployUSDC.tags = ['USDC']

export default deployUSDC
