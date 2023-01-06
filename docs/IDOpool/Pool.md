# Pool









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### IDOToken

```solidity
function IDOToken() external view returns (contract IERC20)
```



*Address of IDO token*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### NORMAL_USER

```solidity
function NORMAL_USER() external view returns (bytes32)
```



*keccak256(&quot;NORMAL_USER&quot;)*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### PERCENTAGE_DENOMINATOR

```solidity
function PERCENTAGE_DENOMINATOR() external view returns (uint16)
```



*percentage denominator*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### TGEDate

```solidity
function TGEDate() external view returns (uint64)
```



*Time for user to redeem IDO token*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint64 | undefined |

### TGEPercentage

```solidity
function TGEPercentage() external view returns (uint16)
```



*Percentage of IDO token amount of user, which can be redeemed after TGEDate*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### TGERedeemable

```solidity
function TGERedeemable() external view returns (bool)
```



*Status whether or not investor can redeem IDO token*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### WHALE

```solidity
function WHALE() external view returns (bytes32)
```



*keccak256(&quot;WHALE&quot;)*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### buyTokenInCrowdfundingPool

```solidity
function buyTokenInCrowdfundingPool(bytes32[] proof, uint256 _purchaseAmount) external nonpayable
```

Investor buy token in crowdfunding pool

*Must be in time for crowdfunding pool and pool is not closed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proof | bytes32[] | Respective proof for a leaf, which is respective for investor in merkle tree |
| _purchaseAmount | uint256 | Purchase amount of investor |

### buyTokenInCrowdfundingPoolWithPermit

```solidity
function buyTokenInCrowdfundingPoolWithPermit(bytes32[] proof, uint256 _purchaseAmount, uint256 _allowance, uint256 _deadline, bytes _signature) external nonpayable
```

Investor buy token in crowdfunding pool

*Investor do not need execute approve transaction, but need to sign data off-chain; used only for USDC. Must be in time for crowdfunding pool and pool is not closed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proof | bytes32[] | Respective proof for a leaf, which is respective for investor in merkle tree |
| _purchaseAmount | uint256 | Purchase amount of investor |
| _allowance | uint256 | Allowance amount of investor&#39;s USDC for pool |
| _deadline | uint256 | Deadline of off-chain investor&#39;s signature |
| _signature | bytes | Signature of investor |

### buyTokenInGalaxyPool

```solidity
function buyTokenInGalaxyPool(bytes32[] proof, uint256 _purchaseAmount, uint256 _maxPurchaseBaseOnAllocations) external nonpayable
```

Investor buy token in galaxy pool

*Must be in time for whale and pool is not closed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proof | bytes32[] | Respective proof for a leaf, which is respective for investor in merkle tree |
| _purchaseAmount | uint256 | Purchase amount of investor |
| _maxPurchaseBaseOnAllocations | uint256 | Max purchase amount base on allocation of whale |

### buyTokenInGalaxyPoolWithPermit

```solidity
function buyTokenInGalaxyPoolWithPermit(bytes32[] proof, uint256 _purchaseAmount, uint256 _maxPurchaseBaseOnAllocations, uint256 _deadline, bytes _signature) external nonpayable
```

Investor buy token in galaxy pool

*Investor do not need execute approve transaction, but need to sign data off-chain; used only for USDC. Must be in time for whale and pool is not closed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| proof | bytes32[] | Respective proof for a leaf, which is respective for investor in merkle tree |
| _purchaseAmount | uint256 | Purchase amount of investor |
| _maxPurchaseBaseOnAllocations | uint256 | Max purchase amount base on allocation of whale |
| _deadline | uint256 | Deadline of off-chain investor&#39;s signature |
| _signature | bytes | Signature of investor |

### closePool

```solidity
function closePool() external nonpayable
```

Close pool: cancel project, nobody can buy token

*Only admin can call it*


### communityCloseTime

```solidity
function communityCloseTime() external view returns (uint64)
```



*Close time of crowdfunding pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint64 | undefined |

### communityOpenTime

```solidity
function communityOpenTime() external view returns (uint64)
```



*Open time for community user = Close time of galaxy pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint64 | undefined |

### crowdfundingParticipationFeePercentage

```solidity
function crowdfundingParticipationFeePercentage() external view returns (uint16)
```



*Fee percentage when buying token in crowdfunding pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### earlyAccessProportion

