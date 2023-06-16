import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"

import { ERC20Token } from "../typechain-types/contracts/test/ERC20Token"
import { ERC20Token__factory } from "../typechain-types/factories/contracts/test/ERC20Token__factory"

import { ERC20TokenFactory } from "../typechain-types/contracts/test/ERC20TokenFactory"
import { ERC20TokenFactory__factory } from "../typechain-types/factories/contracts/test/ERC20TokenFactory__factory"

import { expect } from "chai"
import { BigNumber, BigNumberish } from "ethers"
import { arrayify, hexlify, keccak256, parseUnits, solidityKeccak256, solidityPack } from "ethers/lib/utils"
import MerkleTree from "merkletreejs"
import { randomBytes } from "crypto"
import { FiatTokenV2_1, FiatTokenV2_1__factory, IgnitionFactory, IgnitionFactory__factory, Pool, PoolLogic, PoolLogic__factory, Pool__factory, TetherToken, TetherToken__factory, Vesting, VestingLogic, VestingLogic__factory, Vesting__factory } from "../typechain-types"
import { exit } from "process"

describe("Ignition Pool With Vesting", () => {
    async function deployFactoryFixture() {

        function jsonCopy(src: any) {
            return JSON.parse(JSON.stringify(src));
        }

        function paddingTo32Bytes(str: string) {
            return str.padEnd(66, '0');
        }

        type PoolInfo = {
            IDOToken: string
            purchaseToken: string
            maxPurchaseAmountForKYCUser: BigNumberish
            maxPurchaseAmountForNotKYCUser: BigNumberish
            tokenFeePercentage: BigNumberish
            galaxyParticipationFeePercentage: BigNumberish
            crowdfundingParticipationFeePercentage: BigNumberish
            galaxyPoolProportion: BigNumberish
            earlyAccessProportion: BigNumberish
            totalRaiseAmount: BigNumberish
            whaleOpenTime: BigNumberish
            whaleDuration: BigNumberish
            communityDuration: BigNumberish
            rate: BigNumberish
            decimal: BigNumberish
            price: BigNumberish
            TGEDate: BigNumberish
            TGEPercentage: BigNumberish
            vestingCliff: BigNumberish
            vestingFrequency: BigNumberish
            numberOfVestingRelease: BigNumberish
        }

        let owner: SignerWithAddress
        let admin1: SignerWithAddress
        let admin2: SignerWithAddress
        let admin3: SignerWithAddress
        let collaborator0: SignerWithAddress
        let collaborator1: SignerWithAddress
        let collaborator2: SignerWithAddress
        let investors: SignerWithAddress[]
        let factory: IgnitionFactory
        let pool: Pool
        let poolLogic: PoolLogic
        let vesting: Vesting
        let vestingLogic: VestingLogic
        let purchaseTokens: ERC20Token[]
        let IDOTokens: ERC20Token[]
        let USDC: FiatTokenV2_1
        let USDT: TetherToken
        let poolInfoList: PoolInfo[]
        let erc20Sample: ERC20Token
        let erc20TokenFactory: ERC20TokenFactory

        enum Errors {
            CALLER_NOT_ADMIN = "1",
            CALLER_NOT_OWNER = "2",
            ZERO_AMOUNT_NOT_VALID = "3",
            ZERO_ADDRESS_NOT_VALID = "4",
            INVALID_TOKEN_FEE_PERCENTAGE = "5",
            INVALID_TGE_PERCENTAGE = "6",
            INVALID_GALAXY_POOL_PROPORTION = "7",
            INVALID_EARLY_ACCESS_PROPORTION = "8",
            INVALID_TIME = "9",
            INVALID_SIGNER = "10",
            INVALID_CLAIMABLE_AMOUNT = "11",
            NOT_IN_WHALE_LIST = "12",
            NOT_IN_INVESTOR_LIST = "13",
            NOT_ENOUGH_ALLOWANCE = "14",
            NOT_FUNDED = "15",
            ALREADY_CLAIM_TOTAL_AMOUNT = "16",
            TIME_OUT_TO_BUY_IDO_TOKEN = "17",
            EXCEED_MAX_PURCHASE_AMOUNT_FOR_USER = "18",
            EXCEED_TOTAL_RAISE_AMOUNT = "19",
            EXCEED_MAX_PURCHASE_AMOUNT_FOR_KYC_USER = "20",
            EXCEED_MAX_PURCHASE_AMOUNT_FOR_NOT_KYC_USER = "21",
            EXCEED_MAX_PURCHASE_AMOUNT_FOR_EARLY_ACCESS = "22",
            NOT_ALLOWED_TO_CLAIM_IDO_TOKEN = "23",
            NOT_ALLOWED_TO_CLAIM_TOKEN_FEE = "24",
            NOT_ALLOWED_TO_DO_AFTER_TGE_DATE = "25",
            NOT_ALLOWED_TO_CLAIM_PARTICIPATION_FEE = "26",
            NOT_ALLOWED_TO_WITHDRAW_PURCHASED_AMOUNT = "27",
            NOT_ALLOWED_TO_FUND_AFTER_TGE_DATE = "28",
            NOT_ALLOWED_TO_ALLOW_INVESTOR_TO_CLAIM = "29",
            NOT_ALLOWED_TO_CLAIM_PURCHASE_TOKEN = "30",
            NOT_ALLOWED_TO_TRANSFER_BEFORE_TGE_DATE = "31",
        }

        const VestingFrequency = {
            MINUTE: BigNumber.from(60),
            HOUR: BigNumber.from(60 * 60),
            DAY: BigNumber.from(24 * 60 * 60),
            WEEK: BigNumber.from(7 * 24 * 60 * 60)
        }

        const Events = {
            Factory: {
                UpdatePoolImplementation: "UpdatePoolImplementation",
                UpdateVestingImplementation: "UpdateVestingImplementation",
                PoolCreated: "PoolCreated",
                VestingCreated: "VestingCreated"
            },
            Pool: {
                UpdateRoot: "UpdateRoot",
                CancelPool: "CancelPool",
                BuyToken: "BuyToken",
                UpdateTime: "UpdateTime",
                FundIDOToken: "FundIDOToken",
                ClaimTokenFee: "ClaimTokenFee",
                ClaimParticipationFee: "ClaimParticipationFee",
                WithdrawPurchasedAmount: "WithdrawPurchasedAmount",
                ClaimProfit: "ClaimProfit"
            },
            Vesting: {
                SetClaimableStatus: "SetClaimableStatus",
                UpdateTGEDate: "UpdateTGEDate",
                SetIDOTokenAddress: "SetIDOTokenAddress",
                Funded: "Funded",
                WithdrawRedundantIDOToken: "WithdrawRedundantIDOToken",
                ClaimIDOToken: "ClaimIDOToken"
            }
        }

        const PERCENTAGE_DENOMINATOR = 10000;

        const { provider } = ethers;

        [owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, ...investors] = await ethers.getSigners();

        poolLogic = await new PoolLogic__factory(owner).deploy()
        vestingLogic = await new VestingLogic__factory(owner).deploy()

        pool = await new Pool__factory({
            ["contracts/logics/VestingLogic.sol:VestingLogic"]: vestingLogic.address,
        }, owner).deploy();

        vesting = await new Vesting__factory({
            ["contracts/logics/VestingLogic.sol:VestingLogic"]: vestingLogic.address,
        }, owner).deploy();

        factory = await new IgnitionFactory__factory(owner).deploy();
        await factory.initialize(pool.address, vesting.address)

        erc20Sample = await new ERC20Token__factory(owner).deploy();
        erc20TokenFactory = await new ERC20TokenFactory__factory(owner).deploy(erc20Sample.address)

        // Create purchase token
        await erc20TokenFactory.connect(owner).createToken("PurchaseToken0", "PurchaseToken0", 6)
        const purchaseToken0Address = await erc20TokenFactory.currentToken()
        const purchaseToken0 = new ERC20Token__factory(owner).attach(purchaseToken0Address)

        await erc20TokenFactory.connect(owner).createToken("PurchaseToken1", "PurchaseToken1", 8)
        const purchaseToken1Address = await erc20TokenFactory.currentToken()
        const purchaseToken1 = new ERC20Token__factory(owner).attach(purchaseToken1Address)

        await erc20TokenFactory.connect(owner).createToken("PurchaseToken2", "PurchaseToken2", 18)
        const purchaseToken2Address = await erc20TokenFactory.currentToken()
        const purchaseToken2 = new ERC20Token__factory(owner).attach(purchaseToken2Address)

        await erc20TokenFactory.connect(owner).createToken("PurchaseToken3", "PurchaseToken3", 6)
        const purchaseToken3Address = await erc20TokenFactory.currentToken()
        const purchaseToken3 = new ERC20Token__factory(owner).attach(purchaseToken3Address)

        await erc20TokenFactory.connect(owner).createToken("PurchaseToken4", "PurchaseToken4", 6)
        const purchaseToken4Address = await erc20TokenFactory.currentToken()
        const purchaseToken4 = new ERC20Token__factory(owner).attach(purchaseToken4Address)

        USDC = await new FiatTokenV2_1__factory(owner).deploy();
        await USDC.initialize('USD Coin', 'USDC', 'USDC', 6, owner.address, owner.address, owner.address, owner.address)
        await USDC.initializeV2('USD Coin')
        await USDC.configureMinter(owner.address, parseUnits("1000000000000000000000000000", 30))
        await USDC.initializeV2_1(owner.address)

        USDT = await new TetherToken__factory(owner).deploy(parseUnits("1000000000000000000000000000", 30), 'Tether USD', 'USDT', 6)

        purchaseTokens = [
            USDC as any, USDT as any, purchaseToken0, purchaseToken1, purchaseToken2, purchaseToken3, purchaseToken4
        ]

        for (let i = 0; i < purchaseTokens.length; i++) {
            for (let j = 0; j < investors.length; j++) {
                if ((await purchaseTokens[i].symbol()) == 'USDT') {
                    await USDT.connect(owner).issue(parseUnits('1000000', '30'))
                    await USDT.connect(owner).transfer(investors[j].address, parseUnits('1000000', '30'))
                } else {
                    await purchaseTokens[i].connect(owner).mint(investors[j].address, parseUnits('1000000', '30'))
                }
            }
        }

        // Create IDO token
        await erc20TokenFactory.connect(owner).createToken("IDOToken0", "IDOToken0", 18)
        const IDOToken0Address = await erc20TokenFactory.currentToken()
        const IDOToken0 = new ERC20Token__factory(owner).attach(IDOToken0Address)

        await erc20TokenFactory.connect(owner).createToken("IDOToken1", "IDOToken1", 6)
        const IDOToken1Address = await erc20TokenFactory.currentToken()
        const IDOToken1 = new ERC20Token__factory(owner).attach(IDOToken1Address)

        await erc20TokenFactory.connect(owner).createToken("IDOToken2", "IDOToken2", 10)
        const IDOToken2Address = await erc20TokenFactory.currentToken()
        const IDOToken2 = new ERC20Token__factory(owner).attach(IDOToken2Address)

        await erc20TokenFactory.connect(owner).createToken("IDOToken3", "IDOToken3", 8)
        const IDOToken3Address = await erc20TokenFactory.currentToken()
        const IDOToken3 = new ERC20Token__factory(owner).attach(IDOToken3Address)

        await erc20TokenFactory.connect(owner).createToken("IDOToken4", "IDOToken4", 8)
        const IDOToken4Address = await erc20TokenFactory.currentToken()
        const IDOToken4 = new ERC20Token__factory(owner).attach(IDOToken4Address)

        IDOTokens = [
            IDOToken0, IDOToken1, IDOToken2, IDOToken3, IDOToken4
        ]

        await IDOTokens[0].connect(owner).mint(collaborator0.address, parseUnits('1000000', '30'))
        await IDOTokens[1].connect(owner).mint(collaborator1.address, parseUnits('1000000', '30'))

        poolInfoList = [
            {
                IDOToken: IDOTokens[0].address,
                purchaseToken: purchaseTokens[0].address,
                maxPurchaseAmountForKYCUser: parseUnits('10000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                tokenFeePercentage: BigNumber.from('1000'),
                galaxyParticipationFeePercentage: BigNumber.from('0'),
                crowdfundingParticipationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('9000000', 6),
                whaleOpenTime: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(3 * 24 * 60 * 60),
                whaleDuration: BigNumber.from(24 * 60 * 60),
                communityDuration: BigNumber.from(48 * 60 * 60),
                rate: parseUnits('125', 12),
                decimal: BigNumber.from(1),
                price: 0.08,
                TGEDate: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(30 * 24 * 60 * 60),
                TGEPercentage: BigNumber.from('2000'),
                vestingCliff: BigNumber.from(5 * 60 * 60),
                vestingFrequency: VestingFrequency.DAY,
                numberOfVestingRelease: BigNumber.from(10)
                // IDOToken: '0x94ce0e00aD6F80792bD1877765757f5F90d20B96',
                // purchaseToken: '0x501D21aD98f85cA6160F5e5F5b1a81ad7f772001',
                // maxPurchaseAmountForKYCUser: BigNumber.from('10'),
                // maxPurchaseAmountForNotKYCUser: BigNumber.from('10'),
                // TGEDate: BigNumber.from('0'),
                // TGEPercentage: BigNumber.from('1400'),
                // galaxyParticipationFeePercentage: BigNumber.from('0'),
                // crowdfundingParticipationFeePercentage: BigNumber.from('1000'),
                // galaxyPoolProportion: BigNumber.from('5000'),
                // earlyAccessProportion: BigNumber.from('1400'),
                // totalRaiseAmount: BigNumber.from('10000000'),
                // whaleOpenTime: BigNumber.from('1672495080'),
                // whaleDuration: BigNumber.from('86115'),
                // communityDuration: BigNumber.from('83541'),
                // rate: BigNumber.from('1'),
                // decimal: BigNumber.from('20'),
                // price: 0.08
            },
            {
                IDOToken: IDOTokens[1].address,
                purchaseToken: purchaseTokens[1].address,
                maxPurchaseAmountForKYCUser: parseUnits('30000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('15000', 6),
                tokenFeePercentage: BigNumber.from('1500'),
                galaxyParticipationFeePercentage: BigNumber.from('0'),
                crowdfundingParticipationFeePercentage: BigNumber.from('1500'),
                galaxyPoolProportion: BigNumber.from('5000'),
                earlyAccessProportion: BigNumber.from('5000'),
                totalRaiseAmount: parseUnits('100000', 6),
                whaleOpenTime: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(3 * 24 * 60 * 60),
                whaleDuration: BigNumber.from(12 * 60 * 60),
                communityDuration: BigNumber.from(24 * 60 * 60),
                rate: BigNumber.from('35714285714285715'),
                decimal: BigNumber.from(15),
                price: 0.028,
                TGEDate: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(27 * 24 * 60 * 60),
                TGEPercentage: BigNumber.from('1000'),
                vestingCliff: BigNumber.from(5 * 24 * 60 * 60),
                vestingFrequency: VestingFrequency.WEEK,
                numberOfVestingRelease: BigNumber.from(50)
            },
            {
                // IDOToken: IDOTokens[2].address,
                IDOToken: ethers.constants.AddressZero,
                purchaseToken: purchaseTokens[2].address,
                maxPurchaseAmountForKYCUser: parseUnits('10000', 18),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 18),
                tokenFeePercentage: BigNumber.from('1000'),
                galaxyParticipationFeePercentage: BigNumber.from('1000'),
                crowdfundingParticipationFeePercentage: BigNumber.from('1500'),
                galaxyPoolProportion: BigNumber.from('1000'),
                earlyAccessProportion: BigNumber.from('6000'),
                totalRaiseAmount: parseUnits('800000', 18),
                whaleOpenTime: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(3 * 24 * 60 * 60),
                whaleDuration: BigNumber.from(24 * 60 * 60),
                communityDuration: BigNumber.from(24 * 60 * 60),
                rate: BigNumber.from('6666666666666666'),
                decimal: BigNumber.from(24),
                price: 1.5,
                TGEDate: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(10 * 24 * 60 * 60),
                TGEPercentage: BigNumber.from('1000'),
                vestingCliff: BigNumber.from(5 * 60 * 60),
                vestingFrequency: VestingFrequency.MINUTE,
                numberOfVestingRelease: BigNumber.from(20)
            },
            {
                IDOToken: IDOTokens[3].address,
                purchaseToken: purchaseTokens[3].address,
                maxPurchaseAmountForKYCUser: parseUnits('2000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                tokenFeePercentage: BigNumber.from('1000'),
                galaxyParticipationFeePercentage: BigNumber.from('0'),
                crowdfundingParticipationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('850000', 6),
                whaleOpenTime: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(3 * 24 * 60 * 60),
                whaleDuration: BigNumber.from(24 * 60 * 60),
                communityDuration: BigNumber.from(12 * 60 * 60),
                rate: BigNumber.from('1818181818181818100'),
                decimal: BigNumber.from(18),
                price: 55,
                TGEDate: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(30 * 24 * 60 * 60),
                TGEPercentage: BigNumber.from('3000'),
                vestingCliff: BigNumber.from(5 * 60 * 60),
                vestingFrequency: VestingFrequency.MINUTE,
                numberOfVestingRelease: BigNumber.from(20)
            },
            {
                IDOToken: IDOTokens[4].address,
                purchaseToken: purchaseTokens[4].address,
                maxPurchaseAmountForKYCUser: parseUnits('2000', 6),
                maxPurchaseAmountForNotKYCUser: parseUnits('1000', 6),
                tokenFeePercentage: BigNumber.from('500'),
                galaxyParticipationFeePercentage: BigNumber.from('0'),
                crowdfundingParticipationFeePercentage: BigNumber.from('1000'),
                galaxyPoolProportion: BigNumber.from('2000'),
                earlyAccessProportion: BigNumber.from('4000'),
                totalRaiseAmount: parseUnits('850000', 6),
                whaleOpenTime: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(3 * 24 * 60 * 60),
                whaleDuration: BigNumber.from(24 * 60 * 60),
                communityDuration: BigNumber.from(12 * 60 * 60),
                rate: BigNumber.from('1818181818181818100'),
                decimal: BigNumber.from(18),
                price: 55,
                TGEDate: BigNumber.from(Math.floor(Date.now() / 1000).toString()).add(30 * 24 * 60 * 60),
                TGEPercentage: BigNumber.from('3000'),
                vestingCliff: BigNumber.from(5 * 60 * 60),
                vestingFrequency: VestingFrequency.MINUTE,
                numberOfVestingRelease: BigNumber.from(20)
            },
        ]

        return {
            jsonCopy, paddingTo32Bytes, Errors, VestingFrequency, Events, poolLogic, vestingLogic, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2,
            investors, factory, pool, vesting, provider, IDOTokens, purchaseTokens, poolInfoList, PERCENTAGE_DENOMINATOR
        }
    }

    describe("Factory", () => {
        it("Should deploy pool factory and initialize pool implementation address successfully", async () => {
            const { factory, pool, vesting } = await loadFixture(deployFactoryFixture)
            expect(factory.address).to.be.a.properAddress;
            expect(await factory.poolImplementationAddress()).to.be.equal(pool.address)
            expect(await factory.vestingImplementationAddress()).to.be.equal(vesting.address)
        })

        it("Should grant, revoke admin successfully by admin", async () => {
            const { owner, admin1, admin2, admin3, factory } = await loadFixture(deployFactoryFixture)
            expect(await factory.hasRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), owner.address)).to.be.true
            expect(await factory.hasRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin1.address)).to.be.false

            await factory.connect(owner).grantRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin1.address)
            expect(await factory.hasRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin1.address)).to.be.true

            await factory.connect(owner).grantRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin2.address)
            expect(await factory.hasRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin2.address)).to.be.true
            await factory.connect(owner).revokeRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin2.address)
            expect(await factory.hasRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin2.address)).to.be.false

            await factory.connect(owner).grantRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin1.address)
            await factory.connect(owner).revokeRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin3.address)

            await expect(factory.connect(admin3).revokeRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin3.address)).to.be.reverted
        })

        it("Should set pool and vesting implementation address successfully by admin; revert set zero address; revert set pool and vesting implementation address not by admin", async () => {
            const { owner, admin1, admin2, factory, provider, Errors, Events } = await loadFixture(deployFactoryFixture)
            await factory.connect(owner).grantRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin1.address)

            let randomPool = new ethers.Wallet(ethers.utils.randomBytes(32), provider);
            expect(await factory.connect(admin1).setPoolImplementation(randomPool.address)).to.be.emit(factory, Events.Factory.UpdatePoolImplementation)
            expect(await factory.poolImplementationAddress()).to.be.equal(randomPool.address)

            await expect(factory.connect(owner).setPoolImplementation(ethers.constants.AddressZero)).to.be.revertedWith(Errors.ZERO_ADDRESS_NOT_VALID)
            await expect(factory.connect(admin2).setPoolImplementation(randomPool.address)).to.be.revertedWith(Errors.CALLER_NOT_OWNER);

            randomPool = new ethers.Wallet(ethers.utils.randomBytes(32), provider);
            expect(await factory.connect(admin1).setVestingImplementation(randomPool.address)).to.be.emit(factory, Events.Factory.UpdateVestingImplementation)
            expect(await factory.vestingImplementationAddress()).to.be.equal(randomPool.address)

            await expect(factory.connect(owner).setVestingImplementation(ethers.constants.AddressZero)).to.be.revertedWith(Errors.ZERO_ADDRESS_NOT_VALID)
            await expect(factory.connect(admin2).setVestingImplementation(randomPool.address)).to.be.revertedWith(Errors.CALLER_NOT_OWNER);
        })

        it("Should create pool successfully; revert if not valid pool info", async () => {
            const { jsonCopy, paddingTo32Bytes, owner, pool, factory, poolInfoList, collaborator0, Errors, Events } = await loadFixture(deployFactoryFixture)
            const poolInfo1 = jsonCopy(poolInfoList[0])
            expect(await factory.connect(collaborator0).createPool(
                [
                    poolInfo1.IDOToken,
                    poolInfo1.purchaseToken
                ],
                [
                    poolInfo1.maxPurchaseAmountForKYCUser,
                    poolInfo1.maxPurchaseAmountForNotKYCUser,
                    poolInfo1.tokenFeePercentage,
                    poolInfo1.galaxyParticipationFeePercentage,
                    poolInfo1.crowdfundingParticipationFeePercentage,
                    poolInfo1.galaxyPoolProportion,
                    poolInfo1.earlyAccessProportion,
                    poolInfo1.totalRaiseAmount,
                    poolInfo1.whaleOpenTime,
                    poolInfo1.whaleDuration,
                    poolInfo1.communityDuration,
                    poolInfo1.rate,
                    poolInfo1.decimal,
                    poolInfo1.TGEDate,
                    poolInfo1.TGEPercentage,
                    poolInfo1.vestingCliff,
                    poolInfo1.vestingFrequency,
                    poolInfo1.numberOfVestingRelease
                ],
                1671095858080
            )).to.be.emit(factory, Events.Factory.PoolCreated)

            let poolInfo4 = jsonCopy(poolInfoList[4])
            poolInfo4.purchaseToken = ethers.constants.AddressZero
            await expect(factory.connect(owner).createPool(
                [
                    poolInfo4.IDOToken,
                    poolInfo4.purchaseToken
                ],
                [
                    poolInfo4.maxPurchaseAmountForKYCUser,
                    poolInfo4.maxPurchaseAmountForNotKYCUser,
                    poolInfo4.tokenFeePercentage,
                    poolInfo4.galaxyParticipationFeePercentage,
                    poolInfo4.crowdfundingParticipationFeePercentage,
                    poolInfo4.galaxyPoolProportion,
                    poolInfo4.earlyAccessProportion,
                    poolInfo4.totalRaiseAmount,
                    poolInfo4.whaleOpenTime,
                    poolInfo4.whaleDuration,
                    poolInfo4.communityDuration,
                    poolInfo4.rate,
                    poolInfo4.decimal,
                    poolInfo4.TGEDate,
                    poolInfo4.TGEPercentage,
                    poolInfo4.vestingCliff,
                    poolInfo4.vestingFrequency,
                    poolInfo4.numberOfVestingRelease
                ], 1671095858080)).to.be.revertedWith(Errors.ZERO_ADDRESS_NOT_VALID)
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.galaxyPoolProportion = BigNumber.from('100000')
                await expect(factory.connect(owner).createPool(
                    [
                        poolInfo4.IDOToken,
                        poolInfo4.purchaseToken
                    ],
                    [
                        poolInfo4.maxPurchaseAmountForKYCUser,
                        poolInfo4.maxPurchaseAmountForNotKYCUser,
                        poolInfo4.tokenFeePercentage,
                        poolInfo4.galaxyParticipationFeePercentage,
                        poolInfo4.crowdfundingParticipationFeePercentage,
                        poolInfo4.galaxyPoolProportion,
                        poolInfo4.earlyAccessProportion,
                        poolInfo4.totalRaiseAmount,
                        poolInfo4.whaleOpenTime,
                        poolInfo4.whaleDuration,
                        poolInfo4.communityDuration,
                        poolInfo4.rate,
                        poolInfo4.decimal,
                        poolInfo4.TGEDate,
                        poolInfo4.TGEPercentage,
                        poolInfo4.vestingCliff,
                        poolInfo4.vestingFrequency,
                        poolInfo4.numberOfVestingRelease
                    ], 1671095858080)).to.be.revertedWith(Errors.INVALID_GALAXY_POOL_PROPORTION)
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.earlyAccessProportion = BigNumber.from('23400')
                await expect(factory.connect(owner).createPool(
                    [
                        poolInfo4.IDOToken,
                        poolInfo4.purchaseToken
                    ],
                    [
                        poolInfo4.maxPurchaseAmountForKYCUser,
                        poolInfo4.maxPurchaseAmountForNotKYCUser,
                        poolInfo4.tokenFeePercentage,
                        poolInfo4.galaxyParticipationFeePercentage,
                        poolInfo4.crowdfundingParticipationFeePercentage,
                        poolInfo4.galaxyPoolProportion,
                        poolInfo4.earlyAccessProportion,
                        poolInfo4.totalRaiseAmount,
                        poolInfo4.whaleOpenTime,
                        poolInfo4.whaleDuration,
                        poolInfo4.communityDuration,
                        poolInfo4.rate,
                        poolInfo4.decimal,
                        poolInfo4.TGEDate,
                        poolInfo4.TGEPercentage,
                        poolInfo4.vestingCliff,
                        poolInfo4.vestingFrequency,
                        poolInfo4.numberOfVestingRelease
                    ], 1671095858080)).to.be.revertedWith(Errors.INVALID_EARLY_ACCESS_PROPORTION)
            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.totalRaiseAmount = BigNumber.from(0)
                await expect(factory.connect(owner).createPool(
                    [
                        poolInfo4.IDOToken,
                        poolInfo4.purchaseToken
                    ],
                    [
                        poolInfo4.maxPurchaseAmountForKYCUser,
                        poolInfo4.maxPurchaseAmountForNotKYCUser,
                        poolInfo4.tokenFeePercentage,
                        poolInfo4.galaxyParticipationFeePercentage,
                        poolInfo4.crowdfundingParticipationFeePercentage,
                        poolInfo4.galaxyPoolProportion,
                        poolInfo4.earlyAccessProportion,
                        poolInfo4.totalRaiseAmount,
                        poolInfo4.whaleOpenTime,
                        poolInfo4.whaleDuration,
                        poolInfo4.communityDuration,
                        poolInfo4.rate,
                        poolInfo4.decimal,
                        poolInfo4.TGEDate,
                        poolInfo4.TGEPercentage,
                        poolInfo4.vestingCliff,
                        poolInfo4.vestingFrequency,
                        poolInfo4.numberOfVestingRelease
                    ], 1671095858080)).to.be.revertedWith(Errors.ZERO_AMOUNT_NOT_VALID)


            }
            {
                let poolInfo4 = jsonCopy(poolInfoList[4])
                poolInfo4.TGEPercentage = BigNumber.from(10100)
                await expect(factory.connect(owner).createPool(
                    [
                        poolInfo4.IDOToken,
                        poolInfo4.purchaseToken
                    ],
                    [
                        poolInfo4.maxPurchaseAmountForKYCUser,
                        poolInfo4.maxPurchaseAmountForNotKYCUser,
                        poolInfo4.tokenFeePercentage,
                        poolInfo4.galaxyParticipationFeePercentage,
                        poolInfo4.crowdfundingParticipationFeePercentage,
                        poolInfo4.galaxyPoolProportion,
                        poolInfo4.earlyAccessProportion,
                        poolInfo4.totalRaiseAmount,
                        poolInfo4.whaleOpenTime,
                        poolInfo4.whaleDuration,
                        poolInfo4.communityDuration,
                        poolInfo4.rate,
                        poolInfo4.decimal,
                        poolInfo4.TGEDate,
                        poolInfo4.TGEPercentage,
                        poolInfo4.vestingCliff,
                        poolInfo4.vestingFrequency,
                        poolInfo4.numberOfVestingRelease
                    ], 1671095858080)).to.be.revertedWith(Errors.INVALID_TGE_PERCENTAGE)
            }
        })
    })

    describe("Buy with deployed IDO token and vesting", () => {
        async function deployPool0Fixture() {
            const { jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, factory, vesting,
                poolInfoList, provider, IDOTokens, purchaseTokens, PERCENTAGE_DENOMINATOR, Errors, Events, vestingLogic } = await loadFixture(deployFactoryFixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])

            let tx
            let txRs
            tx = await factory.connect(collaborator0).createPool(
                [
                    poolInfo0.IDOToken,
                    poolInfo0.purchaseToken
                ],
                [
                    poolInfo0.maxPurchaseAmountForKYCUser,
                    poolInfo0.maxPurchaseAmountForNotKYCUser,
                    poolInfo0.tokenFeePercentage,
                    poolInfo0.galaxyParticipationFeePercentage,
                    poolInfo0.crowdfundingParticipationFeePercentage,
                    poolInfo0.galaxyPoolProportion,
                    poolInfo0.earlyAccessProportion,
                    poolInfo0.totalRaiseAmount,
                    poolInfo0.whaleOpenTime,
                    poolInfo0.whaleDuration,
                    poolInfo0.communityDuration,
                    poolInfo0.rate,
                    poolInfo0.decimal,
                    poolInfo0.TGEDate,
                    poolInfo0.TGEPercentage,
                    poolInfo0.vestingCliff,
                    poolInfo0.vestingFrequency,
                    poolInfo0.numberOfVestingRelease
                ],
                1671095858080
            )
            txRs = await tx.wait()
            // console.log(txRs.events)

            const abiCoder = new ethers.utils.AbiCoder()
            const encodeData = abiCoder.encode(
                ['address[2]', 'uint[18]', 'address', 'uint'],
                [
                    [poolInfo0.IDOToken, poolInfo0.purchaseToken],
                    [poolInfo0.maxPurchaseAmountForKYCUser, poolInfo0.maxPurchaseAmountForNotKYCUser, poolInfo0.tokenFeePercentage, poolInfo0.galaxyParticipationFeePercentage, poolInfo0.crowdfundingParticipationFeePercentage, poolInfo0.galaxyPoolProportion, poolInfo0.earlyAccessProportion, poolInfo0.totalRaiseAmount, poolInfo0.whaleOpenTime, poolInfo0.whaleDuration, poolInfo0.communityDuration, poolInfo0.rate, poolInfo0.decimal, poolInfo0.TGEDate, poolInfo0.TGEPercentage, poolInfo0.vestingCliff, poolInfo0.vestingFrequency, poolInfo0.numberOfVestingRelease],
                    collaborator0.address,
                    1671095858080
                ])
            const salt = solidityKeccak256(['bytes'], [encodeData])

            const poolMinimalByteCode = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73' + pool.address.slice(2) + '5af43d82803e903d91602b57fd5bf3'
            const initCodeHash = solidityKeccak256(['bytes'], [arrayify(poolMinimalByteCode)])

            const pool0Address = ethers.utils.getCreate2Address(
                factory.address,
                salt,
                initCodeHash
            )

            const vesting0Address = ethers.utils.getContractAddress(
                {
                    from: factory.address,
                    nonce: 2
                }
            )
            await factory.connect(owner).grantRole(keccak256(solidityPack(['string'], ['OWNER_ROLE'])), admin1.address)

            const pool0 = new Pool__factory({
                ["contracts/logics/VestingLogic.sol:VestingLogic"]: vestingLogic.address,
            }, owner).attach(pool0Address)
            expect(await pool0.vesting()).to.be.equal(vesting0Address)

            const vesting0 = new Vesting__factory({
                ["contracts/logics/VestingLogic.sol:VestingLogic"]: vestingLogic.address,
            }, owner).attach(vesting0Address)

            const WHALE_HASH = solidityKeccak256(["string"], ["WHALE"])
            const NORMAL_USER_HASH = solidityKeccak256(["string"], ["NORMAL_USER"])

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
                180000, //1
                93750, //2
                245750, //3
                18750, //4
                1000, //5
                10000, //6
            ]

            const allocationList = PAIDBalanceList.map((balance) => {
                return Math.floor(Number((balance / 75000)))
            })

            const allocationForGalaxyPool = allocationList.reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0
            );

            const maxPurchaseAmountForGalaxyPool_pool0 = BigNumber.from(Number(poolInfo0.totalRaiseAmount.hex) * Number(poolInfo0.galaxyPoolProportion.hex) / PERCENTAGE_DENOMINATOR);

            const buyWhiteList = [
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Math.floor(Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / allocationForGalaxyPool * allocationList[0])))
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Math.floor(Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / allocationForGalaxyPool * allocationList[1])))
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
                    maxPurchaseBaseOnAllocation: Math.floor(Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / allocationForGalaxyPool * allocationList[2])))
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: Math.floor(Number((Number(maxPurchaseAmountForGalaxyPool_pool0) / allocationForGalaxyPool * allocationList[3])))
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
                },
                {
                    candidate: investors[0].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[1].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[2].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[3].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[4].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[5].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                },
                {
                    candidate: investors[6].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex),
                    maxPurchaseBaseOnAllocation: 0
                }
            ]

            const leafNodes = buyWhiteList.map((obj) => {
                let leafNode = solidityPack(
                    ["address", "bytes32", "uint256", "uint256"],
                    [obj.candidate, obj.userType, obj.maxPurchaseWhetherOrNotKYC, obj.maxPurchaseBaseOnAllocation]
                );
                return ethers.utils.solidityKeccak256(["bytes"], [leafNode]);
            });

            const buyMerkleTree = new MerkleTree(leafNodes, keccak256, {
                sortPairs: true,
            });

            const buyRootHash = hexlify(buyMerkleTree.getRoot());

            function getProof(leafInfo: { candidate: string, userType: string, maxPurchaseWhetherOrNotKYC: number, maxPurchaseBaseOnAllocation: number }) {
                const leaf = solidityPack(
                    ["address", "bytes32", "uint256", "uint256"],
                    [leafInfo.candidate, leafInfo.userType, leafInfo.maxPurchaseWhetherOrNotKYC, leafInfo.maxPurchaseBaseOnAllocation]
                )
                const leafNode = solidityKeccak256(["bytes"], [leaf])
                const proof = buyMerkleTree.getHexProof(leafNode)
                return proof
            }


            return { getProof, PERCENTAGE_DENOMINATOR, buyMerkleTree, buyWhiteList, buyRootHash, jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, factory, poolInfoList, provider, IDOTokens, purchaseTokens, pool0, vesting0, Errors, Events }
        }
        it("Should get info from pool after created", async () => {
            const { jsonCopy, pool0, poolInfoList, vesting0 } = await loadFixture(deployPool0Fixture)
            const poolInfo0 = jsonCopy(poolInfoList[0])

            expect(await vesting0.IDOToken()).to.be.equal(poolInfo0.IDOToken)
            expect(await pool0.purchaseToken()).to.be.equal(poolInfo0.purchaseToken)
            expect((await pool0.offeredCurrency()).rate).to.be.equal(Number(poolInfo0.rate.hex))
            expect((await pool0.offeredCurrency()).decimal).to.be.equal(Number(poolInfo0.decimal.hex))
            expect(await pool0.maxPurchaseAmountForKYCUser()).to.be.equal(Number(poolInfo0.maxPurchaseAmountForKYCUser.hex))
            expect(await pool0.maxPurchaseAmountForNotKYCUser()).to.be.equal(Number(poolInfo0.maxPurchaseAmountForNotKYCUser.hex))
            expect(await vesting0.TGEPercentage()).to.be.equal(Number(poolInfo0.TGEPercentage.hex))
            expect(await pool0.galaxyParticipationFeePercentage()).to.be.equal(Number(poolInfo0.galaxyParticipationFeePercentage.hex))
            expect(await pool0.crowdfundingParticipationFeePercentage()).to.be.equal(Number(poolInfo0.crowdfundingParticipationFeePercentage.hex))
            expect(await pool0.galaxyPoolProportion()).to.be.equal(Number(poolInfo0.galaxyPoolProportion.hex))
            expect(await pool0.earlyAccessProportion()).to.be.equal(Number(poolInfo0.earlyAccessProportion.hex))
            expect(await pool0.totalRaiseAmount()).to.be.equal(Number(poolInfo0.totalRaiseAmount.hex))
            expect(await pool0.whaleOpenTime()).to.be.equal(Number(poolInfo0.whaleOpenTime.hex))
            expect(await pool0.whaleCloseTime()).to.be.equal(Number(poolInfo0.whaleDuration.hex) + Number(poolInfo0.whaleOpenTime.hex))
            expect(await pool0.communityCloseTime()).to.be.equal(Number(poolInfo0.communityDuration.hex) + Number(poolInfo0.whaleOpenTime.hex) + Number(poolInfo0.whaleDuration.hex))

            expect(await pool0.maxPurchaseAmountForGalaxyPool()).to.be.equal(Math.floor(Number(poolInfo0.totalRaiseAmount.hex) * Number(poolInfo0.galaxyPoolProportion.hex) / 10000))
            expect(await pool0.maxPurchaseAmountForEarlyAccess()).to.be.equal(Math.floor(Number(poolInfo0.totalRaiseAmount.hex) * (10000 - Number(poolInfo0.galaxyPoolProportion.hex)) * Number(poolInfo0.earlyAccessProportion.hex) / 10000 / 10000))
            expect(await pool0.communityOpenTime()).to.be.equal(Number(poolInfo0.whaleOpenTime.hex) + Number(poolInfo0.whaleDuration.hex))
        })

        it("Should set merkle tree root successfully by admin; revert without admin", async () => {
            const { pool0, buyRootHash, admin1, collaborator0, Errors, Events } = await loadFixture(deployPool0Fixture)

            await pool0.connect(admin1).setRoot(buyRootHash);

            expect(await pool0.root()).to.be.equal(buyRootHash)

            const randomBuyRootHash = hexlify(randomBytes(32))

            await expect(pool0.connect(collaborator0).setRoot(randomBuyRootHash)).to.be.revertedWith(Errors.CALLER_NOT_ADMIN)
        })

        it("Should close pool by admin; revert without admin", async () => {
            const { pool0, admin1, Events } = await loadFixture(deployPool0Fixture)
            expect(await pool0.connect(admin1).cancelPool(true)).to.be.emit(pool0, Events.Pool.CancelPool).withArgs(true);
            expect(await pool0.paused()).to.be.true;
        })

        it("Should buy token in galaxy pool, early access and open time successfully by all types of user; revert out of time", async () => {
            const { owner, getProof, PERCENTAGE_DENOMINATOR, Errors, Events, poolInfoList, collaborator0, IDOTokens, purchaseTokens, buyMerkleTree, pool0, admin1, buyRootHash, investors, buyWhiteList, vesting0 } = await loadFixture(deployPool0Fixture)

            // collaborator transfer IDO token to IDO pool
            // await IDOTokens[0].connect(collaborator0).transfer(pool0.address, parseUnits('1000000', '28'))

            // update root
            await pool0.connect(admin1).setRoot(buyRootHash)

            // get proof for investor0 in galaxy pool
            const leafInfo0 = buyWhiteList[0]
            const proof0 = getProof(leafInfo0)

            // revert TimeOutToBuyToken (buy before whaleOpentime)
            await expect(pool0.connect(investors[0]).buyTokenInGalaxyPool(proof0, 100000, leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWith(Errors.TIME_OUT_TO_BUY_IDO_TOKEN)

            // buy successfully (investor0, WHALE, KYC user, galaxy pool)
            await time.increaseTo(await pool0.whaleOpenTime())
            await expect(pool0.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90', 6), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWith(Errors.NOT_ENOUGH_ALLOWANCE)
            // await purchaseTokens[0].connect(investors[0]).approve(pool0.address, ethers.constants.MaxUint256)
            await purchaseTokens[0].connect(investors[0]).approve(pool0.address, BigNumber.from(leafInfo0.maxPurchaseBaseOnAllocation).add(1000))
            expect(await pool0.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90', 6), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.emit(pool0, Events.Pool.BuyToken)
            expect(await pool0.purchasedAmount()).to.be.equal(Number(parseUnits('90', 6)))
            expect((await pool0.userPurchasedAmount(investors[0].address)).principal).to.be.equal(Number(parseUnits('90', 6)))
            
            // get proof for investor1 in galaxy pool
            const leafInfo1 = buyWhiteList[1]
            const proof1 = getProof(leafInfo1)
            
            // revert buy more than max purchase amount for KYC user (investor1, WHALE, KYC user, galaxy pool)
            await purchaseTokens[0].connect(investors[1]).approve(pool0.address, ethers.constants.MaxUint256)
            // await purchaseTokens[0].connect(investors[1]).approve(pool0.address, BigNumber.from(leafInfo1.maxPurchaseBaseOnAllocation))
            await expect(pool0.connect(investors[1]).buyTokenInGalaxyPool(proof1, parseUnits('11000', 6), leafInfo1.maxPurchaseBaseOnAllocation)).to.be.revertedWith(Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_KYC_USER)
            
            // get proof for investor2 in galaxy pool
            const leafInfo4 = buyWhiteList[4]
            const proof4 = getProof(leafInfo4)
            
            // buy successfully (investor2, WHALE, Not KYC user, galaxy pool)
            await purchaseTokens[0].connect(investors[2]).approve(pool0.address, ethers.constants.MaxUint256)
            // await purchaseTokens[0].connect(investors[2]).approve(pool0.address, BigNumber.from(leafInfo4.maxPurchaseBaseOnAllocation))
            expect(await pool0.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('870', 6), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.emit(pool0, Events.Pool.BuyToken)
            
            // buy successfully twice (investor2, WHALE, Not KYC user, galaxy pool)
            expect(await pool0.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('100', 6), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.emit(pool0, Events.Pool.BuyToken)
            
            // revert buy more than max purchase amount for Not KYC user in twice (investor2, WHALE, Not KYC user, galaxy pool)
            await expect(pool0.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('50', 6), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.revertedWith(Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_NOT_KYC_USER)
            
            // get proof for investor5
            const leafInfo8 = buyWhiteList[8]
            const proof8 = getProof(leafInfo8)
            
            // revert normal, KYC user buy in galaxy pool (investor4, NORMAL, KYC user, galaxy pool)
            await purchaseTokens[0].connect(investors[5]).approve(pool0.address, ethers.constants.MaxUint256)
            // await purchaseTokens[0].connect(investors[5]).approve(pool0.address, parseUnits('1000000',20))
            await expect(pool0.connect(investors[5]).buyTokenInGalaxyPool(proof8, 10, leafInfo8.maxPurchaseBaseOnAllocation)).to.be.revertedWith(Errors.EXCEED_MAX_PURCHASE_AMOUNT_FOR_USER)
            await expect(pool0.connect(investors[5]).buyTokenInGalaxyPool(proof8, 10, 10)).to.be.revertedWith(Errors.NOT_IN_WHALE_LIST)
            
            // get proof for investor0 in early access
            const leaf0EA = buyWhiteList[2]
            const proof0EA = getProof(leaf0EA)
            
            // buy successfully (investor0, WHALE, KYC User, early access)
            // await purchaseTokens[0].connect(investors[0]).approve(pool0.address, parseUnits('1000000',20))
            const balanceOfInvestor0BeforeBuyToken = await purchaseTokens[0].balanceOf(investors[0].address)
            const balanceOfPool0BeforeBuyToken = await purchaseTokens[0].balanceOf(pool0.address)
            expect(await pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('100', 6))).to.be.emit(pool0, Events.Pool.BuyToken)
            const balanceOfInvestor0AfterBuyToken = await purchaseTokens[0].balanceOf(investors[0].address)
            const balanceOfPool0AfterBuyToken = await purchaseTokens[0].balanceOf(pool0.address)
            expect((balanceOfInvestor0AfterBuyToken).sub(balanceOfInvestor0BeforeBuyToken)).to.be.equal(parseUnits('-110', 6))
            expect((balanceOfPool0AfterBuyToken).sub(balanceOfPool0BeforeBuyToken)).to.be.equal(parseUnits('110', 6))
            
            // buy successfully upto max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            expect(await pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('9800', 6))).to.be.emit(pool0, Events.Pool.BuyToken)
            return;
            
            // revert withdraw purchase token
            await expect(pool0.connect(owner).withdrawPurchaseToken(owner.address)).to.be.revertedWithCustomError(pool0, "NotEnoughConditionToWithdrawPurchaseToken");
            
            // revert withdraw IDO token
            await expect(pool0.connect(owner).withdrawIDOToken(owner.address)).to.be.revertedWithCustomError(pool0, "NotEnoughConditionToWithdrawIDOToken")
            
            // revert buy more than max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            await expect(pool0.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('100', 6))).to.be.revertedWithCustomError(pool0, "ExceedMaxPurchaseAmountForKYCUser").withArgs(investors[0].address, anyValue)
            
            // get proof of investor 3 for early access
            const leaf7EA = buyWhiteList[7]
            const proof7EA = getProof(leaf7EA)
            
            // buy successfully (investor3, WHALE, Not KYC User, early access)
            await purchaseTokens[0].connect(investors[3]).approve(pool0.address, ethers.constants.MaxUint256)
            // await purchaseTokens[0].connect(investors[3]).approve(pool0.address, parseUnits('10',20))
            expect(await pool0.connect(investors[3]).buyTokenInCrowdfundingPool(proof7EA, parseUnits('10', 6))).to.be.emit(pool0, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);
            
            // revert buy (investor5, NORMAL, KYC User, early access)
            await expect(pool0.connect(investors[5]).buyTokenInCrowdfundingPool(proof8, parseUnits('10', 6))).to.be.revertedWithCustomError(pool0, "NotInWhaleList").withArgs(anyValue)
            
            await time.increaseTo(await pool0.whaleCloseTime())
            
            // revert buy out of time for whale 
            await expect(pool0.connect(investors[1]).buyTokenInGalaxyPool(proof1, parseUnits('100', 6), leafInfo1.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool0, "TimeOutToBuyToken").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, anyValue)
            
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
            await purchaseTokens[0].connect(investors[6]).approve(pool0.address, ethers.constants.MaxUint256);
            // await purchaseTokens[0].connect(investors[6]).approve(pool0.address, parseUnits('100',20));
            const leaf17 = buyWhiteList[17]
            const proof17 = getProof(leaf17)
            
            expect(await pool0.connect(investors[6]).buyTokenInCrowdfundingPool(proof17, parseUnits('100', 6))).to.be.emit(pool0, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);
            
            await time.increaseTo(await pool0.communityCloseTime())
            // revert buy because out of time
            await expect(pool0.connect(investors[6]).buyTokenInCrowdfundingPool(proof17, parseUnits('10', 6))).to.be.revertedWithCustomError(pool0, "TimeOutToBuyToken").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, anyValue)
            
            await expect(pool0.connect(investors[0]).redeemTGEIDOToken()).to.be.revertedWithCustomError(pool0, "NotAllowedToRedeemTGEIDOAmount")
            await pool0.connect(admin1).setRedeemableTGEIDOToken(true)
            await pool0.connect(admin1).setRedeemableTGEIDOToken(false)
            
            await time.increaseTo(await pool0.TGEDate())
            await pool0.connect(admin1).setRedeemableTGEIDOToken(true)
            const userIDOTGEAmount0 = await pool0.userIDOTGEAmount(investors[0].address);
            expect(await pool0.connect(investors[0]).redeemTGEIDOToken()).to.be.emit(pool0, "RedeemTGEAmount").withArgs(anyValue, anyValue)
            expect(await IDOTokens[0].balanceOf(investors[0].address)).to.be.equal(userIDOTGEAmount0)
            
            await expect(pool0.connect(investors[0]).redeemTGEIDOToken()).to.be.revertedWithCustomError(pool0, 'Redeemed')
            
            // withdraw purchase token by admin
            const balanceOfPurchaseTokenInPool0 = await purchaseTokens[0].balanceOf(pool0.address)
            const balanceOfOwnerBeforeWithdrawPurchaseToken = await purchaseTokens[0].balanceOf(owner.address)
            expect(await pool0.connect(admin1).withdrawPurchaseToken(owner.address)).to.be.emit(pool0, "WithdrawPurchaseToken").withArgs(owner.address, purchaseTokens[0].address, anyValue)
            const balanceOfOwnerAfterWithdrawPurchaseToken = await purchaseTokens[0].balanceOf(owner.address)
            expect(balanceOfOwnerAfterWithdrawPurchaseToken.sub(balanceOfOwnerBeforeWithdrawPurchaseToken)).to.be.equal(balanceOfPurchaseTokenInPool0)
            expect(await purchaseTokens[0].balanceOf(pool0.address)).to.be.equal(0)

            // withdraw IDO token by admin
            const balanceOfIDOTokenInPool0 = await IDOTokens[0].balanceOf(pool0.address)
            const purchasedAmount = await pool0.purchasedAmount()
            const IDOPurchasedAmount = await pool0.getIDOTokenAmountByOfferedCurrency(purchasedAmount)
            const balanceOfOwnerBeforeWithdrawIDOToken = await IDOTokens[0].balanceOf(owner.address)
            expect(await pool0.connect(admin1).withdrawIDOToken(owner.address)).to.be.emit(pool0, "WithdrawIDOToken").withArgs(anyValue, anyValue, anyValue)
            const balanceOfOwnerAfterWithdrawIDOToken = await IDOTokens[0].balanceOf(owner.address)
            expect(balanceOfOwnerAfterWithdrawIDOToken.sub(balanceOfOwnerBeforeWithdrawIDOToken)).to.be.equal(balanceOfIDOTokenInPool0.sub(IDOPurchasedAmount))
        })
    })
    
    xdescribe("Buy without IDO token and vesting", () => {
        async function deployPool2Fixture() {
            const { jsonCopy, paddingTo32Bytes, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory,
                poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, PERCENTAGE_DENOMINATOR } = await loadFixture(deployFactoryFixture)
                const poolInfo2 = jsonCopy(poolInfoList[2])
                
                await poolFactory.connect(collaborator0).createPool([poolInfoList[2].IDOToken, poolInfoList[2].purchaseToken],
                [poolInfoList[2].maxPurchaseAmountForKYCUser, poolInfoList[2].maxPurchaseAmountForNotKYCUser, poolInfoList[2].TGEDate, poolInfoList[2].TGEPercentage, poolInfoList[2].galaxyParticipationFeePercentage, poolInfoList[2].crowdfundingParticipationFeePercentage,
                poolInfoList[2].galaxyPoolProportion, poolInfoList[2].earlyAccessProportion, poolInfoList[2].totalRaiseAmount, poolInfoList[2].whaleOpenTime, poolInfoList[2].whaleDuration,
                poolInfoList[2].communityDuration, poolInfoList[2].rate, poolInfoList[2].decimal], 1671095858080)

            // await poolFactory.connect(collaborator0).createPool([poolInfoList[2].IDOToken, poolInfoList[2].purchaseToken],
            //     [poolInfoList[2].maxPurchaseAmountForKYCUser, poolInfoList[2].maxPurchaseAmountForNotKYCUser, poolInfoList[2].TGEDate, poolInfoList[2].TGEPercentage, poolInfoList[2].galaxyParticipationFeePercentage, poolInfoList[2].crowdfundingParticipationFeePercentage,
            //     poolInfoList[2].galaxyPoolProportion, poolInfoList[2].earlyAccessProportion, poolInfoList[2].totalRaiseAmount, poolInfoList[2].whaleOpenTime, poolInfoList[2].whaleDuration,
            //     poolInfoList[2].communityDuration, poolInfoList[2].rate, poolInfoList[2].decimal], paddingTo32Bytes('0x63a27c8108892063ce32599c'))

            const pool2Address = await poolFactory.getCreatedPools(collaborator0.address, poolInfoList[2].IDOToken, 0)

            await poolFactory.connect(owner).grantAdminRole(admin1.address)

            const pool2 = new Pool__factory(owner).attach(pool2Address)

            const WHALE_HASH = solidityKeccak256(["string"], ["WHALE"])
            const NORMAL_USER_HASH = solidityKeccak256(["string"], ["NORMAL_USER"])

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
                180000, //1
                93750, //2
                245750, //3
                18750, //4
                1000, //5
                10000, //6
            ]

            const allocationList = PAIDBalanceList.map((balance) => {
                return BigNumber.from(Math.floor(balance / 75000).toString())
            })

            const allocationForGalaxyPool = allocationList.reduce(
                (accumulator: BigNumber, currentValue) => accumulator.add(currentValue),
                BigNumber.from('0')
            );

            const maxPurchaseAmountForGalaxyPool_pool2 = poolInfoList[2].totalRaiseAmount.mul(poolInfoList[2].galaxyPoolProportion).div(PERCENTAGE_DENOMINATOR)

            const buyWhiteList = [
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: maxPurchaseAmountForGalaxyPool_pool2.mul(allocationList[0]).div(allocationForGalaxyPool)
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: maxPurchaseAmountForGalaxyPool_pool2.mul(allocationList[1]).div(allocationForGalaxyPool)
                },
                {
                    candidate: investors[0].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[1].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: maxPurchaseAmountForGalaxyPool_pool2.mul(allocationList[2]).div(allocationForGalaxyPool)

                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: maxPurchaseAmountForGalaxyPool_pool2.mul(allocationList[3]).div(allocationForGalaxyPool)
                },
                {
                    candidate: investors[2].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[3].address,
                    userType: WHALE_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[5].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[0].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[1].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[0].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[1].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[2].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[3].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[4].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[5].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                },
                {
                    candidate: investors[6].address,
                    userType: NORMAL_USER_HASH,
                    maxPurchaseWhetherOrNotKYC: poolInfoList[2].maxPurchaseAmountForNotKYCUser,
                    maxPurchaseBaseOnAllocation: BigNumber.from('0')
                }
            ]

            const leafNodes = buyWhiteList.map((obj) => {
                let leafNode = solidityPack(
                    ["address", "bytes32", "uint256", "uint256"],
                    [obj.candidate, obj.userType, obj.maxPurchaseWhetherOrNotKYC, obj.maxPurchaseBaseOnAllocation]
                );
                return ethers.utils.solidityKeccak256(["bytes"], [leafNode]);
            });

            const buyMerkleTree = new MerkleTree(leafNodes, keccak256, {
                sortPairs: true,
            });

            const buyRootHash = hexlify(buyMerkleTree.getRoot());

            function getProof(leafInfo: { candidate: string, userType: string, maxPurchaseWhetherOrNotKYC: BigNumber, maxPurchaseBaseOnAllocation: BigNumber | number }) {
                const leaf = solidityPack(
                    ["address", "bytes32", "uint256", "uint256"],
                    [leafInfo.candidate, leafInfo.userType, leafInfo.maxPurchaseWhetherOrNotKYC, leafInfo.maxPurchaseBaseOnAllocation]
                )
                const leafNode = solidityKeccak256(["bytes"], [leaf])
                const proof = buyMerkleTree.getHexProof(leafNode)
                return proof
            }


            return { getProof, PERCENTAGE_DENOMINATOR, buyMerkleTree, buyWhiteList, buyRootHash, jsonCopy, owner, admin1, admin2, admin3, collaborator0, collaborator1, collaborator2, investors, pool, poolFactory, poolInfoList, provider, zeroAddress, IDOTokens, purchaseTokens, pool2 }
        }
        it("Should get info from pool after created", async () => {
            const { jsonCopy, pool2, poolInfoList } = await loadFixture(deployPool2Fixture)
            const poolInfo2 = jsonCopy(poolInfoList[2])

            expect(await pool2.IDOToken()).to.be.equal(poolInfoList[2].IDOToken)
            expect(await pool2.purchaseToken()).to.be.equal(poolInfoList[2].purchaseToken)
            expect((await pool2.offeredCurrency()).rate).to.be.equal(poolInfoList[2].rate)
            expect((await pool2.offeredCurrency()).decimal).to.be.equal(poolInfoList[2].decimal)
            expect(await pool2.maxPurchaseAmountForKYCUser()).to.be.equal(poolInfoList[2].maxPurchaseAmountForKYCUser)
            expect(await pool2.maxPurchaseAmountForNotKYCUser()).to.be.equal(poolInfoList[2].maxPurchaseAmountForNotKYCUser)
            expect(await pool2.TGEPercentage()).to.be.equal(poolInfoList[2].TGEPercentage)
            expect(await pool2.galaxyParticipationFeePercentage()).to.be.equal(poolInfoList[2].galaxyParticipationFeePercentage)
            expect(await pool2.crowdfundingParticipationFeePercentage()).to.be.equal(poolInfoList[2].crowdfundingParticipationFeePercentage)
            expect(await pool2.galaxyPoolProportion()).to.be.equal(poolInfoList[2].galaxyPoolProportion)
            expect(await pool2.earlyAccessProportion()).to.be.equal(poolInfoList[2].earlyAccessProportion)
            expect(await pool2.totalRaiseAmount()).to.be.equal(poolInfoList[2].totalRaiseAmount)
            expect(await pool2.whaleOpenTime()).to.be.equal(poolInfoList[2].whaleOpenTime)
            expect(await pool2.whaleCloseTime()).to.be.equal(Number(poolInfoList[2].whaleDuration) + Number(poolInfoList[2].whaleOpenTime))
            expect(await pool2.communityCloseTime()).to.be.equal(Number(poolInfoList[2].communityDuration) + Number(poolInfoList[2].whaleOpenTime) + Number(poolInfoList[2].whaleDuration))

            expect(await pool2.maxPurchaseAmountForGalaxyPool()).to.be.equal((poolInfoList[2].totalRaiseAmount.mul(poolInfoList[2].galaxyPoolProportion).div(10000)))
            expect(await pool2.maxPurchaseAmountForEarlyAccess()).to.be.equal((poolInfoList[2].totalRaiseAmount.mul(BigNumber.from('10000').sub(poolInfoList[2].galaxyPoolProportion)).mul(poolInfoList[2].earlyAccessProportion).div(10000).div(10000)))
            expect(await pool2.communityOpenTime()).to.be.equal(poolInfoList[2].whaleOpenTime.add(poolInfoList[2].whaleDuration))
        })

        it("Should set merkle tree root successfully by admin; revert without admin", async () => {
            const { pool2, buyRootHash, admin1, collaborator0 } = await loadFixture(deployPool2Fixture)

            await pool2.connect(admin1).setRoot(buyRootHash);

            expect(await pool2.root()).to.be.equal(buyRootHash)

            const randomBuyRootHash = hexlify(randomBytes(32))

            await expect(pool2.connect(collaborator0).setRoot(randomBuyRootHash)).to.be.revertedWithCustomError(pool2, "NotAdmin");
        })

        it("Should close pool by admin; revert without admin", async () => {
            const { pool2, admin1 } = await loadFixture(deployPool2Fixture)
            await pool2.connect(admin1).closePool();
            expect(await pool2.paused()).to.be.true;
        })

        it("Should buy token in galaxy pool, early access and open time successfully by all types of user; revert out of time", async () => {
            const { owner, getProof, PERCENTAGE_DENOMINATOR, poolInfoList, collaborator0, IDOTokens, purchaseTokens, buyMerkleTree, pool2, admin1, buyRootHash, investors, buyWhiteList } = await loadFixture(deployPool2Fixture)
            await pool2.connect(admin1).setRoot(buyRootHash)

            // collaborator transfer IDO token to IDO pool
            await IDOTokens[0].connect(collaborator0).transfer(pool2.address, parseUnits('1000000', '28'))

            // update root
            await pool2.connect(admin1).setRoot(buyRootHash)

            // get proof for investor0 in galaxy pool
            const leafInfo0 = buyWhiteList[0]
            const proof0 = getProof(leafInfo0)

            // revert TimeOutToBuyToken (buy before whaleOpentime)
            await expect(pool2.connect(investors[0]).buyTokenInGalaxyPool(proof0, 100000, leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, "TimeOutToBuyToken").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, investors[0].address)

            // buy successfully (investor0, WHALE, KYC user, galaxy pool)
            await time.increaseTo(await pool2.whaleOpenTime())
            await expect(pool2.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90', 18), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, 'NotEnoughAllowance')
            await purchaseTokens[2].connect(investors[0]).approve(pool2.address, ethers.constants.MaxUint256)
            await expect(pool2.connect(investors[0]).buyTokenInGalaxyPool(proof0, BigNumber.from("0"), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, "ZeroAmount")
            expect(await pool2.connect(investors[0]).buyTokenInGalaxyPool(proof0, parseUnits('90', 18), leafInfo0.maxPurchaseBaseOnAllocation)).to.be.emit(pool2, "BuyToken").withArgs(investors[0].address, anyValue, anyValue, anyValue) // 90 purchaseToken0
            expect(await pool2.purchasedAmount()).to.be.equal(parseUnits('90', 18))
            expect(await pool2.userIDOTGEAmount(investors[0].address)).to.be.equal(0)
            expect(await pool2.userPurchasedAmount(investors[0].address)).to.be.equal(parseUnits('90', 18))
            // get proof for investor1 in galaxy pool
            const leafInfo1 = buyWhiteList[1]
            const proof1 = getProof(leafInfo1)

            // revert buy more than max purchase amount for KYC user (investor1, WHALE, KYC user, galaxy pool)
            await purchaseTokens[2].connect(investors[1]).approve(pool2.address, ethers.constants.MaxUint256)
            await expect(pool2.connect(investors[1]).buyTokenInGalaxyPool(proof1, parseUnits('11000', 18), leafInfo1.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, "ExceedMaxPurchaseAmountForKYCUser").withArgs(investors[1].address, parseUnits('11000', 18))

            // get proof for investor2 in galaxy pool
            const leafInfo4 = buyWhiteList[4]
            const proof4 = getProof(leafInfo4)

            // buy successfully (investor2, WHALE, Not KYC user, galaxy pool)
            await purchaseTokens[2].connect(investors[2]).approve(pool2.address, ethers.constants.MaxUint256)
            expect(await pool2.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('870', 18), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.emit(pool2, "BuyToken").withArgs(investors[2].address, anyValue, anyValue, anyValue) // 900 purchaseToken0

            // buy successfully twice (investor2, WHALE, Not KYC user, galaxy pool)
            expect(await pool2.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('100', 18), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.emit(pool2, "BuyToken").withArgs(investors[2].address, anyValue, anyValue, anyValue) // 100 purchaseToken0

            // revert buy more than max purchase amount for Not KYC user in twice (investor2, WHALE, Not KYC user, galaxy pool)
            await expect(pool2.connect(investors[2]).buyTokenInGalaxyPool(proof4, parseUnits('50', 18), leafInfo4.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, "ExceedMaxPurchaseAmountForNotKYCUser").withArgs(investors[2].address, anyValue)

            // get proof for investor5
            const leafInfo8 = buyWhiteList[8]
            const proof8 = getProof(leafInfo8)

            // revert normal, KYC user buy in galaxy pool (investor4, NORMAL, KYC user, galaxy pool)
            await purchaseTokens[2].connect(investors[5]).approve(pool2.address, ethers.constants.MaxUint256)
            await expect(pool2.connect(investors[5]).buyTokenInGalaxyPool(proof8, 10, leafInfo8.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, "ExceedMaxPurchaseAmountForUser")
            await expect(pool2.connect(investors[5]).buyTokenInGalaxyPool(proof8, 10, 10)).to.be.revertedWithCustomError(pool2, "NotInWhaleList").withArgs(investors[5].address)

            // get proof for investor0 in early access
            const leaf0EA = buyWhiteList[2]
            const proof0EA = getProof(leaf0EA)

            // buy successfully (investor0, WHALE, KYC User, early access)
            const balanceOfInvestor0BeforeBuyToken = await purchaseTokens[2].balanceOf(investors[0].address)
            const balanceOfpool2BeforeBuyToken = await purchaseTokens[2].balanceOf(pool2.address)
            expect(await pool2.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('100', 18))).to.be.emit(pool2, "BuyToken").withArgs(investors[0].address, pool2.address, anyValue, anyValue)
            const balanceOfInvestor0AfterBuyToken = await purchaseTokens[2].balanceOf(investors[0].address)
            const balanceOfpool2AfterBuyToken = await purchaseTokens[2].balanceOf(pool2.address)
            expect((balanceOfInvestor0AfterBuyToken).sub(balanceOfInvestor0BeforeBuyToken)).to.be.equal(parseUnits('-115', 18))
            expect((balanceOfpool2AfterBuyToken).sub(balanceOfpool2BeforeBuyToken)).to.be.equal(parseUnits('115', 18))

            // buy successfully upto max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            expect(await pool2.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('9800', 18))).to.be.emit(pool2, "BuyToken").withArgs(investors[0].address, pool2.address, anyValue, anyValue)

            // revert withdraw purchase token
            await expect(pool2.connect(owner).withdrawPurchaseToken(owner.address)).to.be.revertedWithCustomError(pool2, "NotEnoughConditionToWithdrawPurchaseToken");

            // revert withdraw IDO token
            await expect(pool2.connect(owner).withdrawIDOToken(owner.address)).to.be.revertedWithCustomError(pool2, "ZeroAddress")

            // revert buy more than max purchase of KYC in galaxy and after in early access (investor0, WHALE, KYC User, early access)
            await expect(pool2.connect(investors[0]).buyTokenInCrowdfundingPool(proof0EA, parseUnits('100', 18))).to.be.revertedWithCustomError(pool2, "ExceedMaxPurchaseAmountForKYCUser").withArgs(investors[0].address, anyValue)

            // get proof of investor 3 for early access
            const leaf7EA = buyWhiteList[7]
            const proof7EA = getProof(leaf7EA)

            // buy successfully (investor3, WHALE, Not KYC User, early access)
            await purchaseTokens[2].connect(investors[3]).approve(pool2.address, ethers.constants.MaxUint256)
            // await purchaseTokens[2].connect(investors[3]).approve(pool2.address, parseUnits('10',20))
            expect(await pool2.connect(investors[3]).buyTokenInCrowdfundingPool(proof7EA, parseUnits('10', 18))).to.be.emit(pool2, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);

            // revert buy (investor5, NORMAL, KYC User, early access)
            await expect(pool2.connect(investors[5]).buyTokenInCrowdfundingPool(proof8, parseUnits('10', 18))).to.be.revertedWithCustomError(pool2, "NotInWhaleList").withArgs(anyValue)

            await time.increaseTo(await pool2.whaleCloseTime())

            // revert buy out of time for whale 
            await expect(pool2.connect(investors[1]).buyTokenInGalaxyPool(proof1, parseUnits('100', 18), leafInfo1.maxPurchaseBaseOnAllocation)).to.be.revertedWithCustomError(pool2, "TimeOutToBuyToken").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, anyValue)

            // get proof of investor 1 for community (not early access)
            const leaf10NU = buyWhiteList[10]
            const proof10NU = getProof(leaf10NU)

            // buy successfully (investor1, WHALE-NORMAL, KYC user, community pool)
            expect(await pool2.connect(investors[1]).buyTokenInCrowdfundingPool(proof10NU, parseUnits('100', 6))).to.be.emit(pool2, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);

            // get proof of investor 0 for community (not early access)
            const leaf9NU = buyWhiteList[9]
            const proof9NU = getProof(leaf9NU)

            // buy successfully (investor6, NORMAL, Not KYC user, community pool)
            await purchaseTokens[2].connect(investors[6]).approve(pool2.address, ethers.constants.MaxUint256);
            // await purchaseTokens[2].connect(investors[6]).approve(pool2.address, parseUnits('100',20));
            const leaf17 = buyWhiteList[17]
            const proof17 = getProof(leaf17)

            expect(await pool2.connect(investors[6]).buyTokenInCrowdfundingPool(proof17, parseUnits('100', 6))).to.be.emit(pool2, "BuyToken").withArgs(anyValue, anyValue, anyValue, anyValue);

            await time.increaseTo(await pool2.communityCloseTime())
            // revert buy because out of time
            await expect(pool2.connect(investors[6]).buyTokenInCrowdfundingPool(proof17, parseUnits('10', 6))).to.be.revertedWithCustomError(pool2, "TimeOutToBuyToken").withArgs(anyValue, anyValue, anyValue, anyValue, anyValue, anyValue)

            await expect(pool2.connect(investors[0]).redeemTGEIDOToken()).to.be.revertedWithCustomError(pool2, "ZeroAddress")
            await expect(pool2.connect(admin1).setRedeemableTGEIDOToken(true)).to.be.revertedWithCustomError(pool2, "ZeroAddress")
            await expect(pool2.connect(investors[1]).redeemTGEIDOToken()).to.be.revertedWithCustomError(pool2, "ZeroAddress")


            // withdraw purchase token by admin
            const balanceOfPurchaseTokenInpool2 = await purchaseTokens[2].balanceOf(pool2.address)
            const purchasedAmount = await pool2.purchasedAmount()
            const IDOPurchasedAmount = await pool2.getIDOTokenAmountByOfferedCurrency(purchasedAmount)
            const balanceOfOwnerBeforeWithdrawPurchaseToken = await purchaseTokens[2].balanceOf(owner.address)
            expect(await pool2.connect(admin1).withdrawPurchaseToken(owner.address)).to.be.emit(pool2, "WithdrawPurchaseToken").withArgs(owner.address, purchaseTokens[2].address, anyValue)
            const balanceOfOwnerAfterWithdrawPurchaseToken = await purchaseTokens[2].balanceOf(owner.address)
            expect(balanceOfOwnerAfterWithdrawPurchaseToken.sub(balanceOfOwnerBeforeWithdrawPurchaseToken)).to.be.equal(balanceOfPurchaseTokenInpool2.sub(IDOPurchasedAmount))
            expect(await purchaseTokens[2].balanceOf(pool2.address)).to.be.equal(0)

            // revert withdraw IDO token by admin
            await expect(pool2.connect(admin1).withdrawIDOToken(owner.address)).to.be.revertedWithCustomError(pool2, "ZeroAddress")
        })
    })

    xdescribe("Pool is cancelled when buying", () => {

    })

    xdescribe("Pool with deployed IDO token is not funded when buying", () => {

    })

    xdescribe("Pool without prefix IDO token is not funded when buying", () => {

    })
})
