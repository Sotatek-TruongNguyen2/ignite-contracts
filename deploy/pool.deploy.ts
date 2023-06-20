import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployPoolImplementation: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    const { address: vestingLogicAddress } = await deploy('VestingLogic', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    });

    const { address: poolLogicAddress } = await deploy('PoolLogic', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    });

    await deploy('Pool', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
        libraries: {
            VestingLogic: vestingLogicAddress,
            PoolLogic: poolLogicAddress,
        }
    })
}

deployPoolImplementation.tags = ['POOL']

export default deployPoolImplementation
