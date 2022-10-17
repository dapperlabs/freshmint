/* eslint-disable @typescript-eslint/no-var-requires */

import { registerHelper, registerPartial } from '../generators';
import { Field, FieldMap, HTTPFile, IPFSFile, UInt64 } from './fields';

export class View {
  type: ViewType<any>;
  options: any;

  id: string;
  cadenceResolverFunction?: string;
  cadenceTypeString: string;
  requiresMetadata: boolean;

  constructor(type: ViewType<any>, options: any) {
    this.type = type;
    this.options = options;

    this.id = type.id;
    this.cadenceResolverFunction = type.cadenceResolverFunction;
    this.cadenceTypeString = type.cadenceTypeString;
    this.requiresMetadata = type.requiresMetadata;
  }

  export(): ViewInput {
    return {
      type: this.type.id,
      options: this.exportOptions(),
    };
  }

  private exportOptions(): ViewOptionsInput {
    const exportedOptions: { [key: string]: any } = {};

    for (const key in this.options) {
      const option = this.options[key];

      if (option instanceof Field) {
        exportedOptions[key] = option.name;
      } else {
        exportedOptions[key] = option;
      }
    }

    return exportedOptions;
  }
}

export interface ViewType<ViewOptions> {
  (options: ViewOptions): View;
  id: string;
  cadenceTypeString: string;
  cadenceResolverFunction?: string;
  cadenceTemplate: string;
  requiresMetadata: boolean;
}

const httpFilePartial = 'http-file';
const ipfsFilePartial = 'ipfs-file';

registerHelper('whichFilePartial', (field) => {
  switch (field.type) {
    case HTTPFile:
      return httpFilePartial;
    case IPFSFile:
      return ipfsFilePartial;
  }

  // TODO: improve error message
  throw 'field must be a file field';
});

registerPartial('viewCase', require('../../../cadence/nfts/metadata-views/viewCase.partial.cdc'));
registerPartial(httpFilePartial, require('../../../cadence/nfts/metadata-views/MetadataViews.HTTPFile.partial.cdc'));
registerPartial(ipfsFilePartial, require('../../../cadence/nfts/metadata-views/MetadataViews.IPFSFile.partial.cdc'));

export const viewsTypes: ViewType<any>[] = [];

export function defineView<ViewOptions>({
  id,
  cadenceTypeString,
  cadenceResolverFunction,
  cadenceTemplate,
  requiresMetadata,
  parseOptions,
}: {
  id: string;
  cadenceTypeString: string;
  cadenceResolverFunction?: string;
  cadenceTemplate: string;
  requiresMetadata: boolean;
  parseOptions?: (options: ViewOptions) => ViewOptions;
}): ViewType<ViewOptions> {
  const viewType = (options: ViewOptions): View => {
    if (parseOptions) {
      options = parseOptions(options);
    }

    return new View(viewType, options);
  };

  viewType.id = id;
  viewType.cadenceTypeString = cadenceTypeString;
  viewType.cadenceResolverFunction = cadenceResolverFunction;
  viewType.cadenceTemplate = cadenceTemplate;
  viewType.requiresMetadata = requiresMetadata;

  registerPartial(id, cadenceTemplate);

  // Add this view to the view type list
  viewsTypes.push(viewType);

  return viewType;
}

export const DisplayView = defineView<{
  name: Field;
  description: Field;
  thumbnail: Field;
}>({
  id: 'display',
  cadenceTypeString: 'Type<MetadataViews.Display>()',
  cadenceResolverFunction: 'resolveDisplay',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.Display.partial.cdc'),
  requiresMetadata: true,
});

export const ExternalURLView = defineView<{ cadenceTemplate: string } | string>({
  id: 'external-url',
  cadenceTypeString: 'Type<MetadataViews.ExternalURL>()',
  cadenceResolverFunction: 'resolveExternalURL',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.ExternalURL.partial.cdc'),
  requiresMetadata: false,
  parseOptions: (options) => {
    if (typeof options === 'string') {
      return prepareExternalURL(options);
    }

    return options;
  },
});

const collectionUrl = '${collection.url}';
const nftOwner = '${nft.owner}';
const nftId = '${nft.id}';

// prepareExternalURL converts a raw URL template to a valid Cadence expression.
//
// The raw template can access the following variables:
// - ${collection.url}: the URL of the NFT collection (e.g. "https://cryptokitties.co").
// - ${nft.owner}: the address of the NFT owner (e.g. "0xf8d6e0586b0a20c7").
// - ${nft.id}: the ID of the NFT (e.g. "42").
//
// Examples:
// - "${collection.url}/nfts/${nft.owner}/${nft.id}" => collectionURL.concat("/nfts/").concat(nftOwner).concat("/").concat(nftID)
// - "https://foo.com/nfts/${nft.id}" => "https://foo.com/nfts/".concat(nftID)
//
function prepareExternalURL(rawTemplate: string): {
  cadenceTemplate: string;
  includesCollectionUrl: boolean;
  includesNftOwner: boolean;
  includesNftId: boolean;
} {
  const regexp = RegExp(/\${[a-zA-Z0-9_.]+}/, 'g');

  const pieces = [];

  let match;

  let startIndex = 0;

  while ((match = regexp.exec(rawTemplate)) !== null) {
    const matchStart = match.index;
    const matchEnd = regexp.lastIndex;

    pieces.push(rawTemplate.slice(startIndex, matchStart));
    pieces.push(rawTemplate.slice(matchStart, matchEnd));

    startIndex = matchEnd;
  }

  pieces.push(rawTemplate.slice(startIndex));

  const cadenceTemplate = pieces
    .filter((piece) => piece !== '')
    .map((piece, index) =>
      index === 0 ? prepareExternalURLPiece(piece) : `.concat(${prepareExternalURLPiece(piece)})`,
    )
    .join('');

  return {
    cadenceTemplate,
    includesCollectionUrl: pieces.includes(collectionUrl),
    includesNftOwner: pieces.includes(nftOwner),
    includesNftId: pieces.includes(nftId),
  };
}

