const { test } = require('node:test');
const assert = require('assert');
const { sanitizePackageName, sanitizePackages, detectSecrets, redactSecrets } = require('../../src/utils/exec');

test('sanitizePackageName allows valid package names', () => {
  assert.strictEqual(sanitizePackageName('node'), 'node');
  assert.strictEqual(sanitizePackageName('my-package'), 'my-package');
  assert.strictEqual(sanitizePackageName('my_package'), 'my_package');
  assert.strictEqual(sanitizePackageName('@scope/package'), '@scope/package');
  assert.strictEqual(sanitizePackageName('user/repo'), 'user/repo');
  assert.strictEqual(sanitizePackageName('package.js'), 'package.js');
});

test('sanitizePackageName rejects invalid package names', () => {
  assert.strictEqual(sanitizePackageName('package; rm -rf /'), null);
  assert.strictEqual(sanitizePackageName('package && echo hack'), null);
  assert.strictEqual(sanitizePackageName('package|cat /etc/passwd'), null);
  assert.strictEqual(sanitizePackageName('package`whoami`'), null);
  assert.strictEqual(sanitizePackageName('package$(whoami)'), null);
});

test('sanitizePackageName handles edge cases', () => {
  assert.strictEqual(sanitizePackageName(''), null);
  assert.strictEqual(sanitizePackageName(null), null);
  assert.strictEqual(sanitizePackageName(undefined), null);
  assert.strictEqual(sanitizePackageName(123), null);
});

test('sanitizePackages filters out invalid packages', () => {
  const packages = [
    { name: 'valid' },
    { name: 'valid-package' },
    { name: 'bad; rm -rf /' },
    { name: '@scope/package' }
  ];

  const result = sanitizePackages(packages);
  assert.strictEqual(result.length, 3);
  assert.ok(result.includes('valid'));
  assert.ok(result.includes('valid-package'));
  assert.ok(result.includes('@scope/package'));
  assert.ok(!result.includes('bad; rm -rf /'));
});

test('sanitizePackages handles empty array', () => {
  const result = sanitizePackages([]);
  assert.strictEqual(result.length, 0);
});

test('detectSecrets detects API keys', () => {
  const content = 'API_KEY=abcd1234567890abcd1234567890';
  const result = detectSecrets(content);
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.secrets.some(s => s.type === 'API Key'));
});

test('detectSecrets detects passwords', () => {
  const content = 'password=mysecretpassword123';
  const result = detectSecrets(content);
  assert.strictEqual(result.hasSecrets, true);
  assert.ok(result.secrets.some(s => s.type === 'Password'));
});

test('detectSecrets does not detect false positives', () => {
  const content = 'export PATH=/usr/local/bin:$PATH';
  const result = detectSecrets(content);
  assert.strictEqual(result.hasSecrets, false);
});

test('redactSecrets redacts sensitive data', () => {
  const content = 'API_KEY=abcd1234567890abcd1234567890';
  const result = redactSecrets(content);
  assert.ok(result.includes('[REDACTED]'));
  assert.ok(!result.includes('abcd1234567890abcd1234567890'));
});
