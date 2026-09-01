package com.offlinebilling.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

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
        String devicePublicKey = encodePublicKey(device);

        String license = signedLicense(
                developer,
                "{\"licenseId\":\"L-1001\",\"shopName\":\"Devwerx Demo\",\"devicePublicKey\":\"" + devicePublicKey + "\",\"deviceFingerprint\":\"" + sha256Hex(device.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}"
        );

        LicenseVerifier.LicenseVerificationResult result = LicenseVerifier.verifyLicense(license, devicePublicKey, developer.getPublic());

        assertNotNull(result);
        assertTrue(result.isValid());
        assertEquals("Activated", result.getStatus());
        assertEquals("L-1001", result.getLicenseId());
    }

    @Test
    public void rejectsWrongDeviceLicense() throws Exception {
        KeyPair developer = generateEd25519KeyPair();
        KeyPair device = generateP256KeyPair();
        KeyPair otherDevice = generateP256KeyPair();

        String license = signedLicense(
                developer,
                "{\"licenseId\":\"L-1002\",\"shopName\":\"Wrong Device\",\"devicePublicKey\":\"" + encodePublicKey(otherDevice) + "\",\"deviceFingerprint\":\"" + sha256Hex(otherDevice.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}"
        );

        LicenseVerifier.LicenseVerificationResult result = LicenseVerifier.verifyLicense(license, encodePublicKey(device), developer.getPublic());

        assertFalse(result.isValid());
        assertEquals("License belongs to another device", result.getStatus());
    }

    @Test
    public void rejectsExpiredLicense() throws Exception {
        Fixture fixture = new Fixture();
        String license = signedLicense(
                fixture.developer,
                payload(fixture.device, Instant.now().minusSeconds(120).toString(), Instant.now().minusSeconds(30).toString())
        );

        LicenseVerifier.LicenseVerificationResult result = verify(license, fixture);

        assertFalse(result.isValid());
        assertEquals("Expired License", result.getStatus());
    }

    @Test
    public void rejectsFutureIssueDate() throws Exception {
        Fixture fixture = new Fixture();
        String license = signedLicense(
                fixture.developer,
                payload(fixture.device, Instant.now().plusSeconds(3600).toString(), null)
        );

        LicenseVerifier.LicenseVerificationResult result = verify(license, fixture);

        assertFalse(result.isValid());
        assertEquals("Invalid License", result.getStatus());
    }

    @Test
    public void rejectsTamperedLicense() throws Exception {
        Fixture fixture = new Fixture();
        String license = signedLicense(
                fixture.developer,
                payload(fixture.device, Instant.now().minusSeconds(30).toString(), null)
        );
        String tampered = license.substring(0, license.length() - 4) + "AAAA";

        LicenseVerifier.LicenseVerificationResult result = verify(tampered, fixture);

        assertFalse(result.isValid());
        assertEquals("Invalid License", result.getStatus());
    }

    @Test
    public void rejectsEmptyLicense() {
        Fixture fixture = new Fixture();

        LicenseVerifier.LicenseVerificationResult empty = verify("", fixture);
        LicenseVerifier.LicenseVerificationResult blank = verify("   ", fixture);

        assertFalse(empty.isValid());
        assertEquals("Not Activated", empty.getStatus());
        assertFalse(blank.isValid());
        assertEquals("Not Activated", blank.getStatus());
    }

    @Test
    public void rejectsInvalidLicenseFormat() {
        Fixture fixture = new Fixture();

        LicenseVerifier.LicenseVerificationResult result = verify("not-a-license", fixture);

        assertFalse(result.isValid());
        assertEquals("Invalid License", result.getStatus());
    }

    @Test
    public void rejectsMismatchedFingerprint() throws Exception {
        Fixture fixture = new Fixture();
        String devicePublicKey = encodePublicKey(fixture.device);
        String license = signedLicense(
                fixture.developer,
                "{\"licenseId\":\"L-1008\",\"shopName\":\"Tampered Fingerprint\",\"devicePublicKey\":\"" + devicePublicKey + "\",\"deviceFingerprint\":\"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}"
        );

        LicenseVerifier.LicenseVerificationResult result = verify(license, fixture);

        assertFalse(result.isValid());
        assertEquals("Invalid License", result.getStatus());
    }

    private static LicenseVerifier.LicenseVerificationResult verify(String license, Fixture fixture) {
        return LicenseVerifier.verifyLicense(license, encodePublicKey(fixture.device), fixture.developer.getPublic());
    }

    private static String payload(KeyPair device, String issuedAt, String expiresAt) throws Exception {
        String expiresJson = expiresAt == null ? "null" : "\"" + expiresAt + "\"";
        return "{\"licenseId\":\"L-TEST\",\"shopName\":\"Devwerx Demo\",\"devicePublicKey\":\"" + encodePublicKey(device) + "\",\"deviceFingerprint\":\"" + sha256Hex(device.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + issuedAt + "\",\"expiresAt\":" + expiresJson + ",\"licenseType\":\"standard\"}";
    }

    private static String signedLicense(KeyPair developer, String payloadJson) throws Exception {
        String payloadPart = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = "DEVWERX-LICENSE-V1." + payloadPart;
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(developer.getPrivate());
        signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
        String signature = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());
        return signingInput + "." + signature;
    }

    private static String encodePublicKey(KeyPair keyPair) {
        return java.util.Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
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

    private static final class Fixture {
        private final KeyPair developer;
        private final KeyPair device;

        private Fixture() {
            try {
                this.developer = generateEd25519KeyPair();
                this.device = generateP256KeyPair();
            } catch (Exception exception) {
                throw new RuntimeException(exception);
            }
        }
    }
}
