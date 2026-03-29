"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kmsSign = kmsSign;
exports.kmsVerify = kmsVerify;
exports.kmsGetPublicKey = kmsGetPublicKey;
const config_1 = require("../config");
const client_kms_1 = require("@aws-sdk/client-kms");
/**
 * AWS KMS wrapper for signing and verification.
 * Used in production when KMS_KEY_ID is set.
 */
async function kmsSign(message) {
    const { Signature } = await config_1.kmsClient.send(new client_kms_1.SignCommand({
        KeyId: config_1.config.kms.keyId,
        Message: Buffer.from(message),
        MessageType: 'RAW',
        SigningAlgorithm: config_1.config.kms.keyAlgorithm,
    }));
    return Buffer.from(Signature).toString('base64url');
}
async function kmsVerify(message, signature) {
    try {
        const { SignatureValid } = await config_1.kmsClient.send(new client_kms_1.VerifyCommand({
            KeyId: config_1.config.kms.keyId,
            Message: Buffer.from(message),
            MessageType: 'RAW',
            Signature: Buffer.from(signature, 'base64url'),
            SigningAlgorithm: config_1.config.kms.keyAlgorithm,
        }));
        return !!SignatureValid;
    }
    catch {
        return false;
    }
}
async function kmsGetPublicKey() {
    const { PublicKey } = await config_1.kmsClient.send(new client_kms_1.GetPublicKeyCommand({
        KeyId: config_1.config.kms.keyId,
    }));
    return Buffer.from(PublicKey).toString('base64');
}
