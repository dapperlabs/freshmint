import { ECPublicKey, InMemoryECPrivateKey, InMemoryECSigner } from './elliptic';
import { getHasher, HashAlgorithm, SHA2_256Hasher } from './hash';
import { SignatureAlgorithm } from './sign';

const SIGNATURE_ALGORITHMS = [SignatureAlgorithm.ECDSA_P256, SignatureAlgorithm.ECDSA_secp256k1];

const HASH_ALGORITHMS = [HashAlgorithm.SHA2_256, HashAlgorithm.SHA3_256];

const ALGORITHM_PAIRS = SIGNATURE_ALGORITHMS.flatMap((sigAlgo) =>
  HASH_ALGORITHMS.flatMap((hashAlgo) => ({ sigAlgo, hashAlgo })),
);

const VALID_PRIVATE_KEYS = {
  [SignatureAlgorithm.ECDSA_P256]: 'dade27ead6aab5515b7fddc4e245a586cc6401a5af1f786f35b7c8dd31e4aa3a',
  [SignatureAlgorithm.ECDSA_secp256k1]: 'f62c1add91f37b596fd6f5a263e2a646256d826b0bd50a609679feaa93e6c31a',
};

const VALID_PUBLIC_KEYS = {
  [SignatureAlgorithm.ECDSA_P256]:
    '861763f868d98003fbab48a12320351b6c019ded523ccdfece8203aaa4fdeb4bbdbc5e6fe292971a3854a16df93b4f68178ae8a31de1bca68c14e3dd8506f439',
  [SignatureAlgorithm.ECDSA_secp256k1]:
    'b761dd7ebfd8c1034b20ad07a9c35966a0d668fe82891e26f30ce46e4e969c2a55dec2325a2b4dfe5147ddf0eee17e47c42ab2defafe83e7d223a061bab555e0',
};

const MESSAGE = 'deadbeef';

// Signatures generated by signing "deadbeef" with SHA2_256
const VALID_SHA2_SIGNATURES = {
  [SignatureAlgorithm.ECDSA_P256]:
    'af9e02bfe6273032868e0ec8718180b6c39a009efafaf59fcb3b0dfad82d1db08c252ed2499630ecce082bf3415268dc8081fea39d55757ad581d67341d83e62',
  [SignatureAlgorithm.ECDSA_secp256k1]:
    '100ce91c9475ae3549d02594fb8f6362922d165ccf28fd34638453c636420cebc06e972b6da2333413bc5720f4a571b417e45b64954fe8ba6495350faaee2570',
};

// Signatures generated by signing "deadbeef" with SHA3_256
const VALID_SHA3_SIGNATURES = {
  [SignatureAlgorithm.ECDSA_P256]:
    'fbabde2464d64bcc0b9f225493dcac092aabec762d1cda46269c22dd20704cdb5c21601e4d78ba67135975b0ac59436fd12a2712fcb9638dee1048b8e65aaf56',
  [SignatureAlgorithm.ECDSA_secp256k1]:
    'b33a5509d695cf77b932b96829aa4fa691b7d38ed2ac5fafd2f0de64b385a6ae4c3328a2ee488fc3af07e9858cec3c8f6eef21f650dc77324029cac8a50d10bb',
};

