import { HardhatRuntimeEnvironment} from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployPoolFactoryProxy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, getNamedAccounts} = hre
    const { deploy, execute } = deployments
    const { deployer } = await getNamedAccounts()

    // const poolAddr = (await deployments.get('PoolFactory_Implementation')).address
    const poolAddr = '0x901ff11b2e65A8805d175533A5f062EB2f9bD43F';

    await deploy('PoolFactory', {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })

    await execute(
        'PoolFactory',
        {from: deployer, log: true},
        'initialize',
        poolAddr
      );
}

deployPoolFactoryProxy.tags = ['POOL_FACTORY']

export default deployPoolFactoryProxy

