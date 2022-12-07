import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"

import { Pool } from "../typechain-types/contracts/IDOpool/Pool"
import { Pool__factory } from "../typechain-types/factories/contracts/IDOpool/Pool__factory"

import { PoolFactory } from "../typechain-types/contracts/IDOpool/PoolFactory"
import { PoolFactory__factory } from "../typechain-types/factories/contracts/IDOpool/PoolFactory__factory"

import { ERC20Token } from "../typechain-types/contracts/test/ERC20Token"
import { ERC20Token__factory } from "../typechain-types/factories/contracts/test/ERC20Token__factory"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { hexlify, keccak256, parseUnits, solidityKeccak256, solidityPack } from "ethers/lib/utils"
import MerkleTree from "merkletreejs"
import { publicDecrypt, randomBytes } from "crypto"

describe("Ignition Pool",()=>{
    async function deployPoolFactoryFixture(){

        function jsonCopy(src: any) {
            return JSON.parse(JSON.stringify(src));
        }

        type PoolInfo = {
            IDOToken: string
            purchaseToken: string
            maxPurchaseAmountForKYCUser: BigNumber
            maxPurchaseAmountForNotKYCUser: BigNumber
            TGEDate: BigNumber
            TGEPercentage: BigNumber
            participationFeePercentage: BigNumber
            galaxyPoolProportion: BigNumber
            earlyAccessProportion: BigNumber
            totalRaiseAmount: BigNumber
            whaleOpenTime: BigNumber
            whaleDuration: BigNumber
            communityDuration: BigNumber
            rate: BigNumber
            decimal: BigNumber
            price: number
        }

        let owner: SignerWithAddress
        let admin1: SignerWithAddress
        let admin2: SignerWithAddress
        let admin3: SignerWithAddress
        let collaborator0: SignerWithAddress
        let collaborator1: SignerWithAddress
        let collaborator2: SignerWithAddress
        let investors: SignerWithAddress[]
        let poolFactory: PoolFactory
        let pool: Pool
        let purchaseTokens: ERC20Token[]
        let IDOTokens: ERC20Token[]
        let zeroAddress: string = '0x'+'0'.repeat(40);
        let poolInfoList: PoolInfo[]

        const PERCENTAGE_DENOMINATOR = 10000;

        const {provider} = ethers;

        [owner, admin1, admin2, admin3, collaborator0, 
        collaborator1, collaborator2, ...investors] = await ethers.getSigners();

        pool = await new Pool__factory(owner).deploy();
        poolFactory = await new PoolFactory__factory(owner).deploy();
        await poolFactory.initialize(pool.address)

        purchaseTokens = [
            await new ERC20Token__factory(owner).deploy("PurchaseToken0","PurchaseToken0", 6),
            await new ERC20Token__factory(owner).deploy("PurchaseToken1","PurchaseToken1", 8),
            await new ERC20Token__factory(owner).deploy("PurchaseToken2","PurchaseToken2", 18),
            await new ERC20Token__factory(owner).deploy("PurchaseToken3","PurchaseToken3", 6),
            await new ERC20Token__factory(owner).deploy("PurchaseToken4","PurchaseToken4", 6),
        ]

        for(let i=0;i<purchaseTokens.length;i++){
            for(let j=0;j<investors.length;j++){
                await purchaseTokens[i].connect(owner).mint(investors[j].address, parseUnits('1000000', '30'))
            }
        }

        IDOTokens = [
            await new ERC20Token__factory(owner).deploy("IDOToken0","IDOToken0", 18),
            await new ERC20Token__factory(owner).deploy("IDOToken1","IDOToken1", 6),
            await new ERC20Token__factory(owner).deploy("IDOToken2","IDOToken2", 10),
            await new ERC20Token__factory(owner).deploy("IDOToken3","IDOToken3", 8),
            await new ERC20Token__factory(owner).deploy("IDOToken4","IDOToken4", 8),
        ]

        await IDOTokens[0].connect(collaborator0).mint(collaborator0.address, parseUnits('1000000', '30'))
        await IDOTokens[1].connect(collaborator1).mint(collaborator1.address, parseUnits('1000000', '30'))
        poolInfoList = [
            {
                IDOToken: IDOTokens[0].address,
                purchaseToken: purchaseTokens[0].address,
                maxPurchaseAmountForKYCUser: parseUnits('10000',6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000',6),
                TGEDate: BigNumber.from((Date.now()/1000).toFixed()).add(30*24*60*60),
                TGEPercentage: BigNumber.from('2000'),
                participationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('9000000',6),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()).add(3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(48*60*60),
                rate: parseUnits('125',12),
                decimal: BigNumber.from(1),
                price: 0.08
            },
            {
                IDOToken: IDOTokens[1].address,
                purchaseToken: purchaseTokens[1].address,
                maxPurchaseAmountForKYCUser: parseUnits('30000',8),
                maxPurchaseAmountForNotKYCUser: parseUnits('15000',8),
                TGEDate: BigNumber.from((Date.now()/1000).toFixed()).add(27*24*60*60),
                TGEPercentage: BigNumber.from('1000'),
                participationFeePercentage: BigNumber.from('1500'),
                galaxyPoolProportion: BigNumber.from('5000'),
                earlyAccessProportion: BigNumber.from('5000'),
                totalRaiseAmount: parseUnits('100000', 8),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()).add(3*24*60*60),
                whaleDuration: BigNumber.from(12*60*60),
                communityDuration: BigNumber.from(24*60*60),
                rate: BigNumber.from('35714285714285714285'),
                decimal: BigNumber.from(20),
                price: 0.028
            },
            {
                IDOToken: IDOTokens[2].address,
                purchaseToken: purchaseTokens[2].address,
                maxPurchaseAmountForKYCUser: parseUnits('10000',18),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000',18),
                TGEDate: BigNumber.from((Date.now()/1000).toFixed()).add(10*24*60*60),
                TGEPercentage: BigNumber.from('1000'),
                participationFeePercentage: BigNumber.from('1500'),
                galaxyPoolProportion: BigNumber.from('1000'),
                earlyAccessProportion: BigNumber.from('6000'),
                totalRaiseAmount: parseUnits('8000000',18),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()).add(3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(24*60*60),
                rate: BigNumber.from(1),
                decimal: BigNumber.from(9),
                price: 10
            },
            {
                IDOToken: IDOTokens[3].address,
                purchaseToken: purchaseTokens[3].address,
                maxPurchaseAmountForKYCUser: parseUnits('2000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                TGEDate: BigNumber.from((Date.now()/1000).toFixed()).add(30*24*60*60),
                TGEPercentage: BigNumber.from('3000'),
                participationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('850000',6),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()).add(3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(12*60*60),
                rate: BigNumber.from('1818181818181818100'),
                decimal: BigNumber.from(18),
                price: 55
            },
            {
                IDOToken: IDOTokens[4].address,
                purchaseToken: purchaseTokens[4].address,
                maxPurchaseAmountForKYCUser: parseUnits('2000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                TGEDate: BigNumber.from((Date.now()/1000).toFixed()).add(30*24*60*60),
                TGEPercentage: BigNumber.from('3000'),
                participationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('850000',6),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()).add(3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(12*60*60),
                rate: BigNumber.from('1818181818181818100'),
                decimal: BigNumber.from(18),
                price: 55
            },
        ]

        return {jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2,
        investors, poolFactory, pool, zeroAddress, provider, IDOTokens, purchaseTokens, poolInfoList, PERCENTAGE_DENOMINATOR}
    }

    describe("Pool Factory",()=>{
        it("Should deploy pool factory and initialize pool implementation address successfully", async()=>{
            const {poolFactory, pool} = await loadFixture(deployPoolFactoryFixture)
            expect(poolFactory.address).to.be.a.properAddress;
            expect(await poolFactory.poolImplementationAddress()).to.be.equal(pool.address)
        })

        it("Should grant, revoke admin successfully by admin; revert grant for zero addres, revert grant twice for an admin, revert revoke for account not be an admin", async()=>{
            const {owner, admin1, admin2, admin3, poolFactory, zeroAddress} = await loadFixture(deployPoolFactoryFixture)
            expect(await poolFactory.hasAdminRole(owner.address)).to.be.true
            expect(await poolFactory.hasAdminRole(admin1.address)).to.be.false

            await poolFactory.connect(owner).grantAdminRole(admin1.address)
            expect(await poolFactory.hasAdminRole(admin1.address)).to.be.true

            await poolFactory.connect(admin1).grantAdminRole(admin2.address)
            expect(await poolFactory.hasAdminRole(admin2.address)).to.be.true
            await poolFactory.connect(owner).revokeAdminRole(admin2.address)
            expect(await poolFactory.hasAdminRole(admin2.address)).to.be.false

            await expect(poolFactory.connect(owner).grantAdminRole(zeroAddress)).to.be.revertedWithCustomError(poolFactory,"ZeroAddress")
            await expect(poolFactory.connect(owner).grantAdminRole(admin1.address)).to.be.revertedWithCustomError(poolFactory, "AlreadyAdmin")
            await expect(poolFactory.revokeAdminRole(admin3.address)).to.be.revertedWithCustomError(poolFactory, "AlreadyNotAdmin")
        })

        it("Should set pool implementation address successfully by admin; revert set zero address for pool; revert set pool address not by admin", async()=>{
            const {owner, admin1, admin2, poolFactory, provider, zeroAddress} = await loadFixture(deployPoolFactoryFixture)
            const randomPool = new ethers.Wallet(ethers.utils.randomBytes(32), provider);
            expect(await poolFactory.connect(owner).grantAdminRole(admin1.address))
            await poolFactory.connect(admin1).setPoolImplementation(randomPool.address)
            expect(await poolFactory.poolImplementationAddress()).to.be.equal(randomPool.address)

            await expect(poolFactory.connect(owner).setPoolImplementation(zeroAddress)).to.be.revertedWithCustomError(poolFactory,"ZeroAddress")
            await expect(poolFactory.connect(admin2).setPoolImplementation(randomPool.address)).to.be.reverted;
        })

        it("Should register new pool address successfully; revert register not by admin; revert with not valid pool info", async()=>{
            const {jsonCopy, owner, poolFactory, poolInfoList, collaborator0, zeroAddress} = await loadFixture(deployPoolFactoryFixture)
            const poolInfo1 = jsonCopy(poolInfoList[0])
            await poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])

            expect(await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo1.IDOToken)).to.be.equal(0)

            const poolInfo1Index = await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo1.IDOToken)
            const poolInfo1Hash = await poolFactory.hashPoolInfo([poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])

            expect(await poolFactory.registerPools(collaborator0.address, poolInfo1Hash, poolInfo1Index)).to.be.not.equal(zeroAddress)
            expect(await poolFactory.registerPools(collaborator0.address, poolInfo1Hash, poolInfo1Index)).to.be.equal(await poolFactory.getRegisteredPools(collaborator0.address, poolInfo1.IDOToken,0))

            await expect(poolFactory.connect(collaborator0).registerPoolAddress(collaborator0.address, [poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])).to.be.reverted;

            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.IDOToken = zeroAddress;
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAddress")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.purchaseToken = zeroAddress
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAddress")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.galaxyPoolProportion = BigNumber.from('100000')
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"NotValidGalaxyPoolProportion")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.earlyAccessProportion = BigNumber.from('23400')
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"NotValidEarlyAccessProportion")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.totalRaiseAmount = BigNumber.from(0)
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAmount")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.communityDuration = BigNumber.from(0)
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAmount")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.rate = BigNumber.from(0)
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEDate, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAmount")
            }
        })

        it("Should register by admin and create new pool by collaborator; revert create by other user", async()=>{
            const {jsonCopy, owner, admin1, collaborator0, poolInfoList, poolFactory, collaborator1} = await loadFixture(deployPoolFactoryFixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])
            await poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEDate, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
                
            await poolFactory.connect(collaborator0).createPool([poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEDate, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
            
            expect(await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo0.IDOToken)).to.be.equal(1)
            expect(await poolFactory.getCreatedPools(collaborator0.address, poolInfo0.IDOToken,0)).to.be.equal(await poolFactory.getRegisteredPools(collaborator0.address, poolInfo0.IDOToken,0))
            expect(await poolFactory.allPoolsLength()).to.be.equal(1)
            expect((await poolFactory.getCreatedPoolsByToken(collaborator0.address, poolInfo0.IDOToken)).length).to.be.equal(1)
            // revert create pool by not registered collaborator
            const poolInfo1 = jsonCopy(poolInfoList[1])
            await poolFactory.connect(owner).grantAdminRole(admin1.address)
            await poolFactory.connect(admin1).registerPoolAddress(collaborator0.address,[poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])
            
            await expect (poolFactory.connect(collaborator1).createPool([poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])).to.be.revertedWithCustomError(poolFactory, "NotRegisteredPool")

            // register and create successfully twice
            await poolFactory.connect(collaborator0).createPool([poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])
            
            expect(await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo1.IDOToken)).to.be.equal(1)
        })        
    })

    describe("Pool 0 - buy with approve",()=>{
        async function deployPool0Fixture(){
            const {jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, 
                poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, PERCENTAGE_DENOMINATOR} = await loadFixture(deployPoolFactoryFixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])
            await poolFactory.connect(owner).registerPoolAddress(collaborator0.address,[poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEDate, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
            
            expect(await poolFactory.getRegisteredPoolsLengthByToken(collaborator0.address, poolInfo0.IDOToken)).to.be.equal(1)
            const pool0RegisteredAddresses = await poolFactory.getRegisteredPoolsByToken(collaborator0.address, poolInfo0.IDOToken)
            
            await poolFactory.connect(collaborator0).createPool([poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEDate, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
            const pool0Address = await poolFactory.getCreatedPools(collaborator0.address, poolInfo0.IDOToken, 0)
            expect(pool0Address).to.be.equal(pool0RegisteredAddresses[0])

            await poolFactory.connect(owner).grantAdminRole(admin1.address)

            const pool0 = new Pool__factory(owner).attach(pool0Address)
            
            const WHALE_HASH = solidityKeccak256(["string"],["WHALE"])
            const NORMAL_USER_HASH = solidityKeccak256(["string"],["NORMAL_USER"])
            
            // whale: investors: 0, 1, 2, 3
            // normal_user: investors: 4, 5, 6
            // KYC_user: investors: 0, 1, 5

            // whale + KYC: 0,1    (1)
            // whale + notKYC: 2,3 (2)
            // normal + KYC: 5     (3)

            // leaf [address+WHALE+10_000+maxPurchaseBaseOnAllocation]: (1) (>> Galaxy pool)
            // leaf [address+WHALE+10_000+0]:                           (1) (>> Early access pool)
            // leaf [address+WHALE+1_000+maxPurchaseBaseOnAllocation]:  (2) (>> Galaxy pool)
            // leaf [address+WHALE+1_000+0]:                            (2) (>> Early access pool)
            // leaf [address+NORMAL_USER+10_000+0]:                     (3)+(1)

            const PAIDBalanceList = [
                75000, //0
                150000, //1
                93750, //2
                243750, //3
                18750, //4
                1000, //5
                10000, //6
            ]

            const PAIDTotalForGalaxyPool = PAIDBalanceList.reduce(
                (accumulator, currentValue)=>
                    {
                        if(currentValue >= 75000) return accumulator+currentValue
                        else return accumulator
                    },
                    0
            )

            const maxPurchaseAmountForGalaxyPool_pool0 = BigNumber.from(Number(poolInfo0.totalRaiseAmount.hex)*Number(poolInfo0.galaxyPoolProportion.hex)/PERCENTAGE_DENOMINATOR);

            const buyWhiteList = [
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / PAIDTotalForGalaxyPool * PAIDBalanceList[0]).toFixed())
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / PAIDTotalForGalaxyPool * PAIDBalanceList[1]).toFixed())
                },
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / PAIDTotalForGalaxyPool * PAIDBalanceList[2]).toFixed())
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / PAIDTotalForGalaxyPool * PAIDBalanceList[3]).toFixed())
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[5].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[0].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[1].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                }
            ]
            
            const leafNodes = buyWhiteList.map((obj) => {
                let leafNode = solidityPack(
                  ["address", "bytes32", "uint256","uint256"],
                  [obj.candidate, obj.userType, obj.maxPurchaseWhetherOrNotKYC, obj.maxPurchaseBaseOnAllocation]
                );
                return ethers.utils.solidityKeccak256(["bytes"], [leafNode]);
            });

            const buyMerkleTree = new MerkleTree(leafNodes, keccak256, {
                sortPairs: true,
            });

            const buyRootHash = hexlify(buyMerkleTree.getRoot());

            function getProof(leafInfo: {candidate: string, userType: string, maxPurchaseWhetherOrNotKYC: number, maxPurchaseBaseOnAllocation: number}){
                const leaf = solidityPack(
                    ["address", "bytes32", "uint256","uint256"],
                    [leafInfo.candidate, leafInfo.userType, leafInfo.maxPurchaseWhetherOrNotKYC, leafInfo.maxPurchaseBaseOnAllocation]
                )
                const leafNode = solidityKeccak256(["bytes"],[leaf])
                const proof = buyMerkleTree.getHexProof(leafNode)
                return proof
            }


            return {getProof, PERCENTAGE_DENOMINATOR, buyMerkleTree, buyWhiteList, buyRootHash, jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, pool0}
        }
        it("Should get info from pool after created", async()=>{
            const {jsonCopy, pool0, poolInfoList} = await loadFixture(deployPool0Fixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])

            expect(await pool0.IDOToken()).to.be.equal(poolInfo0.IDOToken)
            expect(await pool0.purchaseToken()).to.be.equal(poolInfo0.purchaseToken)
            expect((await pool0.offeredCurrency()).rate).to.be.equal(Number(poolInfo0.rate.hex))
            expect((await pool0.offeredCurrency()).decimal).to.be.equal(Number(poolInfo0.decimal.hex))
            expect(await pool0.maxPurchaseAmountForKYCUser()).to.be.equal(Number(poolInfo0.maxPurchaseAmountForKYCUser.hex))
            expect(await pool0.maxPurchaseAmountForNotKYCUser()).to.be.equal(Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex))
            expect(await pool0.TGEPercentage()).to.be.equal(Number(poolInfo0.TGEPercentage.hex))
            expect(await pool0.participationFeePercentage()).to.be.equal(Number(poolInfo0.participationFeePercentage.hex))
            expect(await pool0.galaxyPoolProportion()).to.be.equal(Number(poolInfo0.galaxyPoolProportion.hex))
            expect(await pool0.earlyAccessProportion()).to.be.equal(Number(poolInfo0.earlyAccessProportion.hex))
            expect(await pool0.totalRaiseAmount()).to.be.equal(Number(poolInfo0.totalRaiseAmount.hex))
            expect(await pool0.whaleOpenTime()).to.be.equal(Number(poolInfo0.whaleOpenTime.hex))
            expect(await pool0.whaleDuration()).to.be.equal(Number(poolInfo0.whaleDuration.hex))
            expect(await pool0.communityDuration()).to.be.equal(Number(poolInfo0.communityDuration.hex))

            expect(await pool0.maxPurchaseAmountForGalaxyPool()).to.be.equal((Number(poolInfo0.totalRaiseAmount.hex)*Number(poolInfo0.galaxyPoolProportion.hex)/10000).toFixed())
            expect(await pool0.maxPurchaseAmountForEarlyAccess()).to.be.equal((Number(poolInfo0.totalRaiseAmount.hex)*(10000-Number(poolInfo0.galaxyPoolProportion.hex))*Number(poolInfo0.earlyAccessProportion.hex)/10000/10000).toFixed())
            expect(await pool0.communityOpenTime()).to.be.equal(Number(poolInfo0.whaleOpenTime.hex)+Number(poolInfo0.whaleDuration.hex))
        })

        it("Should set merkle tree root successfully by admin; revert without admin", async()=>{
            const {pool0, buyRootHash, admin1, collaborator0} = await loadFixture(deployPool0Fixture)
    
            await pool0.connect(admin1).setRoot(buyRootHash);

            expect(await pool0.root()).to.be.equal(buyRootHash)

            const randomBuyRootHash = hexlify(randomBytes(32))

            await expect(pool0.connect(collaborator0).setRoot(randomBuyRootHash)).to.be.revertedWithCustomError(pool0,"NotAdmin");
        })

        it("Should pause pool and unpause pool by admin; revert without admin", async()=>{
            const {pool0, admin1} = await loadFixture(deployPool0Fixture)
            await pool0.connect(admin1).pausePool();
            expect(await pool0.paused()).to.be.true;
            await pool0.connect(admin1).unpausePool();
            expect(await pool0.paused()).to.be.false;
        })

        it("Should buy token in galaxy pool, early access and open time successfully by all types of user; revert out of time", async()=>{
            const {owner, getProof, PERCENTAGE_DENOMINATOR, poolInfoList, collaborator0, IDOTokens, purchaseTokens, buyMerkleTree, pool0, admin1, buyRootHash, investors, buyWhiteList} = await loadFixture(deployPool0Fixture)
            await pool0.connect(admin1).setRoot(buyRootHash)
            
            // collaborator transfer IDO token to IDO pool
            await IDOTokens[0].connect(collaborator0).transfer(pool0.address, parseUnits('1000000', '28'))

            // update root
            await pool0.connect(admin1).setRoot(buyRootHash)

            // get proof for investor0 in galaxy pool
            const leafInfo0 = buyWhiteList[0]
            const proof0 = getProof(leafInfo0)

            // revert OutOfTime (buy before whaleOpentime)
            await expect(pool0.connect(investors[0]).buyTokenInGalaxyPool(proof0, 100000, leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0,"OutOfTime").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, investors[0].address)
                
            // buy successfully (investor0, WHALE, KYC user, galaxy pool)
            await time.increaseTo(await pool0.whaleOpenTime())
            await expect(pool0.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90',6), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0, 'NotEnoughAllowance')
            await purchaseTokens[0].connect(investors[0]).approve(pool0.address, BigNumber.from(leafInfo0.maxPurchaseBaseOnAllocation).add(1000))
            expect(await pool0.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90',6), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.emit(pool0, "BuyToken").withArgs(investors[0].address, anyValue, anyValue, anyValue) // 90 purchaseToken0
            expect(await pool0.purchasedAmount()).to.be.equal(Number(parseUnits('90',6)))
            // expect(Number((await IDOTokens[0].balanceOf(investors[0].address)).div(parseUnits('1',18)))).to.be.equal(90/poolInfoList[0].price/PERCENTAGE_DENOMINATOR*Number(poolInfoList[0].TGEPercentage))
            expect(await pool0.userIDOTGEAmount(investors[0].address)).to.be.equal(parseUnits((90/poolInfoList[0].price/PERCENTAGE_DENOMINATOR*Number(poolInfoList[0].TGEPercentage)).toString(),18))
            expect(await pool0.userPurchasedAmount(investors[0].address)).to.be.equal(Number(parseUnits('90',6)))

            // get proof for investor1 in galaxy pool
            const leafInfo1 = buyWhiteList[1]
            const proof1 = getProof(leafInfo1)

            // revert buy more than max purchase amount for KYC user (investor1, WHALE, KYC user, galaxy pool)
            await purchaseTokens[0].connect(investors[1]).approve(pool0.address, BigNumber.from(leafInfo1.maxPurchaseBaseOnAllocation))
            await expect(pool0.connect(investors[1]).buyTokenInGalaxyPool(proof1, parseUnits('11000',6), leafInfo1.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0,"ExceedMaxPurchaseAmountForKYCUser").withArgs(investors[1].address, parseUnits('11000',6))

            // get proof for investor2 in galaxy pool
            const leafInfo4 = buyWhiteList[4]
            const proof4 = getProof(leafInfo4)

            // buy successfully (investor2, WHALE, Not KYC user, galaxy pool)
            await purchaseTokens[0].connect(investors[2]).approve(pool0.address, BigNumber.from(leafInfo4.maxPurchaseBaseOnAllocation))
            expect(await pool0.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('870', 6), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.emit(pool0, "BuyToken").withArgs(investors[2].address, anyValue, anyValue, anyValue) // 900 purchaseToken0

            // buy successfully twice (investor2, WHALE, Not KYC user, galaxy pool)
            expect(await pool0.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('100', 6), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.emit(pool0, "BuyToken").withArgs(investors[2].address, anyValue, anyValue, anyValue) // 100 purchaseToken0
            
            // revert buy more than max purchase amount for Not KYC user in twice (investor2, WHALE, Not KYC user, galaxy pool)
            await expect(pool0.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('50', 6), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0, "ExceedMaxPurchaseAmountForNotKYCUser").withArgs(investors[2].address, anyValue)

            // get proof for investor5
            const leafInfo8 = buyWhiteList[8]
            const proof8 = getProof(leafInfo8)

            // revert normal, KYC user buy in galaxy pool (investor4, NORMAL, KYC user, galaxy pool)
            await purchaseTokens[0].connect(investors[5]).approve(pool0.address, parseUnits('1000000',20))
            await expect(pool0.connect(investors[5]).buyTokenInGalaxyPool(proof8, 10, leafInfo8.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0, "ExceedMaxPurchaseAmountForUser")
            await expect(pool0.connect(investors[5]).buyTokenInGalaxyPool(proof8, 10, 10)).to.be.revertedWithCustomError(pool0, "NotInWhaleList").withArgs(investors[5].address)

            // get proof for investor0 in early access
            const leaf0EA = buyWhiteList[2]
            const proof0EA = getProof(leaf0EA)

            // buy successfully (investor0, WHALE, KYC User, early access)
            await purchaseTokens[0].connect(investors[0]).approve(pool0.address, parseUnits('1000000',20))
            const balanceOfInvestor0BeforeBuyToken = await purchaseTokens[0].balanceOf(investors[0].address)
            const balanceOfPool0BeforeBuyToken = await purchaseTokens[0].balanceOf(pool0.address)
            expect(await pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('100',6))).to.be.emit(pool0, "BuyToken").withArgs(investors[0].address, pool0.address, anyValue, anyValue)
            const balanceOfInvestor0AfterBuyToken = await purchaseTokens[0].balanceOf(investors[0].address)
            const balanceOfPool0AfterBuyToken = await purchaseTokens[0].balanceOf(pool0.address)
            expect((balanceOfInvestor0AfterBuyToken).sub(balanceOfInvestor0BeforeBuyToken)).to.be.equal(parseUnits('-110', 6))
            expect((balanceOfPool0AfterBuyToken).sub(balanceOfPool0BeforeBuyToken)).to.be.equal(parseUnits('110',6))

            // buy successfully upto max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            expect(await pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('9800',6))).to.be.emit(pool0, "BuyToken").withArgs(investors[0].address, pool0.address, anyValue, anyValue)

            // revert redeem purchase token
            await expect(pool0.connect(owner).redeemPurchaseToken(owner.address)).to.be.revertedWithCustomError(pool0,"NotEnoughConditionToRedeemPurchaseToken");

            // revert redeem IDO token
            await expect(pool0.connect(owner).redeemIDOToken(owner.address)).to.be.revertedWithCustomError(pool0,"NotEnoughConditionToRedeemIDOToken")

            // revert buy more than max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            await expect(pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('100',6))).to.be.revertedWithCustomError(pool0, "ExceedMaxPurchaseAmountForKYCUser").withArgs(investors[0].address, anyValue)

            // get proof of investor 3 for early access
            const leaf7EA = buyWhiteList[7]
            const proof7EA = getProof(leaf7EA)

            // buy successfully (investor3, WHALE, Not KYC User, early access)
            await purchaseTokens[0].connect(investors[3]).approve(pool0.address, parseUnits('10',20))
            expect(await pool0.connect(investors[3]).buyTokenInCrowdfundingPool(proof7EA, parseUnits('10',6))).to.be.emit(pool0, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);

            // revert buy (investor5, NORMAL, KYC User, early access)
            await expect(pool0.connect(investors[5]).buyTokenInCrowdfundingPool(proof8, parseUnits('10',6))).to.be.revertedWithCustomError(pool0, "NotInWhaleList").withArgs(anyValue)

            await time.increase(await pool0.whaleDuration())
            
            // revert buy out of time for whale 
            await expect(pool0.connect(investors[1]).buyTokenInGalaxyPool(proof1, parseUnits('100',6), leafInfo1.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0,"OutOfTime").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, anyValue)

            // get proof of investor 1 for community (not early access)
            const leaf10NU = buyWhiteList[10]
            const proof10NU = getProof(leaf10NU)

            // buy successfully (investor1, WHALE-NORMAL, KYC user, community pool)
            expect(await pool0.connect(investors[1]).buyTokenInCrowdfundingPool(proof10NU, parseUnits('100', 6))).to.be.emit(pool0, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);

            // get proof of investor 0 for community (not early access)
            const leaf9NU = buyWhiteList[9]
            const proof9NU = getProof(leaf9NU)

            // revert buy more than max purchase of KYC in galaxy, after in early access and lately in community pool (not early access) (investor0, WHALE, KYC User, community pool)
            await expect(pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof9NU, parseUnits('100', 6))).to.be.revertedWithCustomError(pool0, "ExceedMaxPurchaseAmountForKYCUser")

            // buy successfully (investor6, NORMAL, Not KYC user, community pool)
            await purchaseTokens[0].connect(investors[6]).approve(pool0.address, parseUnits('100',20));
            expect(await pool0.connect(investors[6]).buyTokenInCrowdfundingPool([], parseUnits('100',6))).to.be.emit(pool0, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);
        
            await time.increaseTo((await pool0.whaleOpenTime()).add(await pool0.whaleDuration()).add(await pool0.communityDuration()))
            // revert buy because out of time
            await expect(pool0.connect(investors[6]).buyTokenInCrowdfundingPool([], parseUnits('10',6))).to.be.revertedWithCustomError(pool0, "OutOfTime").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, anyValue)

            // console.log(await pool0.userIDOTGEAmount(investors[0].address))
            // console.log(await pool0.userIDOTGEAmount(investors[1].address))
            // console.log(await pool0.userIDOTGEAmount(investors[2].address))
            // console.log(await pool0.userIDOTGEAmount(investors[3].address))
            // console.log(await pool0.userIDOTGEAmount(investors[4].address))
            // console.log(await pool0.userIDOTGEAmount(investors[5].address))
            // console.log(await pool0.userIDOTGEAmount(investors[6].address))

            await expect(pool0.connect(investors[0]).claimTGEIDOToken(await pool0.userIDOTGEAmount(investors[0].address))).to.be.revertedWithCustomError(pool0, "NotAllowedToClaimTGEIDOAmount")
            await pool0.connect(admin1).enableClaimTGEIDOToken()
            await expect(pool0.connect(investors[1]).claimTGEIDOToken(await pool0.userIDOTGEAmount(investors[1].address))).to.be.revertedWithCustomError(pool0, "NotYetTimeToClaimTGE")
            await pool0.connect(admin1).disableClaimTGEIDOToken()
            
            await time.increaseTo(await pool0.TGEDate())
            await pool0.connect(admin1).enableClaimTGEIDOToken();
            const userIDOTGEAmount0 = await pool0.userIDOTGEAmount(investors[0].address);
            expect(await pool0.connect(investors[0]).claimTGEIDOToken(await pool0.userIDOTGEAmount(investors[0].address))).to.be.emit(pool0, "ClaimTGEAmount").withArgs(anyValue, anyValue)
            expect(await IDOTokens[0].balanceOf(investors[0].address)).to.be.equal(userIDOTGEAmount0)

            await expect(pool0.connect(investors[0]).claimTGEIDOToken(parseUnits('10',6))).to.be.revertedWithCustomError(pool0,'ClaimExceedMaxTGEAmount')

            // redeem purchase token by admin
            const balanceOfPurchaseTokenInPool0 = await purchaseTokens[0].balanceOf(pool0.address)
            const balanceOfOwnerBeforeRedeemPurchaseToken = await purchaseTokens[0].balanceOf(owner.address)
            expect(await pool0.connect(admin1).redeemPurchaseToken(owner.address)).to.be.emit(pool0, "RedeemPurchaseToken").withArgs(owner.address, purchaseTokens[0].address, anyValue)
            const balanceOfOwnerAfterRedeemPurchaseToken = await purchaseTokens[0].balanceOf(owner.address)
            expect(balanceOfOwnerAfterRedeemPurchaseToken.sub(balanceOfOwnerBeforeRedeemPurchaseToken)).to.be.equal(balanceOfPurchaseTokenInPool0)
            expect(await purchaseTokens[0].balanceOf(pool0.address)).to.be.equal(0)

            // redeem IDO token by admin
            const balanceOfIDOTokenInPool0 = await IDOTokens[0].balanceOf(pool0.address)
            const balanceOfOwnerBeforeRedeemIDOToken = await IDOTokens[0].balanceOf(owner.address)
            expect(await pool0.connect(admin1).redeemIDOToken(owner.address)).to.be.emit(pool0, "RedeemIDOToken").withArgs(anyValue, anyValue, anyValue)
            const balanceOfOwnerAfterRedeemIDOToken = await IDOTokens[0].balanceOf(owner.address)
            expect(balanceOfOwnerAfterRedeemIDOToken.sub(balanceOfOwnerBeforeRedeemIDOToken)).to.be.equal(balanceOfIDOTokenInPool0)
        })
    })

    describe("Pool 1 - buy with permit",()=>{

        async function deployPool1Fixture(){
            const {jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, 
                poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, PERCENTAGE_DENOMINATOR} = await loadFixture(deployPoolFactoryFixture)
            const poolInfo1 = jsonCopy(poolInfoList[1])
            await poolFactory.connect(owner).registerPoolAddress(collaborator1.address,[poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])
            
            expect(await poolFactory.getRegisteredPoolsLengthByToken(collaborator1.address, poolInfo1.IDOToken)).to.be.equal(1)
            const pool1RegisteredAddresses = await poolFactory.getRegisteredPoolsByToken(collaborator1.address, poolInfo1.IDOToken)
            
            await poolFactory.connect(collaborator1).createPool([poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEDate, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])
            const pool1Address = await poolFactory.getCreatedPools(collaborator1.address, poolInfo1.IDOToken, 0)
            expect(pool1Address).to.be.equal(pool1RegisteredAddresses[0])

            await poolFactory.connect(owner).grantAdminRole(admin1.address)

            const pool1 = new Pool__factory(owner).attach(pool1Address)
            
            const WHALE_HASH = solidityKeccak256(["string"],["WHALE"])
            const NORMAL_USER_HASH = solidityKeccak256(["string"],["NORMAL_USER"])
            
            const signPermit = async(signer: SignerWithAddress, name: string, tokenAddr: string, spender: string, value: BigNumber, nonce: BigNumber, deadline: BigNumber)=>{
                // All properties on a domain are optional
                const domain = {
                    name,
                    version: '1',
                    chainId: 31337,
                    verifyingContract: tokenAddr
                };
        
                // The named list of all type definitions
                const types = {
                    Permit: [
                        { name: 'owner', type: 'address'},
                        { name: 'spender', type: 'address'},
                        { name: 'value', type: 'uint256'},
                        { name: 'nonce', type: 'uint256'},
                        { name: 'deadline', type: 'uint256'}
                    ]
                };
        
                // The data to sign
                const signValue = {
                    owner: signer.address,
                    spender,
                    value,
                    nonce,
                    deadline
                };
        
                return await signer._signTypedData(domain, types, signValue);
            }

            // whale: investors: 0, 1, 2, 3
            // normal_user: investors: 4, 5, 6
            // KYC_user: investors: 0, 1, 5

            // whale + KYC: 0,1    (1)
            // whale + notKYC: 2,3 (2)
            // normal + KYC: 5     (3)

            // leaf [address+WHALE+10_000+maxPurchaseBaseOnAllocation]: (1) (>> Galaxy pool)
            // leaf [address+WHALE+10_000+0]:                           (1) (>> Early access pool)
            // leaf [address+WHALE+1_000+maxPurchaseBaseOnAllocation]:  (2) (>> Galaxy pool)
            // leaf [address+WHALE+1_000+0]:                            (2) (>> Early access pool)
            // leaf [address+NORMAL_USER+10_000+0]:                     (3)+(1)

            const PAIDBalanceList = [
                75000, //0
                150000, //1
                93750, //2
                243750, //3
                18750, //4
                1000, //5
                10000, //6
            ]

            const PAIDTotalForGalaxyPool = PAIDBalanceList.reduce(
                (accumulator, currentValue)=>
                    {
                        if(currentValue >= 75000) return accumulator+currentValue
                        else return accumulator
                    },
                    0
            )

            const maxPurchaseAmountForGalaxyPool_pool1 = BigNumber.from(Number(poolInfo1.totalRaiseAmount.hex)*Number(poolInfo1.galaxyPoolProportion.hex)/PERCENTAGE_DENOMINATOR);

            const buyWhiteList = [
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool1) / PAIDTotalForGalaxyPool * PAIDBalanceList[0]).toFixed())
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool1) / PAIDTotalForGalaxyPool * PAIDBalanceList[1]).toFixed())
                },
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool1) / PAIDTotalForGalaxyPool * PAIDBalanceList[2]).toFixed())
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Number((Number(maxPurchaseAmountForGalaxyPool_pool1) / PAIDTotalForGalaxyPool * PAIDBalanceList[3]).toFixed())
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[5].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[0].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[1].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo1.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                }
            ]
            
            const leafNodes = buyWhiteList.map((obj) => {
                let leafNode = solidityPack(
                  ["address", "bytes32", "uint256","uint256"],
                  [obj.candidate, obj.userType, obj.maxPurchaseWhetherOrNotKYC, obj.maxPurchaseBaseOnAllocation]
                );
                return ethers.utils.solidityKeccak256(["bytes"], [leafNode]);
            });

            const buyMerkleTree = new MerkleTree(leafNodes, keccak256, {
                sortPairs: true,
            });

            const buyRootHash = hexlify(buyMerkleTree.getRoot());

            function getProof(leafInfo: {candidate: string, userType: string, maxPurchaseWhetherOrNotKYC: number, maxPurchaseBaseOnAllocation: number}){
                const leaf = solidityPack(
                    ["address", "bytes32", "uint256","uint256"],
                    [leafInfo.candidate, leafInfo.userType, leafInfo.maxPurchaseWhetherOrNotKYC, leafInfo.maxPurchaseBaseOnAllocation]
                )
                const leafNode = solidityKeccak256(["bytes"],[leaf])
                const proof = buyMerkleTree.getHexProof(leafNode)
                return proof
            }


            return {signPermit, getProof, PERCENTAGE_DENOMINATOR, buyMerkleTree, buyWhiteList, buyRootHash, jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, pool1}
        }
        it("Should get info from pool after created", async()=>{
            const {jsonCopy, pool1, poolInfoList} = await loadFixture(deployPool1Fixture)
            const poolInfo1 = jsonCopy(poolInfoList[1])

            expect(await pool1.IDOToken()).to.be.equal(poolInfo1.IDOToken)
            expect(await pool1.purchaseToken()).to.be.equal(poolInfo1.purchaseToken)
            expect(Number((await pool1.offeredCurrency()).rate)).to.be.equal(Number(poolInfo1.rate.hex))
            expect((await pool1.offeredCurrency()).decimal).to.be.equal(Number(poolInfo1.decimal.hex))
            expect(await pool1.maxPurchaseAmountForKYCUser()).to.be.equal(Number(poolInfo1.maxPurchaseAmountForKYCUser.hex))
            expect(await pool1.maxPurchaseAmountForNotKYCUser()).to.be.equal(Number(poolInfo1.maxPurchaseAmountForNotKYCUser.hex))
            expect(await pool1.TGEPercentage()).to.be.equal(Number(poolInfo1.TGEPercentage.hex))
            expect(await pool1.participationFeePercentage()).to.be.equal(Number(poolInfo1.participationFeePercentage.hex))
            expect(await pool1.galaxyPoolProportion()).to.be.equal(Number(poolInfo1.galaxyPoolProportion.hex))
            expect(await pool1.earlyAccessProportion()).to.be.equal(Number(poolInfo1.earlyAccessProportion.hex))
            expect(await pool1.totalRaiseAmount()).to.be.equal(Number(poolInfo1.totalRaiseAmount.hex))
            expect(await pool1.whaleOpenTime()).to.be.equal(Number(poolInfo1.whaleOpenTime.hex))
            expect(await pool1.whaleDuration()).to.be.equal(Number(poolInfo1.whaleDuration.hex))
            expect(await pool1.communityDuration()).to.be.equal(Number(poolInfo1.communityDuration.hex))

            expect(await pool1.maxPurchaseAmountForGalaxyPool()).to.be.equal((Number(poolInfo1.totalRaiseAmount.hex)*Number(poolInfo1.galaxyPoolProportion.hex)/10000).toFixed())
            expect(await pool1.maxPurchaseAmountForEarlyAccess()).to.be.equal((Number(poolInfo1.totalRaiseAmount.hex)*(10000-Number(poolInfo1.galaxyPoolProportion.hex))*Number(poolInfo1.earlyAccessProportion.hex)/10000/10000).toFixed())
            expect(await pool1.communityOpenTime()).to.be.equal(Number(poolInfo1.whaleOpenTime.hex)+Number(poolInfo1.whaleDuration.hex))
        })

        it("Should set merkle tree root successfully by admin; revert without admin", async()=>{
            const {pool1, buyRootHash, admin1, collaborator1} = await loadFixture(deployPool1Fixture)
    
            await pool1.connect(admin1).setRoot(buyRootHash);

            expect(await pool1.root()).to.be.equal(buyRootHash)

            const randomBuyRootHash = hexlify(randomBytes(32))

            await expect(pool1.connect(collaborator1).setRoot(randomBuyRootHash)).to.be.revertedWithCustomError(pool1,"NotAdmin");
        })

        it("Should pause pool and unpause pool by admin; revert without admin", async()=>{
            const {pool1, admin1} = await loadFixture(deployPool1Fixture)
            await pool1.connect(admin1).pausePool();
            expect(await pool1.paused()).to.be.true;
            await pool1.connect(admin1).unpausePool();
            expect(await pool1.paused()).to.be.false;
        })

        it("Should buy token in galaxy pool, early access and open time successfully by all types of user; revert out of time", async()=>{
            const {zeroAddress, signPermit, owner, getProof, PERCENTAGE_DENOMINATOR, poolInfoList, collaborator1, IDOTokens, purchaseTokens, buyMerkleTree, pool1, admin1, buyRootHash, investors, buyWhiteList} = await loadFixture(deployPool1Fixture)
            await pool1.connect(admin1).setRoot(buyRootHash)

            const purchaseToken1Name = await purchaseTokens[1].name()
            const purchaseToken1Decimal = await purchaseTokens[1].decimals()   
            const purchaseToken1Addr = purchaseTokens[1].address 

            // extend time for pool
            const communityEndtime = (await pool1.communityOpenTime()).add(await pool1.communityDuration())
            await pool1.connect(admin1).extendCommunityTime(24*60*60)
            const durationDelta = 24*60*60
            await expect(pool1.connect(collaborator1).extendCommunityTime(durationDelta)).to.be.reverted;
            const communityEndtimeAfterExtending = (await pool1.communityOpenTime()).add(await pool1.communityDuration())
            expect(communityEndtimeAfterExtending.sub(communityEndtime)).to.be.equal(durationDelta)

            // collaborator transfer IDO token to IDO pool
            await IDOTokens[1].connect(collaborator1).transfer(pool1.address, parseUnits('1000000', '28'))

            // update root
            await pool1.connect(admin1).setRoot(buyRootHash)

            // get proof for investor0 in galaxy pool
            const leafInfo0 = buyWhiteList[0]
            const proof0 = getProof(leafInfo0)

            // revert OutOfTime (buy before whaleOpentime)
            const deadline0Revert = BigNumber.from((Date.now()/1000).toFixed()).add(30*24*60*60)
            const signature0Revert = await signPermit(investors[0],purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('90', purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[0].address), deadline0Revert)
            await expect(pool1.connect(investors[0]).buyTokenInGalaxyPoolWithPermit(proof0, parseUnits('90', purchaseToken1Decimal), leafInfo0.maxPurchaseBaseOnAllocation, deadline0Revert, signature0Revert)).to.be.revertedWithCustomError(pool1, "OutOfTime").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, investors[0].address)
            
            await time.increaseTo(await pool1.whaleOpenTime())

            // buy successfully without permit function (investor0, WHALE, KYC user, galaxy pool)
            await purchaseTokens[1].connect(investors[0]).approve(pool1.address, BigNumber.from(leafInfo0.maxPurchaseBaseOnAllocation).add(1000))
            expect(await pool1.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90',purchaseToken1Decimal), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.emit(pool1, "BuyToken").withArgs(investors[0].address, anyValue, anyValue, anyValue) // 90 purchaseToken0
            expect(await pool1.purchasedAmount()).to.be.equal(Number(parseUnits('90',purchaseToken1Decimal)))
            // expect(Number((await IDOTokens[1].balanceOf(investors[0].address)).div(parseUnits('1',18)))).to.be.equal(90/poolInfoList[1].price/PERCENTAGE_DENOMINATOR*Number(poolInfoList[1].TGEPercentage))
            expect(await pool1.userIDOTGEAmount(investors[0].address)).to.be.equal(parseUnits(((90*(10**6)/poolInfoList[1].price/PERCENTAGE_DENOMINATOR*Number(poolInfoList[1].TGEPercentage)).toFixed()).toString(),0))
            expect(await pool1.userPurchasedAmount(investors[0].address)).to.be.equal(Number(parseUnits('90',purchaseToken1Decimal)))

            // buy successfully (investor0, WHALE, KYC user, galaxy pool)
            const deadline0 = BigNumber.from((Date.now()/1000).toFixed()).add(30*24*60*60)
            const signature0 = await signPermit(investors[0],purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('90', purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[0].address), deadline0)
            expect(await pool1.connect(investors[0]).buyTokenInGalaxyPoolWithPermit(proof0, parseUnits('90', purchaseToken1Decimal), leafInfo0.maxPurchaseBaseOnAllocation, deadline0, signature0)).to.be.emit(pool1, "BuyToken").withArgs(investors[0].address, anyValue, anyValue, anyValue)
            expect(await pool1.purchasedAmount()).to.be.equal(Number(parseUnits('180',purchaseToken1Decimal)))
            expect(await pool1.userPurchasedAmount(investors[0].address)).to.be.equal(Number(parseUnits('180',purchaseToken1Decimal)))

            // revert buy more than allocation (investor0, WHALE, KYC user, galaxy pool)
            const signature00 = await signPermit(investors[0], purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('9000', purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[0].address), deadline0)
            await expect(pool1.connect(investors[0]).buyTokenInGalaxyPoolWithPermit(proof0, parseUnits('9000', purchaseToken1Decimal), leafInfo0.maxPurchaseBaseOnAllocation, deadline0, signature00)).to.be.revertedWithCustomError(pool1, "ExceedMaxPurchaseAmountForUser")
            
            // get proof for investor1 in galaxy pool
            const leafInfo1 = buyWhiteList[1]
            const proof1 = getProof(leafInfo1)

            // revert buy more than max purchase amount for KYC user (investor1, WHALE, KYC user, galaxy pool)
            // const signature1 = await signPermit(investors[1], purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('31000', purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[1].address), deadline0)
            // await expect(pool1.connect(investors[1]).buyTokenInGalaxyPoolWithPermit(proof1, parseUnits('31000', purchaseToken1Decimal), leafInfo1.maxPurchaseBaseOnAllocation, deadline0, signature1)).to.be.revertedWithCustomError(pool1, "ExceedMaxPurchaseAmountForKYCUser").withArgs(anyValue, anyValue)
            
            // get proof for investor2 in galaxy pool
            const leafInfo4 = buyWhiteList[4]
            const proof4 = getProof(leafInfo4)

            // buy successfully (investor2, WHALE, Not KYC user, galaxy pool)
            const signature4 = await signPermit(investors[2], purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('1000',purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[2].address), deadline0)
            expect(await pool1.connect(investors[2]).buyTokenInGalaxyPoolWithPermit(proof4, parseUnits('1000', purchaseToken1Decimal), leafInfo4.maxPurchaseBaseOnAllocation, deadline0, signature4)).to.be.emit(pool1, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue)
            
            // buy successfully twice (investor2, WHALE, Not KYC user, galaxy pool)
            const signature44 = await signPermit(investors[2], purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('2000',purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[2].address), deadline0)
            expect(await pool1.connect(investors[2]).buyTokenInGalaxyPoolWithPermit(proof4, parseUnits('2000', purchaseToken1Decimal), leafInfo4.maxPurchaseBaseOnAllocation, deadline0, signature44)).to.be.emit(pool1, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue)
            
            // get proof for investor3 in galaxy pool
            const leafInfo5 = buyWhiteList[5]
            const proof5 = getProof(leafInfo5)
            
            // revert buy more than max purchase amount for Not KYC user in twice (investor3, WHALE, Not KYC user, galaxy pool)
            const signature5 = await signPermit(investors[3], purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('16000',purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[3].address), deadline0)
            await expect(pool1.connect(investors[3]).buyTokenInGalaxyPoolWithPermit(proof5, parseUnits('16000', purchaseToken1Decimal), leafInfo5.maxPurchaseBaseOnAllocation, deadline0, signature5)).to.be.revertedWithCustomError(pool1, "ExceedMaxPurchaseAmountForNotKYCUser").withArgs(anyValue, anyValue)

            // get proof for investor5
            const leafInfo8 = buyWhiteList[8]
            const proof8 = getProof(leafInfo8)

            // revert normal, KYC user buy in galaxy pool (investor4, NORMAL, KYC user, galaxy pool)
            const signature8 = await signPermit(investors[5], purchaseToken1Name, purchaseToken1Addr, pool1.address, BigNumber.from('10'), await purchaseTokens[1].nonces(investors[5].address), deadline0)
            await expect(pool1.connect(investors[5]).buyTokenInGalaxyPoolWithPermit(proof8, BigNumber.from('10'), BigNumber.from('10'), deadline0, signature8)).to.be.revertedWithCustomError(pool1, "NotInWhaleList").withArgs(investors[5].address)

            // get proof for investor0 in early access
            const leaf0EA = buyWhiteList[2]
            const proof0EA = getProof(leaf0EA)

            // buy successfully (investor0, WHALE, KYC User, early access)
            const allowance0EA = parseUnits('1820',purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('1820',purchaseToken1Decimal))
            const signature0EA = await signPermit(investors[0], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance0EA, await purchaseTokens[1].nonces(investors[0].address), deadline0)
            const balanceOfInvestor0BeforeBuyToken = await purchaseTokens[1].balanceOf(investors[0].address)
            const balanceOfpool1BeforeBuyToken = await purchaseTokens[1].balanceOf(pool1.address)
            expect(await pool1.connect(investors[0]).buyTokenInCrowdfundingPoolWithPermit(proof0EA, parseUnits('1820', purchaseToken1Decimal), allowance0EA, deadline0, signature0EA))
            const balanceOfInvestor0AfterBuyToken = await purchaseTokens[1].balanceOf(investors[0].address)
            const balanceOfpool1AfterBuyToken = await purchaseTokens[1].balanceOf(pool1.address)
            expect((balanceOfInvestor0AfterBuyToken).sub(balanceOfInvestor0BeforeBuyToken)).to.be.equal(BigNumber.from('0').sub(allowance0EA))
            expect((balanceOfpool1AfterBuyToken).sub(balanceOfpool1BeforeBuyToken)).to.be.equal(allowance0EA)

            // revert redeem purchase token
            await expect(pool1.connect(owner).redeemPurchaseToken(owner.address)).to.be.revertedWithCustomError(pool1,"NotEnoughConditionToRedeemPurchaseToken");

            // revert redeem IDO token
            await expect(pool1.connect(owner).redeemIDOToken(owner.address)).to.be.revertedWithCustomError(pool1,"NotEnoughConditionToRedeemIDOToken")

            // buy successfully more than allocation in galaxy pool; not more than max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            const allowance0EA0 = parseUnits('8000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('8000', purchaseToken1Decimal))
            const signature0EA0 = await signPermit(investors[0], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance0EA0, await purchaseTokens[1].nonces(investors[0].address), deadline0)
            expect(await pool1.connect(investors[0]).buyTokenInCrowdfundingPoolWithPermit(proof0EA, parseUnits('8000', purchaseToken1Decimal), allowance0EA0, deadline0, signature0EA0)).to.be.emit(pool1, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue)
            
            // get proof of investor 3 for early access
            const leaf7EA = buyWhiteList[7]
            const proof7EA = getProof(leaf7EA)

            // revert buy more than max purchase in early access (investor3, WHALE, Not KYC User, early access)
            const allowance7EA = parseUnits('18000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('18000', purchaseToken1Decimal))
            const signature7EA = await signPermit(investors[3], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance7EA, await purchaseTokens[1].nonces(investors[3].address), deadline0)
            await expect(pool1.connect(investors[3]).buyTokenInCrowdfundingPoolWithPermit(proof7EA, parseUnits('18000', purchaseToken1Decimal), allowance7EA, deadline0, signature7EA)).to.be.revertedWithCustomError(pool1, 'ExceedMaxPurchaseAmountForEarlyAccess').withArgs(anyValue, anyValue)
            
            // revert buy (investor5, NORMAL, KYC User, early access)
            const allowance8EA = parseUnits('10', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('10', purchaseToken1Decimal))
            const signature8EA = await signPermit(investors[5], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance8EA, await purchaseTokens[1].nonces(investors[5].address), deadline0)
            await expect(pool1.connect(investors[5]).buyTokenInCrowdfundingPoolWithPermit(proof8, parseUnits('10', purchaseToken1Decimal), allowance8EA, deadline0, signature8EA)).to.be.revertedWithCustomError(pool1, 'NotInWhaleList')

            await time.increase(await pool1.whaleDuration())
            
            // revert buy out of time for whale 
            const signature0Revert0 = await signPermit(investors[1], purchaseToken1Name, purchaseToken1Addr, pool1.address, parseUnits('10',purchaseToken1Decimal), await purchaseTokens[1].nonces(investors[1].address), deadline0)
            await expect(pool1.connect(investors[1]).buyTokenInGalaxyPoolWithPermit(proof1, parseUnits('10',purchaseToken1Decimal), leafInfo1.maxPurchaseBaseOnAllocation, deadline0, signature0Revert0)).to.be.revertedWithCustomError(pool1, 'OutOfTime')
            
            // get proof of investor 1 for community (not early access)
            const leaf10NU = buyWhiteList[10]
            const proof10NU = getProof(leaf10NU)

            // buy successfully (investor1, WHALE-NORMAL, KYC user, community pool)
            // expect(await pool1.connect(investors[1]).buyTokenInCrowdfundingPool(proof10NU, parseUnits('100', 6))).to.be.emit(pool1, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);
            const allowance10NU = parseUnits('10', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('10', purchaseToken1Decimal))
            const signature10NU = await signPermit(investors[1], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance10NU, await purchaseTokens[1].nonces(investors[1].address), deadline0)
            expect(await pool1.connect(investors[1]).buyTokenInCrowdfundingPoolWithPermit(proof10NU, parseUnits('10', purchaseToken1Decimal), allowance10NU, deadline0, signature10NU)).to.be.emit(pool1, "BuyToken")
            
            // get proof of investor 0 for community (not early access)
            const leaf9NU = buyWhiteList[9]
            const proof9NU = getProof(leaf9NU)

            // revert buy more than max purchase of KYC in galaxy, after in early access and lately in community pool (not early access) (investor0, WHALE, KYC User, community pool)
            const allowance9NU = parseUnits('30000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('30000', purchaseToken1Decimal))
            const signature9NU = await signPermit(investors[0], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance9NU, await purchaseTokens[1].nonces(investors[0].address), deadline0)
            await expect(pool1.connect(investors[0]).buyTokenInCrowdfundingPoolWithPermit(proof9NU, parseUnits('30000', purchaseToken1Decimal), allowance9NU, deadline0, signature9NU)).to.be.revertedWithCustomError(pool1, 'ExceedMaxPurchaseAmountForKYCUser')
            
            // buy successfully (investor6, NORMAL, Not KYC user, community pool)
            const allowance12NU = parseUnits('3000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('3000', purchaseToken1Decimal))
            const signature12NU = await signPermit(investors[6], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance12NU, await purchaseTokens[1].nonces(investors[6].address), deadline0)
            expect(await pool1.connect(investors[6]).buyTokenInCrowdfundingPoolWithPermit([], parseUnits('3000', purchaseToken1Decimal), allowance12NU, deadline0, signature12NU)).to.be.emit(pool1, 'BuyToken')
            
            const leaf8NU = buyWhiteList[8]
            const proof8NU = getProof(leaf8NU)
            const allowance13NU = parseUnits('30000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('30000', purchaseToken1Decimal))
            const signature13NU = await signPermit(investors[5], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance13NU, await purchaseTokens[1].nonces(investors[5].address), deadline0)
            await pool1.connect(investors[5]).buyTokenInCrowdfundingPoolWithPermit(proof8NU,parseUnits('30000', purchaseToken1Decimal), allowance13NU, deadline0, signature13NU)

            const allowance14NU = parseUnits('14998', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('14998', purchaseToken1Decimal))
            const signature14NU = await signPermit(investors[7], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance14NU, await purchaseTokens[1].nonces(investors[7].address), deadline0)
            await pool1.connect(investors[7]).buyTokenInCrowdfundingPoolWithPermit([],parseUnits('14998', purchaseToken1Decimal), allowance14NU, deadline0, signature14NU)
            
            const allowance15NU = parseUnits('14999', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('14999', purchaseToken1Decimal))
            const signature15NU = await signPermit(investors[8], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance15NU, await purchaseTokens[1].nonces(investors[8].address), deadline0)
            await pool1.connect(investors[8]).buyTokenInCrowdfundingPoolWithPermit([],parseUnits('14999', purchaseToken1Decimal), allowance15NU, deadline0, signature15NU)
            
            const allowance16NU = parseUnits('15000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('15000', purchaseToken1Decimal))
            const signature16NU = await signPermit(investors[9], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance16NU, await purchaseTokens[1].nonces(investors[9].address), deadline0)
            await expect(pool1.connect(investors[9]).buyTokenInCrowdfundingPoolWithPermit([], 0, allowance16NU, deadline0, signature16NU)).to.be.revertedWithCustomError(pool1, 'ZeroAmount')
            await pool1.connect(investors[9]).buyTokenInCrowdfundingPoolWithPermit([],parseUnits('15000', purchaseToken1Decimal), allowance16NU, deadline0, signature16NU)

            const allowance17NU = parseUnits('15000', purchaseToken1Decimal).mul(poolInfoList[1].participationFeePercentage).div(PERCENTAGE_DENOMINATOR).add(parseUnits('15000', purchaseToken1Decimal))
            const signature17NU = await signPermit(investors[10], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance17NU, await purchaseTokens[1].nonces(investors[10].address), deadline0)
            await expect(pool1.connect(investors[10]).buyTokenInCrowdfundingPoolWithPermit([],parseUnits('15000', purchaseToken1Decimal), allowance17NU, deadline0, signature17NU)).to.be.revertedWithCustomError(pool1, 'ExceedTotalRaiseAmount')

            await time.increaseTo((await pool1.whaleOpenTime()).add(await pool1.whaleDuration()).add(await pool1.communityDuration()))
            // revert buy because out of time
            const signature12NU12 = await signPermit(investors[6], purchaseToken1Name, purchaseToken1Addr, pool1.address, allowance12NU, await purchaseTokens[1].nonces(investors[6].address), deadline0)
            await expect(pool1.connect(investors[6]).buyTokenInCrowdfundingPoolWithPermit([], parseUnits('3000', purchaseToken1Decimal), allowance12NU, deadline0, signature12NU12.substring(0,64))).to.be.revertedWithCustomError(pool1, 'NotValidSignature')
            await expect(pool1.connect(investors[6]).buyTokenInCrowdfundingPoolWithPermit([], parseUnits('3000', purchaseToken1Decimal), allowance12NU, deadline0, signature12NU12)).to.be.revertedWithCustomError(pool1, "OutOfTime")

            
            // console.log(await pool1.userIDOTGEAmount(investors[0].address))
            // console.log(await pool1.userIDOTGEAmount(investors[1].address))
            // console.log(await pool1.userIDOTGEAmount(investors[2].address))
            // console.log(await pool1.userIDOTGEAmount(investors[3].address))
            // console.log(await pool1.userIDOTGEAmount(investors[4].address))
            // console.log(await pool1.userIDOTGEAmount(investors[5].address))
            // console.log(await pool1.userIDOTGEAmount(investors[6].address))

            await pool1.connect(admin1).enableClaimTGEIDOToken();
            await expect(pool1.connect(investors[0]).claimTGEIDOToken(await pool1.userIDOTGEAmount(investors[0].address))).to.be.revertedWithCustomError(pool1, "NotYetTimeToClaimTGE")
            await expect(pool1.connect(investors[1]).claimTGEIDOToken(await pool1.userIDOTGEAmount(investors[1].address))).to.be.revertedWithCustomError(pool1, "NotYetTimeToClaimTGE")
            await expect(pool1.connect(admin1).enableClaimTGEIDOToken()).to.be.revertedWithCustomError(pool1,"AlreadyEnableClaimTGE");
            await pool1.connect(admin1).disableClaimTGEIDOToken();

            await time.increaseTo(await pool1.TGEDate())
            await expect(pool1.connect(admin1).disableClaimTGEIDOToken()).to.be.revertedWithCustomError(pool1, 'AlreadyDisableClaimTGE')
            await pool1.connect(admin1).enableClaimTGEIDOToken();

            const userIDOTGEAmount0 = await pool1.userIDOTGEAmount(investors[0].address);
            expect(await pool1.connect(investors[0]).claimTGEIDOToken(await pool1.userIDOTGEAmount(investors[0].address))).to.be.emit(pool1, "ClaimTGEAmount").withArgs(anyValue, anyValue)
            expect(await IDOTokens[1].balanceOf(investors[0].address)).to.be.equal(userIDOTGEAmount0)

            await expect(pool1.connect(investors[0]).claimTGEIDOToken(parseUnits('10',16))).to.be.revertedWithCustomError(pool1,'ClaimExceedMaxTGEAmount')

            // redeem purchase token by admin
            const balanceOfPurchaseTokenInpool1 = await purchaseTokens[1].balanceOf(pool1.address)
            const balanceOfOwnerBeforeRedeemPurchaseToken = await purchaseTokens[1].balanceOf(owner.address)
            await expect(pool1.connect(admin1).redeemPurchaseToken(zeroAddress)).to.be.revertedWithCustomError(pool1, 'ZeroAddress')
            expect(await pool1.connect(admin1).redeemPurchaseToken(owner.address)).to.be.emit(pool1, "RedeemPurchaseToken").withArgs(owner.address, purchaseTokens[1].address, anyValue)
            const balanceOfOwnerAfterRedeemPurchaseToken = await purchaseTokens[1].balanceOf(owner.address)
            expect(balanceOfOwnerAfterRedeemPurchaseToken.sub(balanceOfOwnerBeforeRedeemPurchaseToken)).to.be.equal(balanceOfPurchaseTokenInpool1)
            expect(await purchaseTokens[1].balanceOf(pool1.address)).to.be.equal(0)

            // redeem IDO token by admin
            const balanceOfIDOTokenInpool1 = await IDOTokens[1].balanceOf(pool1.address)
            const balanceOfOwnerBeforeRedeemIDOToken = await IDOTokens[1].balanceOf(owner.address)
            expect(await pool1.connect(admin1).redeemIDOToken(owner.address)).to.be.emit(pool1, "RedeemIDOToken").withArgs(anyValue, anyValue, anyValue)
            const balanceOfOwnerAfterRedeemIDOToken = await IDOTokens[1].balanceOf(owner.address)
            expect(balanceOfOwnerAfterRedeemIDOToken.sub(balanceOfOwnerBeforeRedeemIDOToken)).to.be.equal(balanceOfIDOTokenInpool1)
        })
    })
})
