package com.offlinebilling.app;

import android.content.Context;

import org.json.JSONObject;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import java.security.Security;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.stream.Collectors;

public final class LicenseVerifier {
    private static final String VERSION = "DEVWERX-LICENSE-V1";
    public static final String STATUS_NOT_ACTIVATED = "Not Activated";
    public static final String STATUS_ACTIVATED = "Activated";
    public static final String STATUS_INVALID = "Invalid License";
    public static final String STATUS_WRONG_DEVICE = "License belongs to another device";
    public static final String STATUS_EXPIRED = "Expired License";

    private LicenseVerifier() {
    }

    public static LicenseVerificationResult verifyLicense(Context context, String licenseKey, String currentDevicePublicKey) throws Exception {
        PublicKey developerPublicKey = loadDeveloperPublicKey(context);
        return verifyLicense(licenseKey, currentDevicePublicKey, developerPublicKey);
    }

    public static LicenseVerificationResult verifyLicense(String licenseKey, String currentDevicePublicKey, PublicKey developerPublicKey) {
        if (licenseKey == null || licenseKey.trim().isEmpty()) {
            return new LicenseVerificationResult(STATUS_NOT_ACTIVATED, "", "", "", false);
        }

        try {
            String[] parts = licenseKey.split("\\.");
            if (parts.length != 3 || !VERSION.equals(parts[0])) {
                return new LicenseVerificationResult(STATUS_INVALID, "", "", "", false);
            }

            byte[] payloadBytes = base64UrlDecode(parts[1]);
            byte[] signatureBytes = base64UrlDecode(parts[2]);
            if (payloadBytes == null || signatureBytes == null) {
                return new LicenseVerificationResult(STATUS_INVALID, "", "", "", false);
            }

            // Signature verifier = Signature.getInstance("Ed25519");
         BouncyCastleProvider bcProvider = new BouncyCastleProvider();

Signature verifier = Signature.getInstance("Ed25519", bcProvider);
verifier.initVerify(developerPublicKey);
verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
            if (!verifier.verify(signatureBytes)) {
                return new LicenseVerificationResult(STATUS_INVALID, "", "", "", false);
            }

            JSONObject payload = new JSONObject(new String(payloadBytes, StandardCharsets.UTF_8));
            String[] requiredKeys = {"licenseId", "shopName", "devicePublicKey", "deviceFingerprint", "issuedAt", "expiresAt", "licenseType"};
            for (String key : requiredKeys) {
                if (!payload.has(key)) {
                    return new LicenseVerificationResult(STATUS_INVALID, "", "", "", false);
                }
            }

            String licenseId = payload.optString("licenseId", "");
            String shopName = payload.optString("shopName", "");
            String devicePublicKey = normalizeBase64(payload.getString("devicePublicKey"));
            String deviceFingerprint = normalizeHex(payload.getString("deviceFingerprint"));
            String issuedAt = payload.getString("issuedAt");
            String expiresAt = payload.isNull("expiresAt") ? null : payload.getString("expiresAt");
            String licenseType = payload.optString("licenseType", "");

            if (devicePublicKey.isEmpty() || deviceFingerprint.isEmpty()) {
                return new LicenseVerificationResult(STATUS_INVALID, licenseId, shopName, expiresAt, false, licenseType);
            }

            byte[] decodedDevicePublicKey = decodeBase64(devicePublicKey);
            String expectedFingerprint = sha256Hex(decodedDevicePublicKey);
            if (!expectedFingerprint.equalsIgnoreCase(deviceFingerprint)) {
                return new LicenseVerificationResult(STATUS_INVALID, licenseId, shopName, expiresAt, false, licenseType);
            }

            String currentPublicKey = normalizeBase64(currentDevicePublicKey);
            String currentFingerprint = currentPublicKey.isEmpty() ? "" : sha256Hex(decodeBase64(currentPublicKey));
            if (!currentPublicKey.equals(devicePublicKey) && !currentFingerprint.equalsIgnoreCase(deviceFingerprint)) {
                return new LicenseVerificationResult(STATUS_WRONG_DEVICE, licenseId, shopName, expiresAt, false, licenseType);
            }

            Instant issuedInstant = Instant.parse(issuedAt);
            Instant now = Instant.now();
            if (issuedInstant.isAfter(now)) {
                return new LicenseVerificationResult(STATUS_INVALID, licenseId, shopName, expiresAt, false, licenseType);
            }

            if (expiresAt != null && !expiresAt.isEmpty() && !"lifetime".equalsIgnoreCase(expiresAt)) {
                Instant expiryInstant = Instant.parse(expiresAt);
                if (expiryInstant.isBefore(now)) {
                    return new LicenseVerificationResult(STATUS_EXPIRED, licenseId, shopName, expiresAt, false, licenseType);
                }
            }

            return new LicenseVerificationResult(STATUS_ACTIVATED, licenseId, shopName, expiresAt, true, licenseType);
        } catch (Exception exception) {
            return new LicenseVerificationResult(STATUS_INVALID, "", "", "", false);
        }
    }

