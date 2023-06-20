import { BigNumberish, ethers, Signer } from 'ethers';

type Domain = {
  name: string;
  version: string;
  chainId: BigNumberish;
  verifyingContract: string;
};

export const buildFundSignature = async (
  signer: Signer,
  domain: Domain,
  IDOToken: string,
  pool: string,
  symbolHash: string,
  decimals: BigNumberish
) => {
  const signature = await (signer as any)._signTypedData(
    // domain
    domain,
    {
      Fund: [
        { name: 'IDOToken', type: 'address' },
        { name: 'pool', type: 'address' },
        { name: 'symbolHash', type: 'bytes32' },
        { name: 'decimals', type: 'uint8' },
      ],
    },
    {
      owner: await signer.getAddress(),
      IDOToken,
      pool,
      symbolHash,
      decimals
    },
  );

  return signature
};
