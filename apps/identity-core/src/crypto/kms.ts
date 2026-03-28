import { kmsClient, config } from '../config'
import { SignCommand, VerifyCommand, GetPublicKeyCommand } from '@aws-sdk/client-kms'

/**
 * AWS KMS wrapper for signing and verification.
 * Used in production when KMS_KEY_ID is set.
 */

export async function kmsSign(message: string): Promise<string> {
  const { Signature } = await kmsClient.send(new SignCommand({
    KeyId: config.kms.keyId,
    Message: Buffer.from(message),
    MessageType: 'RAW',
    SigningAlgorithm: config.kms.keyAlgorithm,
  }))
  return Buffer.from(Signature!).toString('base64url')
}

export async function kmsVerify(message: string, signature: string): Promise<boolean> {
  try {
    const { SignatureValid } = await kmsClient.send(new VerifyCommand({
      KeyId: config.kms.keyId,
      Message: Buffer.from(message),
      MessageType: 'RAW',
      Signature: Buffer.from(signature, 'base64url'),
      SigningAlgorithm: config.kms.keyAlgorithm,
    }))
    return !!SignatureValid
  } catch {
    return false
  }
}

export async function kmsGetPublicKey(): Promise<string> {
  const { PublicKey } = await kmsClient.send(new GetPublicKeyCommand({
    KeyId: config.kms.keyId,
  }))
  return Buffer.from(PublicKey!).toString('base64')
}
