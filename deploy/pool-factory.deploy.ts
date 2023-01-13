import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployPoolFactoryProxy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy, execute } = deployments
    const { deployer } = await getNamedAccounts()

    // const poolAddr = (await deployments.get('PoolFactory_Implementation')).address
    // const poolAddr = '0x79a0C155423A0c38155800ec5aee4292eda8ff63';

    await deploy('PoolFactory', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })

    // await execute(
    //     'PoolFactory',
    //     {from: deployer, log: true},
    //     'initialize',
    //     poolAddr
    //   );
}

deployPoolFactoryProxy.tags = ['POOL_FACTORY']

export default deployPoolFactoryProxy
