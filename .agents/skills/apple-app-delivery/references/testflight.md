# TestFlight

Read this for internal or external beta delivery on any Apple platform.

After the verified artifact is ready, use the installed CLI form shown by `asc builds upload --help`. The current macOS form is:

```bash
asc builds upload --app <app-id> --pkg <App.pkg> \
  --version <marketing-version> --build-number <build-number> --wait
```

For iOS-family artifacts, use `--ipa`. The CLI derives `MAC_OS` from `--pkg`; use an explicit platform when a read or selector requires it.

Wait for Apple processing, then read back the exact build and its processing state. Add a build only to a named group when the group does not already receive all builds. Internal groups need no external beta review. External groups can require beta review: submit only when the user explicitly requested external testing.

TestFlight builds are time-limited. Report the expiration date and any test information, export-compliance, or beta-review action still required.
