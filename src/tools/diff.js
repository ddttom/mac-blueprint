#!/usr/bin/env node

const fs = require('fs');
const { diffSetups } = require('../utils/schema');

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    console.log('Usage: node diff.js <old-setup.json> <new-setup.json> [options]');
    console.log('');
    console.log('Compare two mac-setup.json files to see what changed');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('');
    console.log('Example:');
    console.log('  node diff.js mac-setup-2024-01.json mac-setup-2024-12.json');
    process.exit(0);
  }

  const oldFile = args[0];
  const newFile = args[1];

  if (!fs.existsSync(oldFile)) {
    console.error(`File not found: ${oldFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(newFile)) {
    console.error(`File not found: ${newFile}`);
    process.exit(1);
  }

  let oldSetup, newSetup;

  try {
    oldSetup = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
  } catch (error) {
    console.error(`Error parsing ${oldFile}: ${error.message}`);
    process.exit(1);
  }

  try {
    newSetup = JSON.parse(fs.readFileSync(newFile, 'utf8'));
  } catch (error) {
    console.error(`Error parsing ${newFile}: ${error.message}`);
    process.exit(1);
  }

  console.log('Mac Setup Diff Tool');
  console.log('===================\n');
  console.log(`Old: ${oldSetup.system.hostname} (captured ${oldSetup.system.captureDate})`);
  console.log(`New: ${newSetup.system.hostname} (captured ${newSetup.system.captureDate})`);
  console.log('');

  const diff = diffSetups(oldSetup, newSetup);

  // Applications
  if (diff.applications.added.length > 0 || diff.applications.removed.length > 0 || diff.applications.updated.length > 0) {
    console.log('Applications:');
    console.log('-------------');

    if (diff.applications.added.length > 0) {
      console.log(`\n✓ Added (${diff.applications.added.length}):`);
      for (const app of diff.applications.added) {
        console.log(`  + ${app.name} (${app.version})`);
      }
    }

    if (diff.applications.removed.length > 0) {
      console.log(`\n✗ Removed (${diff.applications.removed.length}):`);
      for (const app of diff.applications.removed) {
        console.log(`  - ${app.name} (${app.version})`);
      }
    }

    if (diff.applications.updated.length > 0) {
      console.log(`\n↑ Updated (${diff.applications.updated.length}):`);
      for (const app of diff.applications.updated) {
        console.log(`  ↑ ${app.name}: ${app.oldVersion} → ${app.newVersion}`);
      }
    }
    console.log('');
  }

  // Homebrew
  const hasHomebrewChanges =
    diff.homebrew.formulae.added.length > 0 || diff.homebrew.formulae.removed.length > 0 ||
    diff.homebrew.casks.added.length > 0 || diff.homebrew.casks.removed.length > 0 ||
    diff.homebrew.taps.added.length > 0 || diff.homebrew.taps.removed.length > 0;

  if (hasHomebrewChanges) {
    console.log('Homebrew:');
    console.log('---------');

    // Taps
    if (diff.homebrew.taps.added.length > 0) {
      console.log(`\n✓ Taps Added (${diff.homebrew.taps.added.length}):`);
      for (const tap of diff.homebrew.taps.added) {
        console.log(`  + ${tap}`);
      }
    }

    if (diff.homebrew.taps.removed.length > 0) {
      console.log(`\n✗ Taps Removed (${diff.homebrew.taps.removed.length}):`);
      for (const tap of diff.homebrew.taps.removed) {
        console.log(`  - ${tap}`);
      }
    }

    // Formulae
    if (diff.homebrew.formulae.added.length > 0) {
      console.log(`\n✓ Formulae Added (${diff.homebrew.formulae.added.length}):`);
      for (const formula of diff.homebrew.formulae.added) {
        console.log(`  + ${formula}`);
      }
    }

    if (diff.homebrew.formulae.removed.length > 0) {
      console.log(`\n✗ Formulae Removed (${diff.homebrew.formulae.removed.length}):`);
      for (const formula of diff.homebrew.formulae.removed) {
        console.log(`  - ${formula}`);
      }
    }

    // Casks
    if (diff.homebrew.casks.added.length > 0) {
      console.log(`\n✓ Casks Added (${diff.homebrew.casks.added.length}):`);
      for (const cask of diff.homebrew.casks.added) {
        console.log(`  + ${cask}`);
      }
    }

    if (diff.homebrew.casks.removed.length > 0) {
      console.log(`\n✗ Casks Removed (${diff.homebrew.casks.removed.length}):`);
      for (const cask of diff.homebrew.casks.removed) {
        console.log(`  - ${cask}`);
      }
    }
    console.log('');
  }

  // Global Packages
  const hasPackageChanges =
    diff.globalPackages.npm.added.length > 0 || diff.globalPackages.npm.removed.length > 0 ||
    diff.globalPackages.bun.added.length > 0 || diff.globalPackages.bun.removed.length > 0 ||
    diff.globalPackages.dart.added.length > 0 || diff.globalPackages.dart.removed.length > 0 ||
    diff.globalPackages.ruby.added.length > 0 || diff.globalPackages.ruby.removed.length > 0;

  if (hasPackageChanges) {
    console.log('Global Packages:');
    console.log('----------------');

    for (const manager of ['npm', 'bun', 'dart', 'ruby']) {
      const added = diff.globalPackages[manager].added;
      const removed = diff.globalPackages[manager].removed;

      if (added.length > 0 || removed.length > 0) {
        console.log(`\n${manager.toUpperCase()}:`);

        if (added.length > 0) {
          console.log(`  ✓ Added (${added.length}):`);
          for (const pkg of added) {
            console.log(`    + ${pkg}`);
          }
        }

        if (removed.length > 0) {
          console.log(`  ✗ Removed (${removed.length}):`);
          for (const pkg of removed) {
            console.log(`    - ${pkg}`);
          }
        }
      }
    }
    console.log('');
  }

  // Summary
  const totalAdded =
    diff.applications.added.length +
    diff.homebrew.formulae.added.length +
    diff.homebrew.casks.added.length +
    diff.homebrew.taps.added.length +
    diff.globalPackages.npm.added.length +
    diff.globalPackages.bun.added.length +
    diff.globalPackages.dart.added.length +
    diff.globalPackages.ruby.added.length;

  const totalRemoved =
    diff.applications.removed.length +
    diff.homebrew.formulae.removed.length +
    diff.homebrew.casks.removed.length +
    diff.homebrew.taps.removed.length +
    diff.globalPackages.npm.removed.length +
    diff.globalPackages.bun.removed.length +
    diff.globalPackages.dart.removed.length +
    diff.globalPackages.ruby.removed.length;

  const totalUpdated = diff.applications.updated.length;

  console.log('Summary:');
  console.log('--------');
  console.log(`✓ Added:   ${totalAdded}`);
  console.log(`✗ Removed: ${totalRemoved}`);
  console.log(`↑ Updated: ${totalUpdated}`);
  console.log(`  Total changes: ${totalAdded + totalRemoved + totalUpdated}`);
}

main();
