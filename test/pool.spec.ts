import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
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
import { randomBytes } from "crypto"

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

        const {provider} = ethers;

        [owner, admin1, admin2, admin3, collaborator0, 
        collaborator1, collaborator2, ...investors] = await ethers.getSigners();

        pool = await new Pool__factory(owner).deploy();
        poolFactory = await new PoolFactory__factory(owner).deploy();
        await poolFactory.initialize(pool.address)

        purchaseTokens = [
            await new ERC20Token__factory(owner).deploy("PurchaseToken0","PurchaseToken0"),
            await new ERC20Token__factory(owner).deploy("PurchaseToken1","PurchaseToken1"),
            await new ERC20Token__factory(owner).deploy("PurchaseToken2","PurchaseToken2"),
            await new ERC20Token__factory(owner).deploy("PurchaseToken3","PurchaseToken3"),
            await new ERC20Token__factory(owner).deploy("PurchaseToken4","PurchaseToken4"),
        ]

        IDOTokens = [
            await new ERC20Token__factory(owner).deploy("IDOToken0","IDOToken0"),
            await new ERC20Token__factory(owner).deploy("IDOToken1","IDOToken1"),
            await new ERC20Token__factory(owner).deploy("IDOToken2","IDOToken2"),
            await new ERC20Token__factory(owner).deploy("IDOToken3","IDOToken3"),
            await new ERC20Token__factory(owner).deploy("IDOToken4","IDOToken4"),
        ]

        poolInfoList = [
            {
                IDOToken: IDOTokens[0].address,
                purchaseToken: purchaseTokens[0].address,
                maxPurchaseAmountForKYCUser: parseUnits('10000',6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000',6),
                TGEPercentage: BigNumber.from('2000'),
                participationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('9000000',6),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()+3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(48*60*60),
                rate: parseUnits('125',12),
                decimal: BigNumber.from(1)
            },
            {
                IDOToken: IDOTokens[1].address,
                purchaseToken: purchaseTokens[1].address,
                maxPurchaseAmountForKYCUser: parseUnits('20000',8),
                maxPurchaseAmountForNotKYCUser: parseUnits('1500',8),
                TGEPercentage: BigNumber.from('1000'),
                participationFeePercentage: BigNumber.from('1500'),
                galaxyPoolProportion: BigNumber.from('5000'),
                earlyAccessProportion: BigNumber.from('5000'),
                totalRaiseAmount: parseUnits('10000000', 8),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()+3*24*60*60),
                whaleDuration: BigNumber.from(12*60*60),
                communityDuration: BigNumber.from(24*60*60),
                rate: BigNumber.from('35714285714285714285'),
                decimal: BigNumber.from(20)
            },
            {
                IDOToken: IDOTokens[2].address,
                purchaseToken: purchaseTokens[2].address,
                maxPurchaseAmountForKYCUser: parseUnits('10000',18),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000',18),
                TGEPercentage: BigNumber.from('1000'),
                participationFeePercentage: BigNumber.from('1500'),
                galaxyPoolProportion: BigNumber.from('1000'),
                earlyAccessProportion: BigNumber.from('6000'),
                totalRaiseAmount: parseUnits('8000000',18),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()+3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(24*60*60),
                rate: BigNumber.from(1),
                decimal: BigNumber.from(9)
            },
            {
                IDOToken: IDOTokens[3].address,
                purchaseToken: purchaseTokens[3].address,
                maxPurchaseAmountForKYCUser: parseUnits('2000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                TGEPercentage: BigNumber.from('3000'),
                participationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('850000',6),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()+3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(12*60*60),
                rate: BigNumber.from('1818181818181818100'),
                decimal: BigNumber.from(18)
            },
            {
                IDOToken: IDOTokens[4].address,
                purchaseToken: purchaseTokens[4].address,
                maxPurchaseAmountForKYCUser: parseUnits('2000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                TGEPercentage: BigNumber.from('3000'),
                participationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('850000',6),
                whaleOpenTime: BigNumber.from((Date.now()/1000).toFixed()+3*24*60*60),
                whaleDuration: BigNumber.from(24*60*60),
                communityDuration: BigNumber.from(12*60*60),
                rate: BigNumber.from('1818181818181818100'),
                decimal: BigNumber.from(18)
            },
        ]

        return {jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2,
        investors, poolFactory, pool, zeroAddress, provider, IDOTokens, purchaseTokens, poolInfoList}
    }

    describe("Pool Factory",()=>{
        it("Should deploy pool factory and initialize pool implementation address successfully", async()=>{
            const {poolFactory, pool} = await loadFixture(deployPoolFactoryFixture)
            expect(poolFactory.address).to.be.a.properAddress;
            expect(await poolFactory.poolImplementationAddress()).to.be.equal(pool.address)
        })

        it("Should grant, revoke admin successfully by admin; revert grant for zero addres, revert grant twice for 2 admin, revert revoke for account not be an admin", async()=>{
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
            const poolInfo0 = jsonCopy(poolInfoList[0])
            await poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])

            expect(await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo0.IDOToken)).to.be.equal(0)

            const poolInfo0Index = await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo0.IDOToken)
            const poolInfo0Hash = await poolFactory.hashPoolInfo([poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])

            expect(await poolFactory.registerPools(collaborator0.address, poolInfo0Hash, poolInfo0Index)).to.be.not.equal(zeroAddress)
            expect(await poolFactory.registerPools(collaborator0.address, poolInfo0Hash, poolInfo0Index)).to.be.equal(await poolFactory.getRegisteredPools(collaborator0.address, poolInfo0.IDOToken,0))

            await expect(poolFactory.connect(collaborator0).registerPoolAddress(collaborator0.address, [poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])).to.be.reverted;

            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.IDOToken = zeroAddress;
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAddress")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.purchaseToken = zeroAddress
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAddress")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.galaxyPoolProportion = BigNumber.from('100000')
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"NotValidGalaxyPoolProportion")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.earlyAccessProportion = BigNumber.from('23400')
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"NotValidEarlyAccessProportion")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.totalRaiseAmount = BigNumber.from(0)
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAmount")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.communityDuration = BigNumber.from(0)
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAmount")
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.rate = BigNumber.from(0)
                await expect(poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo4.IDOToken, poolInfo4.purchaseToken],
                    [poolInfo4.maxPurchaseAmountForKYCUser, poolInfo4.maxPurchaseAmountForNotKYCUser, poolInfo4.TGEPercentage, poolInfo4.participationFeePercentage,
                    poolInfo4.galaxyPoolProportion, poolInfo4.earlyAccessProportion, poolInfo4.totalRaiseAmount, poolInfo4.whaleOpenTime, poolInfo4.whaleDuration,
                    poolInfo4.communityDuration, poolInfo4.rate, poolInfo4.decimal])).to.be.revertedWithCustomError(poolFactory,"ZeroAmount")
            }
        })

        it("Should register by admin and create new pool by collaborator; revert create by other user", async()=>{
            const {jsonCopy, owner, admin1, collaborator0, poolInfoList, poolFactory, collaborator1} = await loadFixture(deployPoolFactoryFixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])
            await poolFactory.connect(owner).registerPoolAddress(collaborator0.address, [poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
                
            await poolFactory.connect(collaborator0).createPool([poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
            
            expect(await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo0.IDOToken)).to.be.equal(1)
            expect(await poolFactory.getCreatedPools(collaborator0.address, poolInfo0.IDOToken,0)).to.be.equal(await poolFactory.getRegisteredPools(collaborator0.address, poolInfo0.IDOToken,0))
            
            // revert create pool by not registered collaborator
            const poolInfo1 = jsonCopy(poolInfoList[1])
            await poolFactory.connect(owner).grantAdminRole(admin1.address)
            await poolFactory.connect(admin1).registerPoolAddress(collaborator0.address,[poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])
            
            await expect (poolFactory.connect(collaborator1).createPool([poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])).to.be.revertedWithCustomError(poolFactory, "NotRegisteredPool")

            // register and create successfully twice
            await poolFactory.connect(collaborator0).createPool([poolInfo1.IDOToken, poolInfo1.purchaseToken],
                [poolInfo1.maxPurchaseAmountForKYCUser, poolInfo1.maxPurchaseAmountForNotKYCUser, poolInfo1.TGEPercentage, poolInfo1.participationFeePercentage,
                poolInfo1.galaxyPoolProportion, poolInfo1.earlyAccessProportion, poolInfo1.totalRaiseAmount, poolInfo1.whaleOpenTime, poolInfo1.whaleDuration,
                poolInfo1.communityDuration, poolInfo1.rate, poolInfo1.decimal])
            
            expect(await poolFactory.getCreatedPoolsLengthByToken(collaborator0.address, poolInfo1.IDOToken)).to.be.equal(1)
        })        
    })

    describe("Pool",()=>{
        async function deployPoolFixture(){
            const {jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens} = await loadFixture(deployPoolFactoryFixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])
            await poolFactory.connect(owner).registerPoolAddress(collaborator0.address,[poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
            await poolFactory.connect(collaborator0).createPool([poolInfo0.IDOToken, poolInfo0.purchaseToken],
                [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.TGEPercentage, poolInfo0.participationFeePercentage,
                poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration,
                poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal])
            const pool0Address = await poolFactory.getCreatedPools(collaborator0.address, poolInfo0.IDOToken, 0)

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

            // leaf [address+WHALE+10_000]: (1)
            // leaf [address+WHALE+1_000]: (2)
            // leaf [address+NORMAL_USER+10_000]: (3)+(1)
            const buyWhiteList = [
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex)
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex)
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex)
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex)
                },
                {
                    candidate: investors[5].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex)
                },
                {
                    candidate: investors[0].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex)
                },
                {
                    candidate: investors[1].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchase: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex)
                }
            ]
            
            const leafNodes = buyWhiteList.map((obj) => {
                let leafNode = solidityPack(
                  ["address", "string", "uint256"],
                  [obj.candidate, obj.userType, obj.maxPurchase]
                );
                return ethers.utils.solidityKeccak256(["bytes"], [leafNode]);
            });

            const buyMerkleTree = new MerkleTree(leafNodes, keccak256, {
                sortPairs: true,
            });

            const buyRootHash = hexlify(buyMerkleTree.getRoot());

            return {buyRootHash, jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, pool0}
        }
        it("Should get info from pool after created", async()=>{
            const {jsonCopy, pool0, poolInfoList} = await loadFixture(deployPoolFixture)
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
            const {pool0, buyRootHash, admin1, collaborator0} = await loadFixture(deployPoolFixture)
    
            await pool0.connect(admin1).setRoot(buyRootHash);

            expect(await pool0.root()).to.be.equal(buyRootHash)

            const randomBuyRootHash = hexlify(randomBytes(32))

            await expect(pool0.connect(collaborator0).setRoot(randomBuyRootHash)).to.be.revertedWithCustomError(pool0,"NotAdmin");
        })

        it("Should pause pool and unpause pool by admin; revert without admin", async()=>{
            const {pool0, admin1} = await loadFixture(deployPoolFixture)
            await pool0.connect(admin1).pausePool();
            await pool0.connect(admin1).unpausePool();
        })
    })
})