```solidity
function earlyAccessProportion() external view returns (uint16)
```



*Proportion of crowdfunding pool amount for early access*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### galaxyParticipationFeePercentage

```solidity
function galaxyParticipationFeePercentage() external view returns (uint16)
```



*Fee percentage when buying token in galaxy pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### galaxyPoolProportion

```solidity
function galaxyPoolProportion() external view returns (uint16)
```



*Proportion of total raise for galaxy pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleGranted} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### initialize

```solidity
function initialize(address[2] addrs, uint256[14] uints) external nonpayable
```

Initialize a pool with its information

*Emit 2 events*

#### Parameters

| Name | Type | Description |
|---|---|---|
| addrs | address[2] | Array of address includes: address of IDO token, address of purchase token |
| uints | uint256[14] | Array of pool information includes: max purchase amount for KYC user, max purchase amount for Not KYC user, TGE date, TGE percentage,  galaxy participation fee percentage, crowdfunding participation fee percentage, galaxy pool proportion, early access proportion, total raise amount, whale open time, whale duration, community duration, rate and decimal of IDO token |

### maxPurchaseAmountForEarlyAccess

```solidity
function maxPurchaseAmountForEarlyAccess() external view returns (uint256)
```



*Max purchase amount for early access  = (total raise amount - total raise amount * galaxy pool proportion) * early access proportion*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### maxPurchaseAmountForGalaxyPool

```solidity
function maxPurchaseAmountForGalaxyPool() external view returns (uint256)
```



*Max purchase amount for galaxy pool  = total raise amount * galaxy pool proportion*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### maxPurchaseAmountForKYCUser

```solidity
function maxPurchaseAmountForKYCUser() external view returns (uint256)
```



*Max purchase amount for KYC user*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### maxPurchaseAmountForNotKYCUser

```solidity
function maxPurchaseAmountForNotKYCUser() external view returns (uint256)
```



*Max purchase amount for NOT KYC user*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### offeredCurrency

```solidity
function offeredCurrency() external view returns (uint256 rate, uint256 decimal)
```



*Store rate and decimal to display price of IDO token*


#### Returns

| Name | Type | Description |
|---|---|---|
| rate | uint256 | undefined |
| decimal | uint256 | undefined |

### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### poolFactory

```solidity
function poolFactory() external view returns (contract IPoolFactory)
```



*Address of pool factory*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IPoolFactory | undefined |

### purchaseToken

```solidity
function purchaseToken() external view returns (contract IERC20)
```



*Address of purchase token*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined |

### purchasedAmount

```solidity
function purchasedAmount() external view returns (uint256)
```



*Purchased amount in all pools*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### purchasedAmountInEarlyAccess

```solidity
function purchasedAmountInEarlyAccess() external view returns (uint256)
```



*Purchased amount in early access*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### purchasedAmountInGalaxyPool

```solidity
function purchasedAmountInGalaxyPool() external view returns (uint256)
```



*Purchased amount in galaxy pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### redeemTGEIDOToken

```solidity
function redeemTGEIDOToken(uint256 _IDORedeemAmount) external nonpayable
```

Investor redeem IDO token after TGE date



#### Parameters

| Name | Type | Description |
|---|---|---|
| _IDORedeemAmount | uint256 | Amount of IDO token is wanted to redeem |

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### root

