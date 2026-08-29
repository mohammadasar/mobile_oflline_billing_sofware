package com.offlinebilling.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "License")
public class LicensePlugin extends Plugin {
    private final DeviceIdentityManager identityManager = new DeviceIdentityManager();

    @PluginMethod
    public void getDeviceIdentity(PluginCall call) {
        try {
            DeviceIdentityManager.DeviceIdentity identity = identityManager.getOrCreateIdentity();
            JSObject result = new JSObject();
            result.put("available", true);
            result.put("keyAlias", identity.getKeyAlias());
            result.put("publicKey", identity.getPublicKey());
            result.put("deviceId", identity.getDeviceId());
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Could not access the Android Keystore device identity", exception);
        }
    }

    @PluginMethod
    public void verifyLicense(PluginCall call) {
        try {
            String licenseKey = call.getString("licenseKey", "");
            DeviceIdentityManager.DeviceIdentity identity = identityManager.getOrCreateIdentity();
            LicenseVerifier.LicenseVerificationResult result = LicenseVerifier.verifyLicense(
                    getContext(),
                    licenseKey,
                    identity.getPublicKey()
            );

            JSObject response = new JSObject();
            response.put("status", result.getStatus());
            response.put("valid", result.isValid());
            response.put("licenseId", result.getLicenseId());
            response.put("shopName", result.getShopName());
            response.put("expiresAt", result.getExpiresAt());
            response.put("licenseType", result.getLicenseType());
            call.resolve(response);
        } catch (Exception exception) {
            call.reject("Could not verify the license key", exception);
        }
    }
}
