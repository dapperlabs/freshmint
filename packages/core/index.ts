export { version } from './version';

export * as FreshmintConfig from './config';
export type { ContractImports } from './config';

export { FreshmintClient } from './client';

export { Transaction, TransactionAuthorizer } from './transactions';
export type { TransactionResult, TransactionEvent } from './transactions';

export { prepareRoyalties, prepareCollectionMetadata } from './contracts/NFTContract';
export type { Royalty, CollectionMetadata } from './contracts/NFTContract';

export { StandardNFTContract } from './contracts/StandardNFTContract';
export { BlindNFTContract } from './contracts/BlindNFTContract';
export { EditionNFTContract } from './contracts/EditionNFTContract';
export { BlindEditionNFTContract } from './contracts/BlindEditionNFTContract';

export { StandardNFTGenerator } from './generators/StandardNFTGenerator';
export { BlindNFTGenerator } from './generators/BlindNFTGenerator';
export { EditionNFTGenerator } from './generators/EditionNFTGenerator';
export { BlindEditionNFTGenerator } from './generators/BlindEditionNFTGenerator';

import { FreshmintClaimSaleContract } from './contracts/FreshmintClaimSaleContract';
import { FreshmintClaimSaleGenerator } from './generators/FreshmintClaimSaleGenerator';

export { FreshmintClaimSaleContract };
export { FreshmintClaimSaleGenerator };

// TODO: deprecate ClaimSaleContract, ClaimSaleGenerator. These are legacy export names
// that are now aliases for FreshmintClaimSaleContract, FreshmintClaimSaleGenerator.
export { FreshmintClaimSaleContract as ClaimSaleContract };
export { FreshmintClaimSaleGenerator as ClaimSaleGenerator };

export { FreshmintClaimSaleV2Contract } from './contracts/FreshmintClaimSaleV2Contract';
export { FreshmintClaimSaleV2Generator } from './generators/FreshmintClaimSaleV2Generator';

export { LockBoxGenerator } from './generators/LockBoxGenerator';
export { CommonNFTGenerator } from './generators/CommonNFTGenerator';
export { FreshmintMetadataViewsGenerator } from './generators/FreshmintMetadataViewsGenerator';
export { FreshmintQueueGenerator } from './generators/FreshmintQueueGenerator';

export * as metadata from './metadata/index';
