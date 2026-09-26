# Auth and key vault

Read this for App Store Connect authentication or web-only operations such as creating a first app record.

`asc auth` uses API-key profiles for App Store Connect API calls. `asc web auth` uses a separate Apple Account browser session. One does not establish the other.

## Discover safely

Run `asc auth status --output json`; add `--validate` when a usable API credential must be proven. The current CLI reports stored profiles and key IDs, not an issuer ID, key expiry, or web-session status.

Use `scripts/vault-status.sh` to inspect only vault metadata and `.p8` filenames. It never reads private-key contents. The local convention is:

```text
~/.secrets/appstore-connect/
├── issuer-id
├── key-type
└── AuthKey_<KEY_ID>.p8
```

Match the active key ID to the filename-derived ID. A missing vault, missing metadata, or mismatch is a stop condition. Never print, copy, hash, encode, or diff a `.p8` file.

## Repair and web flows

If no usable API-key profile exists, ask the user to place the key in the vault; never request key material in chat. Register the existing key file with:

```bash
asc auth login --name <profile-name> --key-id <key-id> \
  --issuer-id <issuer-id> --private-key <path-to-AuthKey.p8>
```

Before a web-only action, run `asc web auth status --output json`. If there is no usable session, surface `asc web auth login` as the interactive human step.
