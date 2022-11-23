/* eslint-disable @typescript-eslint/no-var-requires */

import * as metadata from '../metadata';
import { ContractImports } from '../config';
import TemplateGenerator from './TemplateGenerator';

export class EditionNFTGenerator extends TemplateGenerator {
  static contract({
    imports,
    contractName,
    schema,
    saveAdminResourceToContractAccount,
  }: {
    imports: ContractImports;
    contractName: string;
    schema: metadata.Schema;
    saveAdminResourceToContractAccount?: boolean;
  }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/EditionNFT.template.cdc'), {
      imports,
      contractName,
      fields: schema.fields,
      views: schema.views,
      saveAdminResourceToContractAccount: saveAdminResourceToContractAccount ?? false,
    });
  }

  static deployToExistingAccount({ imports }: { imports: ContractImports }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/transactions/deploy_existing_account.cdc'), {
      imports,
    });
  }

  static deployToNewAccount({ imports }: { imports: ContractImports }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/transactions/deploy_new_account.cdc'), { imports });
  }

  static createEditions({
    imports,
    contractName,
    contractAddress,
    schema,
  }: {
    imports: ContractImports;
    contractName: string;
    contractAddress: string;
    schema: metadata.Schema;
  }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/transactions/create_editions.template.cdc'), {
      imports,
      contractName,
      contractAddress,
      fields: schema.fields,
    });
  }

  static mint({
    imports,
    contractName,
    contractAddress,
  }: {
    imports: ContractImports;
    contractName: string;
    contractAddress: string;
  }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/transactions/mint.template.cdc'), {
      imports,
      contractName,
      contractAddress,
    });
  }

  static mintWithClaimKey({
    imports,
    contractName,
    contractAddress,
  }: {
    imports: ContractImports;
    contractName: string;
    contractAddress: string;
  }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/transactions/mint_with_claim_key.template.cdc'), {
      imports,
      contractName,
      contractAddress,
    });
  }

  static getEdition({ contractName, contractAddress }: { contractName: string; contractAddress: string }): string {
    return this.generate(require('../../../cadence/nfts/edition-nft/scripts/get_edition.template.cdc'), {
      contractName,
      contractAddress,
    });
  }

  static getEditionsByMintId({
    contractName,
    contractAddress,
  }: {
    contractName: string;
    contractAddress: string;
  }): string {
    return this.generate(
      require('../../../cadence/nfts/edition-nft/scripts/get_editions_by_mint_id.template.cdc'),
      {
        contractName,
        contractAddress,
      },
    );
  }
}