function prepareExternalURLPiece(value: string) {
  switch (value) {
    case collectionUrl:
      return 'collectionURL';
    case nftOwner:
      return 'nftOwner';
    case nftId:
      return 'nftID';
  }

  return `"${value}"`;
}

export type LegacyIPFSMediaInput = {
  ipfsCid: string;
  type: string;
};

export type IPFSMediaInput = {
  ipfs: string | { cid: string; path?: string };
  type: string;
};

export type HTTPMediaInput = {
  url: string;
  type: string;
};

export type MediaInput = LegacyIPFSMediaInput | IPFSMediaInput | HTTPMediaInput;

function isLegacyIPFSMediaInput(media: MediaInput): media is LegacyIPFSMediaInput {
  return (media as LegacyIPFSMediaInput).ipfsCid !== undefined;
}

function isIPFSMediaInput(media: MediaInput): media is IPFSMediaInput {
  return (media as IPFSMediaInput).ipfs !== undefined;
}

function isHTTPMediaInput(media: MediaInput): media is HTTPMediaInput {
  return (media as HTTPMediaInput).url !== undefined;
}

export const NFTCollectionDisplayView = defineView<{
  name: string;
  description: string;
  url: string;
  media: MediaInput;
}>({
  id: 'nft-collection-display',
  cadenceTypeString: 'Type<MetadataViews.NFTCollectionDisplay>()',
  cadenceResolverFunction: 'resolveNFTCollectionDisplay',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.NFTCollectionDisplay.partial.cdc'),
  requiresMetadata: false,
  parseOptions: (options) => {
    // Convert the legacy IPFS format to the new generic file format.
    //
    // TODO: deprecate the ipfsCid field.
    if (isLegacyIPFSMediaInput(options.media)) {
      options.media = {
        ipfs: {
          cid: options.media.ipfsCid,
        },
        type: options.media.type,
      };
    }

    if (isIPFSMediaInput(options.media) && isHTTPMediaInput(options.media)) {
      throw new Error('You must specify either an IPFS or HTTP media file to nft-collection-display, but not both.');
    }

    // If IPFS is passed as string, assume it is a CID.
    if (isIPFSMediaInput(options.media)) {
      if (typeof options.media.ipfs === 'string') {
        options.media.ipfs = {
          cid: options.media.ipfs,
        };
      }
    }

    return options;
  },
});

export const NFTCollectionDataView = defineView<void>({
  id: 'nft-collection-data',
  cadenceTypeString: 'Type<MetadataViews.NFTCollectionData>()',
  cadenceResolverFunction: 'resolveNFTCollectionData',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.NFTCollectionData.partial.cdc'),
  requiresMetadata: false,
});

export const NFTView = defineView<void>({
  id: 'nft',
  cadenceTypeString: 'Type<MetadataViews.NFTView>()',
  cadenceResolverFunction: 'resolveNFTView',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.NFTView.partial.cdc'),
  requiresMetadata: true,
});

export const RoyaltiesView = defineView<void>({
  id: 'royalties',
  cadenceTypeString: 'Type<MetadataViews.Royalties>()',
  cadenceResolverFunction: 'resolveRoyalties',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.Royalties.partial.cdc'),
  requiresMetadata: false,
});

export const MediaView = defineView<{
  file: Field;
  mediaType: string;
}>({
  id: 'media',
  cadenceTypeString: 'Type<MetadataViews.Media>()',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.Media.partial.cdc'),
  requiresMetadata: true,
});

export const SerialView = defineView<{ serialNumber: Field }>({
  id: 'serial',
  cadenceTypeString: 'Type<MetadataViews.Serial>()',
  cadenceResolverFunction: 'resolveSerial',
  cadenceTemplate: require('../../../cadence/nfts/metadata-views/MetadataViews.Serial.partial.cdc'),
  requiresMetadata: true,
  parseOptions: (options) => {
    if (options.serialNumber.type !== UInt64) {
      throw new Error(
        `The serialNumber field passed to SerialView must have type ${UInt64.cadenceType.label}. You passed the '${options.serialNumber.name}' field which has type ${options.serialNumber.type.cadenceType.label}.`,
      );
    }

    return options;
  },
});

const viewsTypesById: { [key: string]: ViewType<any> } = viewsTypes.reduce(
  (views, view) => ({ [view.id]: view, ...views }),
  {},
);

function getViewTypeById(id: string): ViewType<any> {
  return viewsTypesById[id];
}

export type ViewInput = { type: string; options: any };
export type ViewOptionsInput = { [key: string]: string };

export function parseViews(views: ViewInput[], fieldMap: FieldMap): View[] {
  return views.map((view: ViewInput) => {
    const viewType = getViewTypeById(view.type);

    // TODO: improve this field mapping logic.
    //
    // Currently it replaces any string that matches a field name.
    // Should it be smarter?
    const options = view.options;

    for (const name in view.options) {
      const fieldName = view.options[name];
      const field = fieldMap[fieldName];

      if (field) {
        options[name] = field;
      }
    }

    return viewType(options);
  });
}
