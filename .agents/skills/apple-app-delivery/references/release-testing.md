# release-testing

Read this for a registered-device test that must not enter App Store Connect. In current Xcode terminology, `release-testing` replaces the older `ad-hoc` export method.

This channel applies when the target platform and provisioning profile support registered devices. Resolve the intended devices, their registration status, the exact bundle identifier, and the profile before building. Do not register a device, create a profile, or change a device list unless the user authorized it.

For an iOS-family archive, export with the project’s release-testing configuration. The artifact must use Apple Distribution signing and a provisioning profile whose platform, application identifier, certificate, and `ProvisionedDevices` cover the selected devices. Check the installed `xcodebuild -help` for the current export options.

macOS does not use registered-device provisioning in this sense. For a direct macOS test, use the Developer ID lane and notarization rules in [macOS delivery](macos-delivery.md), not this channel.

Run the relevant tests and verify the exported artifact before handoff. Deliver only to the explicitly named devices or channel. Do not upload the artifact to App Store Connect, add TestFlight groups, or submit any review.