describe.each(SIGNATURE_ALGORITHMS)('ECPublicKey (%s)', (sigAlgo) => {
  describe('fromBuffer/toBuffer', () => {
    it('should fail for an empty buffer', () => {
      const publicKeyBuffer = Buffer.from([]);

      expect(() => {
        ECPublicKey.fromBuffer(publicKeyBuffer, sigAlgo);
      }).toThrowError();
    });

    it('should succeed for a valid buffer', () => {
      const publicKeyHex = VALID_PUBLIC_KEYS[sigAlgo];
      const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

      const publicKey = ECPublicKey.fromBuffer(publicKeyBuffer, sigAlgo);

      expect(publicKey.toBuffer()).toEqual(publicKeyBuffer);
    });
  });

  describe('fromHex/toHex', () => {
    it('should fail for an empty hex string', () => {
      expect(() => {
        ECPublicKey.fromHex('', sigAlgo);
      }).toThrowError();
    });

    it('should succeed for a valid hex string', () => {
      const publicKeyHex = VALID_PUBLIC_KEYS[sigAlgo];

      const publicKey = ECPublicKey.fromHex(publicKeyHex, sigAlgo);

      expect(publicKey.toHex()).toEqual(publicKeyHex);
    });
  });

  describe('verify', () => {
    const publicKeyHex = VALID_PUBLIC_KEYS[sigAlgo];
    const publicKey = ECPublicKey.fromHex(publicKeyHex, sigAlgo);

    const emptyBuffer = Buffer.from([]);

    const hasher = new SHA2_256Hasher();
    const message = Buffer.from(MESSAGE, 'hex');
    const digest = hasher.hash(message);

    it('should reject an empty digest', () => {
      const signatureHex = VALID_SHA3_SIGNATURES[sigAlgo];
      const signature = Buffer.from(signatureHex, 'hex');

      expect(publicKey.verify(emptyBuffer, signature)).toBe(false);
    });

    it('should reject an empty signature', () => {
      expect(publicKey.verify(digest, emptyBuffer)).toBe(false);
    });

    it('should reject an empty digest and signature', () => {
      expect(publicKey.verify(emptyBuffer, emptyBuffer)).toBe(false);
    });

    it('should reject an invalid signature', () => {
      const signatureHex = VALID_SHA3_SIGNATURES[sigAlgo];
      const signature = Buffer.from(signatureHex, 'hex');

      expect(publicKey.verify(digest, signature)).toBe(false);
    });

    it('should accept a valid signature', () => {
      const signatureHex = VALID_SHA2_SIGNATURES[sigAlgo];
      const signature = Buffer.from(signatureHex, 'hex');

      expect(publicKey.verify(digest, signature)).toBe(true);
    });
  });
});

describe.each(SIGNATURE_ALGORITHMS)('InMemoryECPrivateKey (%s)', (sigAlgo) => {
  describe('fromBuffer/toBuffer', () => {
    it('should succeed for a valid buffer', () => {
      const privateKeyHex = VALID_PRIVATE_KEYS[sigAlgo];
      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');

      const privateKey = InMemoryECPrivateKey.fromBuffer(privateKeyBuffer, sigAlgo);

      expect(privateKey.toBuffer()).toEqual(privateKeyBuffer);
    });
  });

  describe('fromHex/toHex', () => {
    it('should succeed for a valid hex string', () => {
      const privateKeyHex = VALID_PRIVATE_KEYS[sigAlgo];

      const privateKey = InMemoryECPrivateKey.fromHex(privateKeyHex, sigAlgo);

      expect(privateKey.toHex()).toEqual(privateKeyHex);
    });
  });

  describe('getPublicKey', () => {
    it('should return a valid public key', () => {
      const privateKeyHex = VALID_PRIVATE_KEYS[sigAlgo];
      const publicKeyHex = VALID_PUBLIC_KEYS[sigAlgo];

      const privateKey = InMemoryECPrivateKey.fromHex(privateKeyHex, sigAlgo);
      const publicKey = privateKey.getPublicKey();

      expect(publicKey.toHex()).toEqual(publicKeyHex);
    });
  });

  describe('getSignatureAlgorithm', () => {
    it('should return the correct signature algorithm', () => {
      const privateKeyHex = VALID_PRIVATE_KEYS[sigAlgo];
      const privateKey = InMemoryECPrivateKey.fromHex(privateKeyHex, sigAlgo);

      expect(privateKey.getSignatureAlgorithm()).toEqual(sigAlgo);
    });
  });
});

describe.each(ALGORITHM_PAIRS)('InMemoryECSigner ($sigAlgo, $hashAlgo)', ({ sigAlgo, hashAlgo }) => {
  describe('sign', () => {
    const privateKeyHex = VALID_PRIVATE_KEYS[sigAlgo];

    const privateKey = InMemoryECPrivateKey.fromHex(privateKeyHex, sigAlgo);
    const publicKey = privateKey.getPublicKey();
    const hasher = getHasher(hashAlgo);

    const signer = new InMemoryECSigner(privateKey, hashAlgo);

    it('should succeed with an empty buffer', () => {
      const message = Buffer.from([]);
      const digest = hasher.hash(message);
      const signature = signer.sign(message);

      expect(publicKey.verify(digest, signature)).toBe(true);
    });

    it('should succeed with a non-empty buffer', () => {
      const message = Buffer.from(MESSAGE, 'hex');
      const digest = hasher.hash(message);
      const signature = signer.sign(message);

      expect(publicKey.verify(digest, signature)).toBe(true);
    });
  });
});