    private static PublicKey loadDeveloperPublicKey(Context context) throws Exception {
        int resourceId = context.getResources().getIdentifier("developer_verification_public", "raw", context.getPackageName());
        if (resourceId == 0) {
            throw new IllegalStateException("Developer verification key resource not found");
        }

        try (InputStream inputStream = context.getResources().openRawResource(resourceId)) {
            String pem = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))
                    .lines()
                    .filter(line -> !line.contains("BEGIN") && !line.contains("END"))
                    .map(String::trim)
                    .filter(line -> !line.isEmpty())
                    .collect(Collectors.joining());

            byte[] der = decodeBase64(pem);
X509EncodedKeySpec keySpec = new X509EncodedKeySpec(der);

BouncyCastleProvider bcProvider = new BouncyCastleProvider();
KeyFactory keyFactory = KeyFactory.getInstance("Ed25519", bcProvider);

return keyFactory.generatePublic(keySpec);
        }
    }

    private static String normalizeBase64(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", "").trim();
    }

    private static String normalizeHex(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", "").trim().toLowerCase();
    }

    private static byte[] base64UrlDecode(String value) {
        if (value == null) return null;
        String normalized = value.trim().replace('-', '+').replace('_', '/');
        int remainder = normalized.length() % 4;
        if (remainder == 2) normalized += "==";
        else if (remainder == 3) normalized += "=";
        else if (remainder != 0) return null;
        try { return decodeBase64(normalized); }
        catch (IllegalArgumentException exception) { return null; }
    }

    private static byte[] decodeBase64(String value) {
        String normalized = value.replaceAll("\\s+", "");
        if (normalized.isEmpty() || normalized.length() % 4 != 0) throw new IllegalArgumentException("Invalid Base64");
        int padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
        byte[] decoded = new byte[(normalized.length() / 4) * 3 - padding];
        int outputIndex = 0;
        for (int inputIndex = 0; inputIndex < normalized.length(); inputIndex += 4) {
            int first = base64Value(normalized.charAt(inputIndex));
            int second = base64Value(normalized.charAt(inputIndex + 1));
            int third = normalized.charAt(inputIndex + 2) == '=' ? 0 : base64Value(normalized.charAt(inputIndex + 2));
            int fourth = normalized.charAt(inputIndex + 3) == '=' ? 0 : base64Value(normalized.charAt(inputIndex + 3));
            int combined = (first << 18) | (second << 12) | (third << 6) | fourth;
            if (outputIndex < decoded.length) decoded[outputIndex++] = (byte) (combined >> 16);
            if (outputIndex < decoded.length) decoded[outputIndex++] = (byte) (combined >> 8);
            if (outputIndex < decoded.length) decoded[outputIndex++] = (byte) combined;
        }
        return decoded;
    }

    private static int base64Value(char value) {
        if (value >= 'A' && value <= 'Z') return value - 'A';
        if (value >= 'a' && value <= 'z') return value - 'a' + 26;
        if (value >= '0' && value <= '9') return value - '0' + 52;
        if (value == '+') return 62;
        if (value == '/') return 63;
        throw new IllegalArgumentException("Invalid Base64 character");
    }

    private static String sha256Hex(byte[] bytes) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder builder = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            builder.append(String.format("%02x", b & 0xff));
        }
        return builder.toString();
    }

    public static final class LicenseVerificationResult {
        private final String status;
        private final String licenseId;
        private final String shopName;
        private final String expiresAt;
        private final boolean valid;
        private final String licenseType;

        public LicenseVerificationResult(String status, String licenseId, String shopName, String expiresAt, boolean valid) {
            this(status, licenseId, shopName, expiresAt, valid, "");
        }

        public LicenseVerificationResult(String status, String licenseId, String shopName, String expiresAt, boolean valid, String licenseType) {
            this.status = status;
            this.licenseId = licenseId;
            this.shopName = shopName;
            this.expiresAt = expiresAt;
            this.valid = valid;
            this.licenseType = licenseType;
        }

        public String getStatus() {
            return status;
        }

        public String getLicenseId() {
            return licenseId;
        }

        public String getShopName() {
            return shopName;
        }

        public String getExpiresAt() {
            return expiresAt;
        }

        public boolean isValid() {
            return valid;
        }

        public String getLicenseType() {
            return licenseType;
        }
    }
}
