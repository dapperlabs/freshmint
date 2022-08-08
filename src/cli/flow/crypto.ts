import * as elliptic from 'elliptic';
import { SHA3 } from 'sha3';
import { createHash } from 'crypto';

const ECDSA_P256 = new elliptic.ec('p256');
const ECDSA_secp256k1 = new elliptic.ec('secp256k1');

const bufferEndianness = 'be';

export const signatureAlgorithms = {
  ECDSA_P256: 'ECDSA_P256',
  ECDSA_secp256k1: 'ECDSA_secp256k1',
};

function getEC(sigAlgo: string) {
  switch (sigAlgo) {
    case signatureAlgorithms.ECDSA_P256:
      return ECDSA_P256;
    case signatureAlgorithms.ECDSA_secp256k1:
      return ECDSA_secp256k1;
  }

  throw 'invalid signature algorithm';
}

export class ECPrivateKey {
  ecKeyPair: any;
  sigAlgo: any;

  constructor(ecKeyPair: any, sigAlgo: any) {
    this.ecKeyPair = ecKeyPair;
    this.sigAlgo = sigAlgo;
  }

  static generate(sigAlgo: string) {
    const ec = getEC(sigAlgo);
    const ecKeyPair = ec.genKeyPair();
    return new ECPrivateKey(ecKeyPair, sigAlgo);
  }

  static fromBuffer(buffer: Buffer, sigAlgo: string) {
    const ec = getEC(sigAlgo);
    const ecKeyPair = ec.keyFromPrivate(buffer);
    return new ECPrivateKey(ecKeyPair, sigAlgo);
  }

  static fromHex(hex: string, sigAlgo: string) {
    const buffer = Buffer.from(hex, 'hex');
    return ECPrivateKey.fromBuffer(buffer, sigAlgo);
  }

  sign(digest: string) {
    const ecSignature = this.ecKeyPair.sign(digest);
    return new ECSignature(ecSignature);
  }

  getPublicKey() {
    const ecPublicKey = this.ecKeyPair.getPublic();
    return new ECPublicKey(ecPublicKey);
  }

  getSignatureAlgorithm() {
    return this.sigAlgo;
  }

  toBuffer() {
    return this.ecKeyPair.getPrivate().toArrayLike(Buffer, bufferEndianness);
  }

  toHex() {
    return this.toBuffer().toString('hex');
  }
}

export class ECPublicKey {
  ecPublicKey: any;

  constructor(ecPublicKey: string) {
    this.ecPublicKey = ecPublicKey;
  }

  toBuffer() {
    const x = this.ecPublicKey.getX().toArrayLike(Buffer, bufferEndianness, ECPublicKey.size);
    const y = this.ecPublicKey.getY().toArrayLike(Buffer, bufferEndianness, ECPublicKey.size);

    return Buffer.concat([x, y]);
  }

  toHex() {
    return this.toBuffer().toString('hex');
  }
}

export class ECSignature {
  static n = 32;
  ecSignature: any;

  constructor(ecSignature: any) {
    this.ecSignature = ecSignature;
  }

  toBuffer() {
    const r = this.ecSignature.r.toArrayLike(Buffer, bufferEndianness, ECSignature.n);
    const s = this.ecSignature.s.toArrayLike(Buffer, bufferEndianness, ECSignature.n);

    return Buffer.concat([r, s]);
  }

  toHex() {
    return this.toBuffer().toString('hex');
  }
}

export class ECSigner {
  privateKey: any;
  hasher: SHA2_256Hasher | SHA3_256Hasher;

  constructor(privateKey: any, hashAlgo: string) {
    this.privateKey = privateKey;
    this.hasher = getHasher(hashAlgo);
  }

  sign(message: Buffer) {
    const digest = this.hasher.hash(message);
    return this.privateKey.sign(digest);
  }
}

export const hashAlgorithms = {
  SHA2_256: 'SHA2_256',
  SHA3_256: 'SHA3_256',
};

class SHA2_256Hasher {
  static shaType = 'sha256';
  sha: any;

  constructor() {
    this.sha = createHash(SHA2_256Hasher.shaType);
  }

  hash(message: Buffer) {
    this.sha.update(message);
    return this.sha.digest();
  }
}

class SHA3_256Hasher {
  static size: 256;
  sha: any;

  constructor() {
    this.sha = new SHA3(SHA3_256Hasher.size);
  }

  hash(message: Buffer) {
    this.sha.update(message);
    return this.sha.digest();
  }
}

function getHasher(hashAlgo: string) {
  switch (hashAlgo) {
    case hashAlgorithms.SHA2_256:
      return new SHA2_256Hasher();
    case hashAlgorithms.SHA3_256:
      return new SHA3_256Hasher();
  }

  throw 'invalid hash algorithm';
}
