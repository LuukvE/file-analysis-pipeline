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

export function generate() {
  const curve = createECDH(getCurve());

  curve.generateKeys();

  const publicKey = curve.getPublicKey('hex', 'uncompressed');
  const privateKey = curve.getPrivateKey('hex');

  return { publicKey, privateKey };
}

export function derive(privateKey: string, publicKey: string): Buffer {
  const curve = createECDH(getCurve());

  curve.setPrivateKey(privateKey, 'hex');

  const secret = curve.computeSecret(publicKey, 'hex');

  return createHash('sha256').update(secret).digest();
}

export function encrypt(publicKey: string, text: string): string {
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

export function decrypt(privateKey: string, payload: string): string {
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

export function sign(privateKey: string, publicKey: string, message: string): string {
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

export function verify(publicKey: string, message: string, signature: string): boolean {
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

function getCurve() {
  const curves = getCurves();

  return ['secp256r1', 'prime256v1', 'P-256'].find((c) => curves.includes(c))!;
}

function toBase64Url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
