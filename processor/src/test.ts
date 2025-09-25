import {
  getCurves,
  createECDH,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  createSign,
  createVerify,
  createPrivateKey,
  createPublicKey
} from 'crypto';

const { publicKey, privateKey } = generate();
const message = 'This is a secret message.';
const encrypted = encrypt(publicKey, message);
const decrypted = decrypt(privateKey, encrypted);
const signedMessage = JSON.stringify({
  status: 'COMPLETED',
  version: '2.5.21',
  created: '2025-09-25T11:21:51.690Z',
  bucket: 'file-processing-wrapper-production',
  file: 'file-1a026c06-e99c-4f2f-842c-cb01c51849af',
  chunks: 20,
  client:
    'client-049aff50ff4d086b98c77aee0fffba31fd5ff1456db3ab173b515476b39daac602f61a8e69b9adab188f63dd93b89e8a33dc2e761e8c089a0c29cc86f0ae6769db' // secp256r1 public key
});
const signature = sign(privateKey, publicKey, signedMessage);
const isVerified = verify(publicKey, signedMessage, signature);

console.log('PublicKey:', publicKey);
console.log('PrivateKey:', privateKey);
console.log('Original:', message);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
console.log('Success:', message === decrypted);
console.log('Message to sign:', signedMessage);
console.log('Signature:', signature);
console.log('Signature Verified:', isVerified);

function getCurve() {
  const curves = getCurves();

  return ['prime256v1', 'secp256r1', 'P-256'].find((c) => curves.includes(c));
}

function generate() {
  const curve = createECDH(getCurve());

  curve.generateKeys();

  const publicKey = curve.getPublicKey('hex', 'uncompressed');
  const privateKey = curve.getPrivateKey('hex');

  return { publicKey, privateKey };
}

function derive(privateKey: string, publicKey: string): Buffer {
  const curve = createECDH(getCurve());

  curve.setPrivateKey(privateKey, 'hex');

  const secret = curve.computeSecret(publicKey, 'hex');

  return createHash('sha256').update(secret).digest();
}

function encrypt(publicKey: string, text: string): string {
  const tmp = createECDH(getCurve());

  tmp.generateKeys();

  const tmpPublic = tmp.getPublicKey('hex', 'uncompressed');
  const tmpPrivate = tmp.getPrivateKey('hex');
  const secret = derive(tmpPrivate, publicKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${tmpPublic}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(privateKey: string, payload: string): string {
  const [tmpPublic, iv, tag, encrypted] = payload.split(':');
  const secret = derive(privateKey, tmpPublic);
  const ivBuffer = Buffer.from(iv, 'hex');
  const tagBuffer = Buffer.from(tag, 'hex');
  const encryptedBuffer = Buffer.from(encrypted, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', secret, ivBuffer);

  decipher.setAuthTag(tagBuffer);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

  return decrypted.toString('utf8');
}

function toBase64Url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sign(privateKey: string, publicKey: string, message: string): string {
  const x = publicKey.substring(2, 66);
  const y = publicKey.substring(66, 130);

  const privateKeyObject = createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: toBase64Url(Buffer.from(x, 'hex')),
      y: toBase64Url(Buffer.from(y, 'hex')),
      d: toBase64Url(Buffer.from(privateKey, 'hex'))
    },
    format: 'jwk'
  });

  const signer = createSign('sha256');

  signer.update(message);
  signer.end();

  const signature = signer.sign(privateKeyObject, 'hex');

  return signature;
}

function verify(publicKey: string, message: string, signature: string): boolean {
  const x = publicKey.substring(2, 66);
  const y = publicKey.substring(66, 130);
  const obj = createPublicKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: toBase64Url(Buffer.from(x, 'hex')),
      y: toBase64Url(Buffer.from(y, 'hex'))
    },
    format: 'jwk'
  });

  const verifier = createVerify('sha256');

  verifier.update(message);
  verifier.end();

  return verifier.verify(obj, signature, 'hex');
}
