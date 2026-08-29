package com.offlinebilling.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;

public class LicenseVerifierTest {
    @Test
    public void verifiesValidLifetimeLicense() throws Exception {
        KeyPair developer = generateEd25519KeyPair();
        KeyPair device = generateP256KeyPair();

        String devicePublicKey = java.util.Base64.getEncoder().encodeToString(device.getPublic().getEncoded());
        String payloadJson = "{\"licenseId\":\"L-1001\",\"shopName\":\"Devwerx Demo\",\"devicePublicKey\":\"" + devicePublicKey + "\",\"deviceFingerprint\":\"" + sha256Hex(device.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}";

        String payloadPart = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = "DEVWERX-LICENSE-V1." + payloadPart;
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(developer.getPrivate());
        signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
        String signature = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());

        LicenseVerifier.LicenseVerificationResult result = LicenseVerifier.verifyLicense(signingInput + "." + signature, devicePublicKey, developer.getPublic());

        assertNotNull(result);
        assertEquals("Activated", result.getStatus());
    }

    @Test
    public void rejectsWrongDeviceLicense() throws Exception {
        KeyPair developer = generateEd25519KeyPair();
        KeyPair device = generateP256KeyPair();
        KeyPair otherDevice = generateP256KeyPair();

        String devicePublicKey = java.util.Base64.getEncoder().encodeToString(device.getPublic().getEncoded());
        String otherDevicePublicKey = java.util.Base64.getEncoder().encodeToString(otherDevice.getPublic().getEncoded());
        String payloadJson = "{\"licenseId\":\"L-1002\",\"shopName\":\"Wrong Device\",\"devicePublicKey\":\"" + otherDevicePublicKey + "\",\"deviceFingerprint\":\"" + sha256Hex(otherDevice.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}";

        String payloadPart = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = "DEVWERX-LICENSE-V1." + payloadPart;
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(developer.getPrivate());
        signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
        String signature = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());

        LicenseVerifier.LicenseVerificationResult result = LicenseVerifier.verifyLicense(signingInput + "." + signature, devicePublicKey, developer.getPublic());

        assertEquals("License belongs to another device", result.getStatus());
    }

    private static KeyPair generateEd25519KeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("Ed25519");
        return generator.generateKeyPair();
    }

    private static KeyPair generateP256KeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    private static String sha256Hex(byte[] bytes) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder out = new StringBuilder(digest.length * 2);
        for (byte value : digest) {
            out.append(String.format("%02x", value & 0xFF));
        }
        return out.toString();
    }
}
