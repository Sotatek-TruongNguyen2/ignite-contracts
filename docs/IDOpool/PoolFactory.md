# PoolFactory









## Methods

### ADMIN

```solidity
function ADMIN() external view returns (bytes32)
```

keccak256(&quot;ADMIN&quot;)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### PERCENTAGE_DENOMINATOR

```solidity
function PERCENTAGE_DENOMINATOR() external view returns (uint16)
```

percentage denominator




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | undefined |

### allPools

```solidity
function allPools(uint256) external view returns (address)
```

Array of created pools address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### allPoolsLength

```solidity
function allPoolsLength() external view returns (uint256)
```

Get the number of all created pools




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Return number of created pools |

### createPool

```solidity
function createPool(address[2] addrs, uint256[14] uints, uint256 dbProjectId) external nonpayable returns (address pool)
```

Create new pool

*Only has one pool address respectively for one input params*

#### Parameters

| Name | Type | Description |
|---|---|---|
| addrs | address[2] | Array of address includes: address of IDO token, address of purchase token |
| uints | uint256[14] | Array of pool information includes: max purchase amount for KYC user, max purchase amount for Not KYC user, TGE date, TGE percentage,  galaxy participation fee percentage, crowdfunding participation fee percentage, galaxy pool proportion, early access proportion, total raise amount, whale open time, whale duration, community duration, rate and decimal of IDO token |
| dbProjectId | uint256 | Project Id in database |

#### Returns

| Name | Type | Description |
|---|---|---|
| pool | address | Address of new pool |

### getCreatedPools

```solidity
function getCreatedPools(address, address, uint256) external view returns (address)
```

Mapping from user to (From token to array of created pools for token)



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | address | undefined |
| _2 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### getCreatedPoolsByToken

```solidity
function getCreatedPoolsByToken(address _creator, address _token) external view returns (address[])
```

Get created pools by token address

*User can retrieve their created pool by address of tokens*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _creator | address | Address of created pool user |
| _token | address | Address of token want to query |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | Created Pool Address |

### getCreatedPoolsLengthByToken

```solidity
function getCreatedPoolsLengthByToken(address _creator, address _token) external view returns (uint256)
```

Retrieve number of pools created for specific token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _creator | address | Address of created pool user |
| _token | address | Address of token want to query |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Return number of created pool |

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

### grantAdminRole

```solidity
function grantAdminRole(address _admin) external nonpayable
```

Grant admin role for new admin

*Only admin can call it*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _admin | address | Address of new admin |

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

### hasAdminRole

```solidity
function hasAdminRole(address _admin) external view returns (bool)
```

Check whether or not an account has admin role



#### Parameters

| Name | Type | Description |
|---|---|---|
| _admin | address | Address of an account |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | Return true if account has admin role, and vice versa. |

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
function initialize(address _poolImplementationAddress) external nonpayable
```

Initialize pool factory with address of pool implementation

*Called only once*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _poolImplementationAddress | address | Address of pool implementation |

### poolImplementationAddress

```solidity
function poolImplementationAddress() external view returns (address)
```

Address of pool implementation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

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

### revokeAdminRole

```solidity
function revokeAdminRole(address _admin) external nonpayable
```

Revoke admin role of an admin

*Only admin can call it*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _admin | address | Address of an admin |

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

### setPoolImplementation

```solidity
function setPoolImplementation(address _poolImplementationAddress) external nonpayable
```

Set or change address of pool implementation

*Only admin can can call it*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _poolImplementationAddress | address | Address of new pool implementation |

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



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### PoolCreated

```solidity
event PoolCreated(bytes32 poolInfoHash, address pool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| poolInfoHash  | bytes32 | undefined |
| pool  | address | undefined |

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

### UpdatePoolImplementation

```solidity
event UpdatePoolImplementation(address indexed oldPoolImplementation, address indexed newPoolImplementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldPoolImplementation `indexed` | address | undefined |
| newPoolImplementation `indexed` | address | undefined |



## Errors

### AlreadyAdmin

```solidity
error AlreadyAdmin()
```






### AlreadyNotAdmin

```solidity
error AlreadyNotAdmin()
```






### NotValidEarlyAccessProportion

```solidity
error NotValidEarlyAccessProportion()
```






### NotValidGalaxyPoolProportion

```solidity
error NotValidGalaxyPoolProportion()
```






### ZeroAddress

```solidity
error ZeroAddress()
```






### ZeroAmount

```solidity
error ZeroAmount()
```






### ZeroOfferedRate

```solidity
error ZeroOfferedRate()
```







