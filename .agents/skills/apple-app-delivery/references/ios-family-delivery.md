# iOS-family delivery

Read this for iOS, iPadOS, tvOS, watchOS, or visionOS. The upload artifact is an `.ipa` built with Apple Distribution signing and the platform’s App Store provisioning profile.

WatchOS normally ships inside an iOS archive; resolve its host app and archive before choosing the platform selector. iPadOS uses the iOS platform in App Store Connect. Use the installed `asc builds upload --help` and `xcodebuild -help` for current platform and export-option names.

Archive with the project’s scheme and export with the App Store Connect method. For a current Xcode export, use `method = app-store-connect` and `destination = upload`; use manual signing only when the project requires it.

Before upload, verify the `.ipa` payload’s bundle identifier, marketing version, build number, provisioning profile, entitlements, and Apple Distribution signature. Do not substitute an ad-hoc, development-signed, or enterprise artifact for TestFlight/App Store delivery.
