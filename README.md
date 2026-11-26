# dtb-cli

Everyday developer utilities in one command. No install, no browser tabs, no sketchy websites.

```bash
npx dtb-cli uuid
```

Install globally for the short `dtb` command:

```bash
npm i -g dtb-cli
dtb uuid
```

## Commands

| Command | What it does |
| --- | --- |
| `dtb uuid [-n 5] [--upper]` | Generate UUID v4 |
| `dtb base64 encode\|decode <text>` | Base64 (add `--url` for URL-safe) |
| `dtb jwt <token>` | Decode a JWT, show dates and whether it is expired |
| `dtb ts [value]` | Current time, or convert unix seconds/ms <-> date |
| `dtb hash <text> [--algo sha256]` | `md5`, `sha1`, `sha256`, `sha512` |
| `dtb pass [-l 20] [--no-symbols]` | Strong random password (cryptographically secure) |
| `dtb url encode\|decode <text>` | URL-encode or decode |

Input can be piped too:

```bash
echo "hello" | dtb base64 encode
pbpaste | dtb jwt            # macOS: decode the token in your clipboard
```

## Examples

```bash
dtb uuid -n 3
dtb base64 encode "আমার বাংলা"
dtb jwt eyJhbGciOiJIUzI1NiJ9...
dtb ts 1700000000            # unix seconds or milliseconds
dtb ts "2026-01-31 10:00"    # date -> timestamp
dtb hash "my text" --algo md5
dtb pass -l 32
```

## Notes

- **JWT:** the token is only decoded, the signature is **not verified**. Never trust a token because it decodes.
- **Privacy:** everything runs locally. Nothing is sent over the network, so it is safe for real tokens.
- Zero dependencies. Node 18+.

## License

MIT
