import { keccak256, encodePacked, encodeAbiParameters, parseAbiParameters, recoverAddress, type Address } from 'viem';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from './config.js';
import type { IntentMandate } from './types.js';

/**
 * EIP-712 utilities for AP2 mandate signing and EIP-3009 payment authorization
 */

export const INTENT_MANDATE_DOMAIN = {
  name: 'AP2-IntentMandate',
  version: '1',
  chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
} as const;

export const INTENT_MANDATE_TYPES = {
  IntentMandate: [
    { name: 'mandateId', type: 'string' },
    { name: 'userAddress', type: 'address' },
    { name: 'merchantAddress', type: 'address' },
    { name: 'dailyCapMicroUsdc', type: 'uint256' },
    { name: 'pricePerMessageMicroUsdc', type: 'uint256' },
    { name: 'batchThreshold', type: 'uint256' },
    { name: 'serviceType', type: 'string' },
    { name: 'modelName', type: 'string' },
    { name: 'expiresAt', type: 'uint256' },
  ],
} as const;

/**
 * Get the mandate message for EIP-712 signing
 */
export function getMandateMessage(mandate: IntentMandate, merchantAddress: Address) {
  return {
    mandateId: mandate.mandateId,
    userAddress: mandate.userAddress as Address,
    merchantAddress: merchantAddress,
    dailyCapMicroUsdc: BigInt(mandate.dailyCapMicroUsdc),
    pricePerMessageMicroUsdc: BigInt(mandate.pricePerMessageMicroUsdc),
    batchThreshold: BigInt(mandate.batchThreshold),
    serviceType: mandate.serviceType,
    modelName: mandate.modelName,
    expiresAt: BigInt(mandate.expiresAt),
  };
}

/**
 * Verify an Intent Mandate signature
 */
export async function verifyMandateSignature(
  mandate: IntentMandate,
  signature: `0x${string}`,
  verifyingContract: Address
): Promise<boolean> {
  try {
    // Get merchant address from mandate for message verification
    const message = getMandateMessage(mandate, mandate.merchantAddress as Address);

    // Compute the struct hash
    const structHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, address, address, uint256, uint256, uint256, bytes32, bytes32, uint256'),
        [
          keccak256(encodePacked(['string'], ['IntentMandate(string mandateId,address userAddress,address merchantAddress,uint256 dailyCapMicroUsdc,uint256 pricePerMessageMicroUsdc,uint256 batchThreshold,string serviceType,string modelName,uint256 expiresAt)'])),
          keccak256(encodePacked(['string'], [message.mandateId])),
          message.userAddress,
          message.merchantAddress,
          message.dailyCapMicroUsdc,
          message.pricePerMessageMicroUsdc,
          message.batchThreshold,
          keccak256(encodePacked(['string'], [message.serviceType])),
          keccak256(encodePacked(['string'], [message.modelName])),
          message.expiresAt,
        ]
      )
    );

    // Compute domain separator (using the verifying contract passed in)
    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
        [
          keccak256(encodePacked(['string'], ['EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'])),
          keccak256(encodePacked(['string'], [INTENT_MANDATE_DOMAIN.name])),
          keccak256(encodePacked(['string'], [INTENT_MANDATE_DOMAIN.version])),
          BigInt(INTENT_MANDATE_DOMAIN.chainId),
          verifyingContract,
        ]
      )
    );

    // Compute final digest
    const digest = keccak256(
      encodePacked(['string', 'bytes32', 'bytes32'], ['\x19\x01', domainSeparator, structHash])
    );

    // Recover signer
    const recoveredAddress = await recoverAddress({
      hash: digest,
      signature,
    });

    return recoveredAddress.toLowerCase() === mandate.userAddress.toLowerCase();
  } catch (error) {
    console.error('Failed to verify mandate signature:', error);
    return false;
  }
}

const EIP3009_TYPEHASH = keccak256(
  encodePacked(
    ['string'],
    ['TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)']
  )
);

/**
 * Create EIP-712 domain separator for a token contract
 */
export function createDomainSeparator(
  tokenAddress: Address,
  tokenName: string,
  tokenVersion: string,
  chainId: number
): `0x${string}` {
  const domainTypeHash = keccak256(
    encodePacked(
      ['string'],
      ['EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)']
    )
  );

  return keccak256(
    encodeAbiParameters(
      parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
      [
        domainTypeHash,
        keccak256(encodePacked(['string'], [tokenName])),
        keccak256(encodePacked(['string'], [tokenVersion])),
        BigInt(chainId),
        tokenAddress,
      ]
    )
  );
}

/**
 * Verify an EIP-3009 signature and recover the signer address
 */
export async function verifyEIP3009Signature(
  from: Address,
  to: Address,
  value: string,
  validAfter: number,
  validBefore: number,
  nonce: `0x${string}`,
  signature: { v: number; r: `0x${string}`; s: `0x${string}` },
  tokenAddress: Address,
  tokenName: string,
  tokenVersion: string,
  chainId: number
): Promise<Address | null> {
  try {
    // Validate signature format
    if (signature.v !== 27 && signature.v !== 28) {
      console.error('Invalid signature v value:', signature.v);
      return null;
    }

    // Create struct hash
    const structHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, address, address, uint256, uint256, uint256, bytes32'),
        [
          EIP3009_TYPEHASH,
          from,
          to,
          BigInt(value),
          BigInt(validAfter),
          BigInt(validBefore),
          nonce,
        ]
      )
    );

    // Create domain separator
    const domainSeparator = createDomainSeparator(tokenAddress, tokenName, tokenVersion, chainId);

    // Create digest
    const digest = keccak256(
      encodePacked(['string', 'bytes32', 'bytes32'], ['\x19\x01', domainSeparator, structHash])
    );

    // Recover signer address
    const fullSignature = `${signature.r}${signature.s.slice(2)}${signature.v.toString(16).padStart(2, '0')}` as `0x${string}`;
    
    const recoveredAddress = await recoverAddress({
      hash: digest,
      signature: fullSignature,
    });

    return recoveredAddress;
  } catch (error) {
    console.error('Failed to verify EIP-3009 signature:', error);
    return null;
  }
}

/**
 * Generate a random nonce for EIP-3009
 */
export function generateNonce(): `0x${string}` {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}