```solidity
function root() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### setRedeemableTGEIDOToken

```solidity
function setRedeemableTGEIDOToken(bool _TGERedeemableStatus) external nonpayable
```

Allow or disallow investors to redeem TGE amount of IDO token

*Only admin can call it*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _TGERedeemableStatus | bool | undefined |

### setRoot

```solidity
function setRoot(bytes32 _root) external nonpayable
```

Set merkle tree root after snapshoting information of investor

*Only admin can call it*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _root | bytes32 | Root of merkle tree |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### totalRaiseAmount

```solidity
function totalRaiseAmount() external view returns (uint256)
```



*Total raise amount of all pools*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### updateTime

```solidity
function updateTime(uint64 _newWhaleCloseTime, uint64 _newCommunityCloseTime) external nonpayable
```

Update time for galaxy pool and crowdfunding pool

*Only admin can call it, galaxy pool must be closed before crowdfunding pool*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _newWhaleCloseTime | uint64 | New close time of galaxy pool |
| _newCommunityCloseTime | uint64 | New close time of crowdfunding pool |

### userIDOAirdropAmount

```solidity
function userIDOAirdropAmount(address) external view returns (uint256)
```



*Mapping from User to airdrop amount*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### userIDOTGEAmount

```solidity
function userIDOTGEAmount(address) external view returns (uint256)
```



*Mapping from User to TGE amount*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### userPurchasedAmount

```solidity
function userPurchasedAmount(address) external view returns (uint256)
```



*Mapping from User to purchased amount *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### whaleCloseTime

```solidity
function whaleCloseTime() external view returns (uint64)
```



*Close time of galaxy pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint64 | undefined |

### whaleOpenTime

```solidity
function whaleOpenTime() external view returns (uint64)
```



*Open time of galaxy pool*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint64 | undefined |

### withdrawIDOToken

```solidity
function withdrawIDOToken(address _withdrawIDOTokenRecipient) external nonpayable
```

Admin withdraw redundant IDO token in pool

*Only admin can call it after pool closed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _withdrawIDOTokenRecipient | address | Address of recipient |

### withdrawPurchaseToken

```solidity
function withdrawPurchaseToken(address _withdrawPurchaseTokenRecipient) external nonpayable
```

Admin withdraw purchase token in pool

*Only admin can call it after pool closed*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _withdrawPurchaseTokenRecipient | address | Address of recipient |



## Events

### BuyToken

```solidity
event BuyToken(address indexed buyer, address indexed pool, address indexed IDOToken, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer `indexed` | address | undefined |
| pool `indexed` | address | undefined |
| IDOToken `indexed` | address | undefined |
| purchaseAmount  | uint256 | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### PoolCreatedChild1

```solidity
event PoolCreatedChild1(address IDOToken, address purchaseToken, uint256 maxPurchaseAmountForKYCUser, uint256 maxPurchaseAmountForNotKYCUser, uint64 TGEDate, uint16 TGEPercentage, uint16 galaxyParticipationFeePercentage, uint16 crowdfundingParticipationFeePercentage)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| IDOToken  | address | undefined |
| purchaseToken  | address | undefined |
| maxPurchaseAmountForKYCUser  | uint256 | undefined |
| maxPurchaseAmountForNotKYCUser  | uint256 | undefined |
| TGEDate  | uint64 | undefined |
| TGEPercentage  | uint16 | undefined |
| galaxyParticipationFeePercentage  | uint16 | undefined |
| crowdfundingParticipationFeePercentage  | uint16 | undefined |

### PoolCreatedChild2

```solidity
event PoolCreatedChild2(uint16 galaxyPoolProportion, uint16 earlyAccessProportion, uint256 totalRaiseAmount, uint64 whaleOpenTime, uint64 whaleCloseTime, uint64 communityCloseTime, uint256 rate, uint256 decimal)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| galaxyPoolProportion  | uint16 | undefined |
| earlyAccessProportion  | uint16 | undefined |
| totalRaiseAmount  | uint256 | undefined |
| whaleOpenTime  | uint64 | undefined |
| whaleCloseTime  | uint64 | undefined |
| communityCloseTime  | uint64 | undefined |
| rate  | uint256 | undefined |
| decimal  | uint256 | undefined |

### RedeemTGEAmount

```solidity
event RedeemTGEAmount(address buyer, uint256 redeemAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer  | address | undefined |
| redeemAmount  | uint256 | undefined |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### SetIDOTokenAddress

```solidity
event SetIDOTokenAddress(address IDOToken)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| IDOToken  | address | undefined |

### SetTGERedeemable

```solidity
event SetTGERedeemable(bool redeemable)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemable  | bool | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### UpdateFeeRecipient

```solidity
event UpdateFeeRecipient(address indexed feeRecipient)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| feeRecipient `indexed` | address | undefined |

### UpdateOfferedCurrencyRateAndDecimal

```solidity
event UpdateOfferedCurrencyRateAndDecimal(uint256 _rate, uint256 _decimal)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _rate  | uint256 | undefined |
| _decimal  | uint256 | undefined |

### UpdateOpenPoolStatus

```solidity
event UpdateOpenPoolStatus(address indexed pool, bool status)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| pool `indexed` | address | undefined |
| status  | bool | undefined |

### UpdateRoot

```solidity
event UpdateRoot(bytes32 root)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| root  | bytes32 | undefined |

### UpdateTime

```solidity
event UpdateTime(uint64 whaleOpenTime, uint64 whaleCloseTime, uint64 communityOpenTime, uint64 communityCloseTime)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| whaleOpenTime  | uint64 | undefined |
| whaleCloseTime  | uint64 | undefined |
| communityOpenTime  | uint64 | undefined |
| communityCloseTime  | uint64 | undefined |

### WithdrawIDOToken

```solidity
event WithdrawIDOToken(address withdrawIDOTokenRecipient, address IDOToken, uint256 remainAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| withdrawIDOTokenRecipient  | address | undefined |
| IDOToken  | address | undefined |
| remainAmount  | uint256 | undefined |

### WithdrawPurchaseToken

```solidity
event WithdrawPurchaseToken(address withdrawPurchaseTokenRecipient, address purchaseToken, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| withdrawPurchaseTokenRecipient  | address | undefined |
| purchaseToken  | address | undefined |
| purchaseAmount  | uint256 | undefined |



## Errors

### AlreadySetRedeemableTGE

```solidity
error AlreadySetRedeemableTGE(bool presentStatus)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| presentStatus | bool | undefined |

### ExceedMaxPurchaseAmountForEarlyAccess

```solidity
error ExceedMaxPurchaseAmountForEarlyAccess(address buyer, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |
| purchaseAmount | uint256 | undefined |

### ExceedMaxPurchaseAmountForGalaxyPool

```solidity
error ExceedMaxPurchaseAmountForGalaxyPool(address buyer, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |
| purchaseAmount | uint256 | undefined |

### ExceedMaxPurchaseAmountForKYCUser

```solidity
error ExceedMaxPurchaseAmountForKYCUser(address buyer, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |
| purchaseAmount | uint256 | undefined |

### ExceedMaxPurchaseAmountForNotKYCUser

```solidity
error ExceedMaxPurchaseAmountForNotKYCUser(address buyer, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |
| purchaseAmount | uint256 | undefined |

### ExceedMaxPurchaseAmountForUser

```solidity
error ExceedMaxPurchaseAmountForUser()
```






### ExceedTotalRaiseAmount

```solidity
error ExceedTotalRaiseAmount(address buyer, uint256 purchaseAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |
| purchaseAmount | uint256 | undefined |

### NotAdmin

```solidity
error NotAdmin()
```






### NotAllowedToRedeemTGEIDOAmount

```solidity
error NotAllowedToRedeemTGEIDOAmount()
```






### NotEnoughAllowance

```solidity
error NotEnoughAllowance(address buyer, address purchaseToken, uint256 allowance, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |
| purchaseToken | address | undefined |
| allowance | uint256 | undefined |
| amount | uint256 | undefined |

### NotEnoughConditionToWithdrawIDOToken

```solidity
error NotEnoughConditionToWithdrawIDOToken()
```






### NotEnoughConditionToWithdrawPurchaseToken

```solidity
error NotEnoughConditionToWithdrawPurchaseToken()
```






### NotInWhaleList

```solidity
error NotInWhaleList(address buyer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer | address | undefined |

### NotUpdateValidTime

```solidity
error NotUpdateValidTime(uint256 whaleOpenTime, uint256 whaleCloseTime, uint256 communityOpenTime, uint256 communityCloseTime)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| whaleOpenTime | uint256 | undefined |
| whaleCloseTime | uint256 | undefined |
| communityOpenTime | uint256 | undefined |
| communityCloseTime | uint256 | undefined |

### NotValidSignature

```solidity
error NotValidSignature()
```






### NotYetTimeToRedeemTGE

```solidity
error NotYetTimeToRedeemTGE()
```






### RedeemExceedMaxTGEAmount

```solidity
error RedeemExceedMaxTGEAmount()
```






### TimeOutToBuyToken

```solidity
error TimeOutToBuyToken(uint256 whaleOpenTime, uint256 whaleCloseTime, uint256 communityOpenTime, uint256 communityCloseTime, uint256 timestamp, address buyer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| whaleOpenTime | uint256 | undefined |
| whaleCloseTime | uint256 | undefined |
| communityOpenTime | uint256 | undefined |
| communityCloseTime | uint256 | undefined |
| timestamp | uint256 | undefined |
| buyer | address | undefined |

### TimeOutToSetPoolStatus

```solidity
error TimeOutToSetPoolStatus()
```






### ZeroAddress

```solidity
error ZeroAddress()
```






### ZeroAmount

```solidity
error ZeroAmount()
```







