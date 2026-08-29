package com.offlinebilling.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.cert.Certificate;
import java.security.spec.ECGenParameterSpec;

public final class DeviceIdentityManager {
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String KEY_ALIAS = "offlinebilling-license-device-key";

    public DeviceIdentity getOrCreateIdentity() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);

        if (!keyStore.containsAlias(KEY_ALIAS)) {
            KeyPairGenerator generator = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_EC,
                    KEYSTORE_PROVIDER
            );
            generator.initialize(new KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
            )
                    .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .setUserAuthenticationRequired(false)
                    .build());
            generator.generateKeyPair();
        }

        Certificate certificate = keyStore.getCertificate(KEY_ALIAS);
        if (certificate == null || certificate.getPublicKey() == null) {
            throw new IllegalStateException("Device license key is unavailable");
        }

        byte[] publicKey = certificate.getPublicKey().getEncoded();
        return new DeviceIdentity(
                KEY_ALIAS,
                Base64.encodeToString(publicKey, Base64.NO_WRAP),
                toHex(MessageDigest.getInstance("SHA-256").digest(publicKey))
        );
    }

    private static String toHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            result.append(String.format("%02x", value & 0xff));
        }
        return result.toString();
    }

    public static final class DeviceIdentity {
        private final String keyAlias;
        private final String publicKey;
        private final String deviceId;

        private DeviceIdentity(String keyAlias, String publicKey, String deviceId) {
            this.keyAlias = keyAlias;
            this.publicKey = publicKey;
            this.deviceId = deviceId;
        }

        public String getKeyAlias() {
            return keyAlias;
        }

        public String getPublicKey() {
            return publicKey;
        }

        public String getDeviceId() {
            return deviceId;
        }
    }
}
