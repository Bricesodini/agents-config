---
name: apple-app-delivery
description: Deliver Apple-platform apps through TestFlight, App Store release, ad-hoc registered-device testing, or macOS Developer ID notarization. Use for signing, archives, build numbers, App Store Connect, external testing, App Review, Transporter, or notarization; not for ordinary local builds or tests.
---

# Apple App Delivery

Resolve the delivery intent before building. App Store Connect identity, signing identity, artifact, build number, and audience are separate targets.

| Requested outcome | Channel |
| --- | --- |
| Internal or external beta | TestFlight |
| Public App Store release | App Store release |
| Registered-device test without Apple processing | release-testing |
| Direct macOS download | Developer ID + notarization |

Read [Auth and key vault](references/auth-and-keyvault.md) for App Store Connect authentication or a first app record. Then choose the two references matching the platform and channel:

- Read [macOS delivery](references/macos-delivery.md) for macOS.
- Read [iOS-family delivery](references/ios-family-delivery.md) for iOS, iPadOS, watchOS, tvOS, or visionOS.
- Read [TestFlight](references/testflight.md) for any beta delivery.
- Read [App Store release](references/app-store-release.md) for submission, sale, or public publication.
- Read [release-testing](references/release-testing.md) for registered-device testing without App Store Connect processing.
- Read [Troubleshooting](references/troubleshooting.md) only after a signing, provisioning, authentication, upload, processing, or notarization failure.

## Preflight

Keep discovery read-only. Identify platform, bundle identifier, version, build number, project layout, signing configuration, entitlements, artifact type, and intended audience. Resolve an existing app with `asc apps list --bundle-id <bundle-id>`. Use `asc builds next-build-number` scoped to the same marketing version and platform; never reuse an observed build number.

Use the project’s packaging recipe when it exists. Otherwise, archive and export with Xcode. A custom Swift package needs an explicit App Store packaging path before it can enter TestFlight or App Store release.

Run relevant tests and create the artifact in a fresh directory. Use `scripts/verify-artifact.sh <artifact.pkg|artifact.ipa>` as the upload gate: `OK` (exit 0) proceeds, `WARN` (1) is a wrong lane, and `FAIL` (2) stops delivery.

## Authorization boundary

Uploading, assigning tester groups, inviting testers, submitting beta review, submitting App Review, and releasing publicly are external mutations. Before each sequence, state the app, platform, artifact path, version/build, and audience.

TestFlight authorization does not authorize App Store submission or public release. App Store submission does not authorize release to customers: confirm the requested release mode before that final action. Do not invite testers, enable external testing, submit review, or release publicly unless the user asked.

## Completion

Report the channel, app and build identifiers, artifact path and signature result, Apple processing state, audience action, and remaining Apple-side action. Preserve Apple rejection text verbatim.
