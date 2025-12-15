# Security Considerations

## Overview

mac-blueprint prioritizes security through:
- Input sanitization to prevent command injection
- Secret detection and redaction capabilities
- JSON schema validation
- Read-only capture operations
- User consent for all destructive operations

---

## Security Features

### 1. Command Injection Prevention

**Issue:** Maliciously crafted package names could execute arbitrary commands.

**Protection:**
- All package names are validated against strict regex patterns
- Only alphanumeric characters, dashes, underscores, slashes, @ symbols, and dots are allowed
- Invalid packages are automatically filtered out with warnings

**Example:**
```javascript
// SAFE - validated input
brew install node python git

// BLOCKED - malicious input
brew install node; rm -rf /  // ❌ Rejected by sanitization
```

**Implementation:** See [`src/utils/exec.js`](src/utils/exec.js) - `sanitizePackageName()`

---

### 2. Secret Detection

**Issue:** Shell configurations and git configs may contain API keys, passwords, or tokens.

**Protection:**
- Automatic detection of common secret patterns
- Warning messages when secrets are found
- `--redact-secrets` flag to automatically remove sensitive data

**Detected patterns:**
- API keys
- Passwords
- Tokens (access tokens, OAuth, JWT)
- AWS access keys
- GitHub personal access tokens
- SSH/GPG private keys

**Usage:**
```bash
# Scan for secrets (warnings only)
node src/tools/capture.js

# Automatically redact secrets
node src/tools/capture.js --redact-secrets
```

**What gets redacted:**
```bash
# Before
export API_KEY=sk_live_abcd1234567890

# After
export API_KEY=[REDACTED]
```

---

### 3. JSON Schema Validation

**Issue:** Malformed or malicious JSON could cause crashes or unexpected behavior.

**Protection:**
- All setup files are validated before processing
- Required fields are checked
- Data types are verified
- Version compatibility is checked

**Implementation:** See [`src/utils/schema.js`](src/utils/schema.js) - `validateSetup()`

---

### 4. Batch Processing

**Issue:** Very large package lists could exceed command-line argument limits or cause resource exhaustion.

**Protection:**
- Packages are installed in batches (50 formulae, 30 casks at a time)
- Prevents ARG_MAX limit issues
- Reduces memory usage

---

## Best Practices

### Before Capturing

1. **Review shell configurations** for hardcoded secrets
2. **Clean up sensitive files** in ~/bin if they contain credentials
3. **Check git config** for credential URLs (e.g., `https://token@github.com/repo`)

### Before Sharing

1. **Use `--redact-secrets` flag** when capturing
2. **Review the generated JSON** for any sensitive data
3. **Remove or obfuscate** hostname if privacy is a concern
4. **Consider excluding** shell config content if sharing publicly

### During Restore

1. **Review the JSON** before applying to a new system
2. **Use `--dry-run`** to preview changes
3. **Verify the source** of any shared setup files
4. **Never run setup files** from untrusted sources

---

## Known Limitations

### What is NOT Protected

1. **Application preferences** - May contain sensitive data, not captured
2. **SSH keys** - Not captured or restored (intentional)
3. **GPG keys** - Not captured or restored (intentional)
4. **Keychain items** - Not accessible programmatically
5. **Browser passwords** - Not captured
6. **Docker secrets** - Not included

### Manual Security Steps Required

After restoring a setup, you must manually:
- Set up SSH keys
- Configure GPG keys
- Sign in to applications requiring authentication
- Restore keychain items if needed
- Configure 2FA where required

---

## Threat Model

### Threats Addressed

✅ **Command Injection** - Input sanitization prevents malicious commands
✅ **Secret Exposure** - Detection and redaction capabilities
✅ **Malformed Data** - JSON validation prevents crashes
✅ **Resource Exhaustion** - Batch processing limits resource usage

### Threats NOT Addressed

⚠️ **Physical Access** - Tool assumes physical machine access is secure
⚠️ **Social Engineering** - User must verify setup file source
⚠️ **Keyloggers/Malware** - Tool doesn't protect against system compromise
⚠️ **Network Attacks** - Homebrew downloads use standard HTTPS (same as manual)

---

## Security Updates

### Version 2.0 (Current)

- ✅ Added input sanitization
- ✅ Added secret detection and redaction
- ✅ Added JSON schema validation
- ✅ Added batch processing to prevent resource issues
- ✅ Removed duplicate code reducing attack surface

### Version 1.0 (Legacy)

- ⚠️ No input sanitization (vulnerable to command injection)
- ⚠️ No secret detection
- ⚠️ No JSON validation

**Migration:** Re-capture your setup with version 2.0 for security improvements.

---

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to [your-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and provide a fix within 7 days for critical issues.

---

## Security Checklist

### For Users

- [ ] Review shell configs for secrets before capturing
- [ ] Use `--redact-secrets` when sharing setup files
- [ ] Verify source of setup files before applying
- [ ] Use `--dry-run` to preview changes
- [ ] Review JSON manually before sharing publicly
- [ ] Keep mac-blueprint updated to latest version

### For Contributors

- [ ] Sanitize all user inputs before shell execution
- [ ] Never use `eval()` or equivalent
- [ ] Validate all JSON data before processing
- [ ] Add tests for security features
- [ ] Document security implications of changes
- [ ] Follow principle of least privilege

---

## Secure Configuration Examples

### Capturing Without Secrets

```bash
# Clean approach - redact automatically
node src/tools/capture.js --redact-secrets

# Verify no secrets in output
grep -i "password\|token\|key" mac-setup.json
```

### Applying with Verification

```bash
# 1. Preview first
node src/tools/apply.js mac-setup.json --dry-run

# 2. Review changes
# 3. Apply with verification
node src/tools/apply.js mac-setup.json --verify

# 4. Check for any failures
echo $?  # Should be 0 for success
```

### Differential Backup (Safer)

```bash
# Capture current state
node src/tools/capture.js
mv mac-setup.json mac-setup-$(date +%Y%m%d).json

# Compare with previous backup
node src/tools/diff.js mac-setup-20241201.json mac-setup-20241215.json

# Only restore changes you recognize
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE-78: Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [Homebrew Security](https://docs.brew.sh/Security)

---

## License

This security documentation is part of mac-blueprint and follows the same license.

Last updated: 2024-12-15
