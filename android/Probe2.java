import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.time.Instant;
import java.util.Base64;

public class Probe {
  public static void main(String[] args) throws Exception {
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
    kpg.initialize(new ECGenParameterSpec("secp256r1"));
    KeyPair device = kpg.generateKeyPair();
    KeyPairGenerator ed = KeyPairGenerator.getInstance("Ed25519");
    KeyPair dev = ed.generateKeyPair();

    String devicePublicKey = Base64.getEncoder().encodeToString(device.getPublic().getEncoded());
    String payloadJson = "{\"licenseId\":\"L-1001\",\"shopName\":\"Devwerx Demo\",\"devicePublicKey\":\"" + devicePublicKey + "\",\"deviceFingerprint\":\"" + sha256Hex(device.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}";
    String payloadPart = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
    String signingInput = "DEVWERX-LICENSE-V1." + payloadPart;
    Signature signer = Signature.getInstance("Ed25519");
    signer.initSign(dev.getPrivate());
    signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
    String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());

    String license = signingInput + "." + signature;
    System.out.println("license=" + license);
    System.out.println("verify=" + verify(license, devicePublicKey, dev.getPublic()));
  }

  static String verify(String licenseKey, String currentDevicePublicKey, PublicKey developerPublicKey) throws Exception {
    String[] parts = licenseKey.split("\\.");
    System.out.println("parts=" + parts.length + ":" + parts[0]);
    byte[] payloadBytes = base64UrlDecode(parts[1]);
    byte[] signatureBytes = base64UrlDecode(parts[2]);
    Signature verifier = Signature.getInstance("Ed25519");
    verifier.initVerify(developerPublicKey);
    verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
    boolean valid = verifier.verify(signatureBytes);
    System.out.println("valid signature=" + valid);
    System.out.println(new String(payloadBytes, StandardCharsets.UTF_8));
    return valid ? "OK" : "NO";
  }

  static byte[] base64UrlDecode(String value) {
    String normalized = value.replace('-', '+').replace('_', '/');
    int remainder = normalized.length() % 4;
    if (remainder == 2) normalized += "==";
    else if (remainder == 3) normalized += "=";
    else if (remainder != 0) return null;
    return Base64.getDecoder().decode(normalized);
  }

  static String sha256Hex(byte[] bytes) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
    StringBuilder out = new StringBuilder(digest.length * 2);
    for (byte value : digest) {
      out.append(String.format("%02x", value & 0xFF));
    }
    return out.toString();
  }
}
' > Probe.java
javac Probe.java
java Probe
@'
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.time.Instant;
import java.util.Base64;

public class Probe {
  public static void main(String[] args) throws Exception {
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
    kpg.initialize(new ECGenParameterSpec("secp256r1"));
    KeyPair device = kpg.generateKeyPair();
    KeyPairGenerator ed = KeyPairGenerator.getInstance("Ed25519");
    KeyPair dev = ed.generateKeyPair();

    String devicePublicKey = Base64.getEncoder().encodeToString(device.getPublic().getEncoded());
    String payloadJson = "{\"licenseId\":\"L-1001\",\"shopName\":\"Devwerx Demo\",\"devicePublicKey\":\"" + devicePublicKey + "\",\"deviceFingerprint\":\"" + sha256Hex(device.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}";
    String payloadPart = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
    String signingInput = "DEVWERX-LICENSE-V1." + payloadPart;
    Signature signer = Signature.getInstance("Ed25519");
    signer.initSign(dev.getPrivate());
    signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
    String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());

    String license = signingInput + "." + signature;
    System.out.println("license=" + license);
    System.out.println("verifyStatus=" + verifyLicense(license, devicePublicKey, dev.getPublic()));
  }

  static String verifyLicense(String licenseKey, String currentDevicePublicKey, PublicKey developerPublicKey) throws Exception {
    String[] parts = licenseKey.split("\\.");
    byte[] payloadBytes = base64UrlDecode(parts[1]);
    byte[] signatureBytes = base64UrlDecode(parts[2]);
    Signature verifier = Signature.getInstance("Ed25519");
    verifier.initVerify(developerPublicKey);
    verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
    boolean valid = verifier.verify(signatureBytes);
    System.out.println("valid=" + valid);
    if (!valid) return "INVALID";
    return "OK";
  }

  static byte[] base64UrlDecode(String value) {
    String normalized = value.replace('-', '+').replace('_', '/');
    int remainder = normalized.length() % 4;
    if (remainder == 2) normalized += "==";
    else if (remainder == 3) normalized += "=";
    else if (remainder != 0) return null;
    return Base64.getDecoder().decode(normalized);
  }

  static String sha256Hex(byte[] bytes) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
    StringBuilder out = new StringBuilder(digest.length * 2);
    for (byte value : digest) {
      out.append(String.format("%02x", value & 0xFF));
    }
    return out.toString();
  }
}
' > Probe.java
javac Probe.java
java Probe
@'
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.time.Instant;
import java.util.Base64;

public class Probe2 {
  public static void main(String[] args) throws Exception {
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
    kpg.initialize(new ECGenParameterSpec("secp256r1"));
    KeyPair device = kpg.generateKeyPair();
    KeyPairGenerator ed = KeyPairGenerator.getInstance("Ed25519");
    KeyPair dev = ed.generateKeyPair();

    String devicePublicKey = Base64.getEncoder().encodeToString(device.getPublic().getEncoded());
    String payloadJson = "{\"licenseId\":\"L-1001\",\"shopName\":\"Devwerx Demo\",\"devicePublicKey\":\"" + devicePublicKey + "\",\"deviceFingerprint\":\"" + sha256Hex(device.getPublic().getEncoded()) + "\",\"issuedAt\":\"" + Instant.now().minusSeconds(30).toString() + "\",\"expiresAt\":null,\"licenseType\":\"standard\"}";
    System.out.println(payloadJson);
    String payloadPart = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
    String signingInput = "DEVWERX-LICENSE-V1." + payloadPart;
    Signature signer = Signature.getInstance("Ed25519");
    signer.initSign(dev.getPrivate());
    signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
    String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());
    String license = signingInput + "." + signature;
    System.out.println("license=" + license);
    System.out.println("status=" + verifyHelper(license, devicePublicKey, dev.getPublic()));
  }

  static String verifyHelper(String licenseKey, String currentDevicePublicKey, PublicKey developerPublicKey) throws Exception {
    String[] parts = licenseKey.split("\\.");
    System.out.println("parts.length=" + parts.length);
    byte[] payloadBytes = base64UrlDecode(parts[1]);
    byte[] signatureBytes = base64UrlDecode(parts[2]);
    Signature verifier = Signature.getInstance("Ed25519");
    verifier.initVerify(developerPublicKey);
    verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
    boolean valid = verifier.verify(signatureBytes);
    System.out.println("valid=" + valid);
    return valid ? "OK" : "NO";
  }

  static byte[] base64UrlDecode(String value) {
    String normalized = value.replace('-', '+').replace('_', '/');
    int remainder = normalized.length() % 4;
    if (remainder == 2) normalized += "==";
    else if (remainder == 3) normalized += "=";
    else if (remainder != 0) return null;
    return Base64.getDecoder().decode(normalized);
  }

  static String sha256Hex(byte[] bytes) throws Exception {
    byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
    StringBuilder out = new StringBuilder(digest.length * 2);
    for (byte value : digest) {
      out.append(String.format("%02x", value & 0xFF));
    }
    return out.toString();
  }
}
