const { test } = require('node:test');
const assert = require('assert');
const { validateSetup, createEmptySetup, isCompatibleVersion, diffSetups, SCHEMA_VERSION } = require('../../src/utils/schema');

test('validateSetup accepts valid setup', () => {
  const setup = createEmptySetup();
  const result = validateSetup(setup);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateSetup detects missing system field', () => {
  const setup = { homebrew: { taps: [], casks: [], formulae: [] } };
  const result = validateSetup(setup);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('system')));
});

test('validateSetup detects missing homebrew field', () => {
  const setup = {
    version: '2.0',
    system: { hostname: 'test', macosVersion: '14.0', captureDate: '2024-01-01' }
  };
  const result = validateSetup(setup);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('homebrew')));
});

test('validateSetup handles legacy format', () => {
  const setup = {
    system: { hostname: 'test', macosVersion: '14.0', captureDate: '2024-01-01' },
    homebrew: { taps: [], casks: [], formulae: [] }
  };
  const result = validateSetup(setup);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(setup.version, '1.0');
});

test('createEmptySetup creates valid structure', () => {
  const setup = createEmptySetup();
  assert.strictEqual(setup.version, SCHEMA_VERSION);
  assert.ok(setup.system);
  assert.ok(setup.homebrew);
  assert.ok(Array.isArray(setup.applications));
});

test('isCompatibleVersion accepts same major version', () => {
  assert.strictEqual(isCompatibleVersion({ version: '2.0' }), true);
  assert.strictEqual(isCompatibleVersion({ version: '2.1' }), true);
});

test('isCompatibleVersion rejects different major version', () => {
  assert.strictEqual(isCompatibleVersion({ version: '3.0' }), false);
  assert.strictEqual(isCompatibleVersion({ version: '1.0' }), false);
});

test('diffSetups detects added applications', () => {
  const oldSetup = createEmptySetup();
  const newSetup = createEmptySetup();
  newSetup.applications = [{ name: 'Xcode.app', version: '15.0' }];

  const diff = diffSetups(oldSetup, newSetup);
  assert.strictEqual(diff.applications.added.length, 1);
  assert.strictEqual(diff.applications.added[0].name, 'Xcode.app');
});

test('diffSetups detects removed applications', () => {
  const oldSetup = createEmptySetup();
  oldSetup.applications = [{ name: 'Xcode.app', version: '14.0' }];
  const newSetup = createEmptySetup();

  const diff = diffSetups(oldSetup, newSetup);
  assert.strictEqual(diff.applications.removed.length, 1);
  assert.strictEqual(diff.applications.removed[0].name, 'Xcode.app');
});

test('diffSetups detects updated applications', () => {
  const oldSetup = createEmptySetup();
  oldSetup.applications = [{ name: 'Xcode.app', version: '14.0' }];
  const newSetup = createEmptySetup();
  newSetup.applications = [{ name: 'Xcode.app', version: '15.0' }];

  const diff = diffSetups(oldSetup, newSetup);
  assert.strictEqual(diff.applications.updated.length, 1);
  assert.strictEqual(diff.applications.updated[0].oldVersion, '14.0');
  assert.strictEqual(diff.applications.updated[0].newVersion, '15.0');
});

test('diffSetups handles empty setups', () => {
  const oldSetup = createEmptySetup();
  const newSetup = createEmptySetup();

  const diff = diffSetups(oldSetup, newSetup);
  assert.strictEqual(diff.applications.added.length, 0);
  assert.strictEqual(diff.applications.removed.length, 0);
  assert.strictEqual(diff.applications.updated.length, 0);
});
