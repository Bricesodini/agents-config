# Troubleshooting

Read this only after a failed delivery step. Preserve the exact tool or Apple message, identify the failed boundary, and repeat discovery before retrying a mutation.

| Failure boundary | First check | Safe next action |
| --- | --- | --- |
| Authentication | `asc auth status --validate` and vault metadata | Reuse the matching profile or ask for the existing key to be registered; never request key contents. |
| Provisioning or signing | Bundle ID, platform, certificate, profile, and signed entitlements | Correct the selected identity or profile, then rebuild in a fresh directory. |
| Artifact gate | Verifier output and embedded app/package signature | Treat `WARN` as a wrong lane and `FAIL` as a stop condition; repair the build recipe rather than uploading. |
| Build-number conflict | Existing and in-flight builds for the same version/platform | Select a new number, rebuild, and reverify. |
| Upload or processing | Exact build ID and Apple processing state | Wait for the current upload; do not create a duplicate upload while it is in flight. |
| Notarization | Notarization log and Developer ID identities | Use this only for the direct macOS lane; do not apply notarization fixes to TestFlight/App Store artifacts. |

When a tool’s syntax or behavior differs from this skill, use the installed CLI’s `--help` output as the operational source of truth and update the skill after the delivery is safely resolved.
