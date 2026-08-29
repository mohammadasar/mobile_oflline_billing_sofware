package com.offlinebilling.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(android.os.Bundle savedInstanceState) {
		registerPlugin(LicensePlugin.class);
		super.onCreate(savedInstanceState);
	}
}
