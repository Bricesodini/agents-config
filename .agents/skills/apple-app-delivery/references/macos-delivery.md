# macOS delivery

Read this for every macOS delivery. TestFlight and App Store use a signed `.pkg`; Developer ID uses a separately signed and notarized direct-distribution artifact.

| Concern | TestFlight / App Store | Direct macOS |
| --- | --- | --- |
| Binary identity | Apple Distribution / Mac App Distribution | Developer ID Application |
| Installer identity | Mac Installer Distribution | Developer ID Installer |
| Artifact | `.pkg` containing the app | `.pkg`, `.dmg`, or `.zip` as requested |
| Sandbox | Required | Optional |
| Hardened Runtime | Recommended | Required for notarization |
| Notarization | Not used | Required before distribution |

For App Store delivery, verify `com.apple.security.app-sandbox = true` and a meaningful `NSHumanReadableCopyright` in the app Info.plist. Use the installed `xcodebuild -help` as the source of truth for export options.

For a current Xcode App Store Connect export, use `method = app-store-connect` and `destination = upload`. With manual signing, use `signingStyle = manual`, `signingCertificate = Apple Distribution`, and `installerSigningCertificate = Mac Installer Distribution`. `app-store` is a deprecated compatibility value.

Verify the embedded app with `codesign --verify --deep --strict <App.app>`. Inspect the package with `pkgutil --payload-files <App.pkg>` and `pkgutil --check-signature <App.pkg>`; `codesign` does not assess a `.pkg`. `spctl --assess` evaluates Gatekeeper and can reject an App Store package locally, so it is diagnostic only.

Do not upload a Developer ID app, DMG, or ZIP to TestFlight or App Store Connect. Do not notarize an App Store/TestFlight package.
