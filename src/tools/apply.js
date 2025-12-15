#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const { exec, sanitizePackages } = require('../utils/exec');
const { validateSetup, isCompatibleVersion } = require('../utils/schema');
const { installMasApps, isMasInstalled } = require('../utils/mas');

function checkHomebrew() {
  console.log('Checking Homebrew installation...');
  const brewPath = exec('which brew', { silent: true, ignoreError: true });
  
  if (!brewPath) {
    console.log('Homebrew not found. Please install it first:');
    console.log('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
    return false;
  }
  
  console.log('Homebrew found\n');
  return true;
}

function installTaps(taps, dryRun = false) {
  if (taps.length === 0) return;

  console.log(`${dryRun ? 'Would install' : 'Installing'} ${taps.length} Homebrew taps...`);

  // Sanitize tap names
  const safeTaps = taps
    .map(tap => typeof tap === 'string' ? tap : tap.name)
    .filter(tap => /^[a-zA-Z0-9\-_\/]+$/.test(tap));

  if (safeTaps.length !== taps.length) {
    console.warn(`Warning: ${taps.length - safeTaps.length} invalid tap name(s) skipped`);
  }

  for (const tap of safeTaps) {
    console.log(`- ${dryRun ? 'Would tap' : 'Tapping'} ${tap}`);
    if (!dryRun) {
      exec(`brew tap ${tap}`, { ignoreError: true });
    }
  }
  console.log('');
}

function installFormulae(formulae, dryRun = false) {
  if (formulae.length === 0) return;

  console.log(`${dryRun ? 'Would install' : 'Installing'} ${formulae.length} Homebrew formulae...`);

  // Sanitize and batch packages
  const safeNames = sanitizePackages(formulae, 'Homebrew formulae');

  if (safeNames.length === 0) {
    console.warn('No valid formulae to install');
    return;
  }

  // Batch packages to avoid ARG_MAX limits (typical limit ~262KB)
  const BATCH_SIZE = 50;
  const batches = [];
  for (let i = 0; i < safeNames.length; i += BATCH_SIZE) {
    batches.push(safeNames.slice(i, i + BATCH_SIZE));
  }

  if (dryRun) {
    console.log(`Would install in ${batches.length} batch(es)`);
    console.log(`Packages: ${safeNames.slice(0, 10).join(', ')}${safeNames.length > 10 ? '...' : ''}`);
  } else {
    console.log('This may take a while...\n');
    for (let i = 0; i < batches.length; i++) {
      if (batches.length > 1) {
        console.log(`Installing batch ${i + 1}/${batches.length}...`);
      }
      exec(`brew install ${batches[i].join(' ')}`, { ignoreError: true });
    }
  }
  console.log('');
}

function installCasks(casks, dryRun = false) {
  if (casks.length === 0) return;

  console.log(`${dryRun ? 'Would install' : 'Installing'} ${casks.length} Homebrew casks...`);

  // Sanitize and batch packages
  const safeNames = sanitizePackages(casks, 'Homebrew casks');

  if (safeNames.length === 0) {
    console.warn('No valid casks to install');
    return;
  }

  // Batch packages to avoid ARG_MAX limits
  const BATCH_SIZE = 30; // Smaller batch for casks as they're larger
  const batches = [];
  for (let i = 0; i < safeNames.length; i += BATCH_SIZE) {
    batches.push(safeNames.slice(i, i + BATCH_SIZE));
  }

  if (dryRun) {
    console.log(`Would install in ${batches.length} batch(es)`);
    console.log(`Applications: ${safeNames.slice(0, 10).join(', ')}${safeNames.length > 10 ? '...' : ''}`);
  } else {
    console.log('This may take a while...\n');
    for (let i = 0; i < batches.length; i++) {
      if (batches.length > 1) {
        console.log(`Installing batch ${i + 1}/${batches.length}...`);
      }
      exec(`brew install --cask ${batches[i].join(' ')}`, { ignoreError: true });
    }
  }
  console.log('');
}

function reportManualInstalls(applications, casks) {
  const caskNames = new Set(casks.map(c => c.name.toLowerCase()));
  const manualInstalls = [];
  
  for (const app of applications) {
    const appName = app.name.replace('.app', '').toLowerCase();
    const likely = caskNames.has(appName) || 
                  caskNames.has(appName.replace(/\s+/g, '-')) ||
                  caskNames.has(appName.replace(/\s+/g, ''));
    
    if (!likely) {
      manualInstalls.push(app);
    }
  }
  
  if (manualInstalls.length > 0) {
    console.log('\nApplications that may require manual installation:');
    console.log('---------------------------------------------------');
    for (const app of manualInstalls) {
      console.log(`- ${app.name} (${app.version})`);
      if (app.bundleId !== 'unknown') {
        console.log(`  Bundle ID: ${app.bundleId}`);
      }
    }
    console.log('');
  }
}

function reportHomeBin(homeBin) {
  if (!homeBin || homeBin.length === 0) {
    console.log('\n~/bin: No files found');
    return;
  }
  
  console.log(`\n~/bin Contents (${homeBin.length} items):`);
  console.log('-------------------------------------------');
  
  const executables = homeBin.filter(f => f.type === 'file' && f.executable);
  const symlinks = homeBin.filter(f => f.type === 'symlink');
  const others = homeBin.filter(f => !f.executable && f.type === 'file');
  
  if (executables.length > 0) {
    console.log('\nExecutable scripts:');
    for (const file of executables) {
      console.log(`  - ${file.name} (${file.size} bytes)`);
    }
  }
  
  if (symlinks.length > 0) {
    console.log('\nSymlinks:');
    for (const file of symlinks) {
      console.log(`  - ${file.name} -> ${file.target}`);
    }
  }
  
  if (others.length > 0) {
    console.log('\nOther files:');
    for (const file of others) {
      console.log(`  - ${file.name}`);
    }
  }
  
  console.log('\nAction required: Restore or recreate these files manually');
  console.log('');
}

function reportGithubRepos(githubRepos) {
  if (!githubRepos || githubRepos.length === 0) {
    console.log('\n~/Documents/github: No repositories found');
    return;
  }
  
  console.log(`\nGitHub Repositories (${githubRepos.length} found):`);
  console.log('--------------------------------------------------');
  
  const gitRepos = githubRepos.filter(r => r.isGit);
  const nonGit = githubRepos.filter(r => !r.isGit);
  
  if (gitRepos.length > 0) {
    console.log('\nGit repositories:');
    for (const repo of gitRepos) {
      console.log(`  - ${repo.name}`);
      if (repo.remoteUrl) {
        console.log(`    Remote: ${repo.remoteUrl}`);
      }
      if (repo.branch) {
        console.log(`    Branch: ${repo.branch}`);
      }
      if (repo.hasUncommittedChanges) {
        console.log(`    Status: Has uncommitted changes`);
      }
    }
  }
  
  if (nonGit.length > 0) {
    console.log('\nNon-git directories:');
    for (const dir of nonGit) {
      console.log(`  - ${dir.name}`);
    }
  }
  
  console.log('\nAction required: Clone repositories to ~/Documents/github');
  console.log('');
}

function reportGlobalPackages(globalPackages, install = false, dryRun = false) {
  if (!globalPackages) {
    return;
  }
  
  const { npm = [], bun = [], dart = [], ruby = [] } = globalPackages;
  
  if (npm.length === 0 && bun.length === 0 && dart.length === 0 && ruby.length === 0) {
    console.log('\nGlobal Packages: None found');
    return;
  }
  
  console.log(`\nGlobal Packages:`);
  console.log('----------------');
  
  if (npm.length > 0) {
    console.log(`\nNPM global packages (${npm.length}):`);
    for (const pkg of npm) {
      console.log(`  - ${pkg.name}@${pkg.version}`);
    }
    
    if (install && dryRun) {
      console.log('\nWould install NPM global packages');
      const names = npm.map(p => p.name).join(' ');
      console.log(`Command: npm install -g ${names}`);
    } else if (install) {
      console.log('\nInstalling NPM global packages...');
      const names = npm.map(p => p.name).join(' ');
      exec(`npm install -g ${names}`, { ignoreError: true });
    } else {
      console.log('\nTo install: npm install -g ' + npm.map(p => p.name).join(' '));
    }
  }
  
  if (bun.length > 0) {
    console.log(`\nBun global packages (${bun.length}):`);
    for (const pkg of bun) {
      console.log(`  - ${pkg.name}@${pkg.version}`);
    }
    
    if (install && dryRun) {
      console.log('\nWould install Bun global packages');
      const names = bun.map(p => p.name).join(' ');
      console.log(`Command: bun install -g ${names}`);
    } else if (install) {
      console.log('\nInstalling Bun global packages...');
      const names = bun.map(p => p.name).join(' ');
      exec(`bun install -g ${names}`, { ignoreError: true });
    } else {
      console.log('\nTo install: bun install -g ' + bun.map(p => p.name).join(' '));
    }
  }
  
  if (dart.length > 0) {
    console.log(`\nDart global packages (${dart.length}):`);
    for (const pkg of dart) {
      console.log(`  - ${pkg.name} ${pkg.version}`);
    }
    
    if (install && dryRun) {
      console.log('\nWould install Dart global packages');
      for (const pkg of dart) {
        console.log(`Command: dart pub global activate ${pkg.name}`);
      }
    } else if (install) {
      console.log('\nInstalling Dart global packages...');
      for (const pkg of dart) {
        exec(`dart pub global activate ${pkg.name}`, { ignoreError: true });
      }
    } else {
      console.log('\nTo install: dart pub global activate <package_name>');
    }
  }
  
  if (ruby.length > 0) {
    console.log(`\nRuby gems (${ruby.length}):`);
    for (const pkg of ruby) {
      console.log(`  - ${pkg.name} (${pkg.version})`);
    }
    
    if (install && dryRun) {
      console.log('\nWould install Ruby gems');
      const names = ruby.map(p => p.name).join(' ');
      console.log(`Command: gem install ${names}`);
    } else if (install) {
      console.log('\nInstalling Ruby gems...');
      const names = ruby.map(p => p.name).join(' ');
      exec(`gem install ${names}`, { ignoreError: true });
    } else {
      console.log('\nTo install: gem install ' + ruby.map(p => p.name).join(' '));
    }
  }
  
  console.log('');
}

function reportShellConfigs(shellConfigs) {
  if (!shellConfigs || shellConfigs.length === 0) {
    console.log('\nShell Configuration: No files found');
    return;
  }
  
  console.log(`\nShell Configuration Files (${shellConfigs.length} found):`);
  console.log('-------------------------------------------------------');
  
  for (const config of shellConfigs) {
    console.log(`  - ${config.name} (${config.lines} lines, ${config.size} bytes)`);
  }
  
  console.log('\nAction required: Restore shell configuration files from backup');
  console.log('These files are included in the JSON for reference');
  console.log('');
}

function reportGitConfig(gitConfig) {
  if (!gitConfig) {
    return;
  }
  
  console.log(`\nGit Configuration:`);
  console.log('------------------');
  
  if (gitConfig.user.name || gitConfig.user.email) {
    console.log('\nUser:');
    if (gitConfig.user.name) console.log(`  Name: ${gitConfig.user.name}`);
    if (gitConfig.user.email) console.log(`  Email: ${gitConfig.user.email}`);
  }
  
  if (gitConfig.globalGitignore) {
    console.log('\nGlobal gitignore: Present in JSON');
  }
  
  console.log(`\nTotal config entries: ${gitConfig.settings.length}`);
  console.log('\nAction required: Review and restore git configuration');
  console.log('Run: git config --global user.name "Your Name"');
  console.log('     git config --global user.email "your@email.com"');
  console.log('');
}

function reportVersionManagers(versionManagers) {
  if (!versionManagers) {
    return;
  }
  
  const { nvm, pyenv, rbenv } = versionManagers;
  const hasAny = nvm.installed || pyenv.installed || rbenv.installed;
  
  if (!hasAny) {
    console.log('\nVersion Managers: None found');
    return;
  }
  
  console.log(`\nVersion Managers:`);
  console.log('-----------------');
  
  if (nvm.installed) {
    console.log(`\nnvm (Node Version Manager):`);
    console.log(`  Installed versions: ${nvm.versions.join(', ') || 'none'}`);
    console.log(`  To install: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`);
  }
  
  if (pyenv.installed) {
    console.log(`\npyenv (Python Version Manager):`);
    console.log(`  Installed versions: ${pyenv.versions.join(', ') || 'none'}`);
    console.log(`  To install: brew install pyenv`);
  }
  
  if (rbenv.installed) {
    console.log(`\nrbenv (Ruby Version Manager):`);
    console.log(`  Installed versions: ${rbenv.versions.join(', ') || 'none'}`);
    console.log(`  To install: brew install rbenv`);
  }
  
  console.log('');
}

function reportMenuBarConfiguration(menubarConfig) {
  if (!menubarConfig) {
    return;
  }
  
  console.log(`\nMenu Bar Configuration:`);
  console.log('-----------------------');
  
  if (menubarConfig.loginItems && menubarConfig.loginItems.length > 0) {
    console.log(`\nLogin Items (${menubarConfig.loginItems.length}):`);
    console.log('Applications that start automatically at login:');
    for (const item of menubarConfig.loginItems) {
      console.log(`  - ${item}`);
    }
  }
  
  if (menubarConfig.runningApps && menubarConfig.runningApps.length > 0) {
    console.log(`\nRunning Menu Bar Apps (${menubarConfig.runningApps.length}):`);
    console.log('Apps that were running (often have menu bar items):');
    const displayed = menubarConfig.runningApps.slice(0, 15);
    for (const app of displayed) {
      console.log(`  - ${app}`);
    }
    if (menubarConfig.runningApps.length > 15) {
      console.log(`  ... and ${menubarConfig.runningApps.length - 15} more`);
    }
  }
  
  if (menubarConfig.launchAgents && menubarConfig.launchAgents.length > 0) {
    console.log(`\nLaunch Agents (${menubarConfig.launchAgents.length}):`);
    console.log('System services and background processes:');
    
    const userAgents = menubarConfig.launchAgents.filter(a => a.location === 'user');
    const systemAgents = menubarConfig.launchAgents.filter(a => a.location === 'system');
    
    if (userAgents.length > 0) {
      console.log(`\n  User agents (${userAgents.length}):`);
      for (const agent of userAgents.slice(0, 10)) {
        console.log(`    - ${agent.label}`);
      }
      if (userAgents.length > 10) {
        console.log(`    ... and ${userAgents.length - 10} more`);
      }
    }
    
    if (systemAgents.length > 0) {
      console.log(`\n  System agents (${systemAgents.length}):`);
      for (const agent of systemAgents.slice(0, 5)) {
        console.log(`    - ${agent.label}`);
      }
      if (systemAgents.length > 5) {
        console.log(`    ... and ${systemAgents.length - 5} more`);
      }
    }
  }
  
  console.log('\nAction required: Review login items and launch agents');
  console.log('To manage login items: System Settings > General > Login Items');
  console.log('Launch agents can be managed with: launchctl list');
  console.log('');
}

function reportMenubarConfig(menubarConfig) {
  if (!menubarConfig) {
    return;
  }
  
  const { loginItems, runningApps, launchAgents } = menubarConfig;
  
  console.log(`\nMenubar & Startup Configuration:`);
  console.log('--------------------------------');
  
  if (loginItems.length > 0) {
    console.log(`\nLogin Items (${loginItems.length}):`);
    console.log('These apps start automatically at login');
    for (const item of loginItems) {
      console.log(`  - ${item}`);
    }
  }
  
  if (runningApps.length > 0) {
    console.log(`\nRunning Menubar Apps (${runningApps.length}):`);
    console.log('Currently running apps (may include menubar items)');
    const displayApps = runningApps.slice(0, 20);
    for (const app of displayApps) {
      console.log(`  - ${app}`);
    }
    if (runningApps.length > 20) {
      console.log(`  ... and ${runningApps.length - 20} more`);
    }
  }
  
  if (launchAgents.length > 0) {
    console.log(`\nLaunch Agents (${launchAgents.length}):`);
    console.log('Background services and menubar apps');
    
    const userAgents = launchAgents.filter(a => a.location === 'user');
    const systemAgents = launchAgents.filter(a => a.location === 'system');
    
    if (userAgents.length > 0) {
      console.log(`\n  User Launch Agents (${userAgents.length}):`);
      for (const agent of userAgents) {
        console.log(`    - ${agent.name}`);
        console.log(`      Label: ${agent.label}`);
      }
    }
    
    if (systemAgents.length > 0) {
      console.log(`\n  System Launch Agents (${systemAgents.length}):`);
      for (const agent of systemAgents) {
        console.log(`    - ${agent.name}`);
      }
    }
  }
  
  console.log('\nAction required:');
  console.log('- Review login items in System Settings > General > Login Items');
  console.log('- Reinstall menubar apps from the applications list');
  console.log('- Launch agents will be restored if their parent apps are installed');
  console.log('');
}

function main() {
  const args = process.argv.slice(2);

  let setupFile = null;
  let installGlobalPackages = false;
  let installMas = false;
  let dryRun = false;
  let verify = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--install-global-packages') {
      installGlobalPackages = true;
    } else if (args[i] === '--install-mas') {
      installMas = true;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--verify') {
      verify = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node apply.js <mac-setup.json> [options]');
      console.log('');
      console.log('Options:');
      console.log('  --install-global-packages  Automatically install npm, bun, dart, ruby packages');
      console.log('  --install-mas              Automatically install Mac App Store apps (requires mas CLI)');
      console.log('  --dry-run                  Show what would be done without making changes');
      console.log('  --verify                   Verify installations after applying');
      console.log('  --help, -h                 Show this help message');
      process.exit(0);
    } else if (!setupFile) {
      setupFile = args[i];
    }
  }

  if (!setupFile) {
    console.error('Usage: node apply.js <mac-setup.json> [options]');
    console.error('');
    console.error('Run with --help for more information');
    process.exit(1);
  }

  if (!fs.existsSync(setupFile)) {
    console.error(`File not found: ${setupFile}`);
    process.exit(1);
  }

  let setup;
  try {
    setup = JSON.parse(fs.readFileSync(setupFile, 'utf8'));
  } catch (error) {
    console.error(`Error parsing JSON file: ${error.message}`);
    process.exit(1);
  }

  // Validate setup JSON
  const validation = validateSetup(setup);
  if (!validation.valid) {
    console.error('Invalid setup file:');
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Check version compatibility
  if (!isCompatibleVersion(setup)) {
    console.warn(`Warning: Setup file version ${setup.version || '1.0'} may not be fully compatible`);
    console.warn('Consider re-capturing your setup with the latest version');
  }

  console.log('Mac Setup Restore Tool');
  console.log('======================\n');

  if (dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***\n');
  }

  console.log(`Source system: ${setup.system.hostname}`);
  console.log(`macOS version: ${setup.system.macosVersion}`);
  console.log(`Captured: ${setup.system.captureDate}`);
  if (setup.version) {
    console.log(`Setup version: ${setup.version}`);
  }
  console.log('');

  if (!dryRun && !checkHomebrew()) {
    process.exit(1);
  }

  console.log(dryRun ? 'Would install...\n' : 'Starting installation...\n');

  installTaps(setup.homebrew.taps, dryRun);
  installFormulae(setup.homebrew.formulae, dryRun);
  installCasks(setup.homebrew.casks, dryRun);

  // Install Mac App Store apps if requested
  if (setup.masApps && setup.masApps.length > 0 && installMas) {
    console.log('\n=== Mac App Store Apps ===\n');
    const result = installMasApps(setup.masApps, dryRun);
    if (!dryRun) {
      console.log(`\nMAS Installation: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`);
    }
  } else if (setup.masApps && setup.masApps.length > 0) {
    console.log('\n=== Mac App Store Apps ===');
    console.log(`Found ${setup.masApps.length} MAS app(s)`);
    console.log('To install automatically, re-run with --install-mas flag');
    console.log('(Requires mas CLI: brew install mas)\n');
  }

  // Verify installations if requested
  if (verify && !dryRun) {
    console.log('\n=== Verifying Installations ===\n');
    verifyInstallations(setup);
  }

  reportManualInstalls(setup.applications, setup.homebrew.casks);
  reportHomeBin(setup.homeBin);
  reportGithubRepos(setup.githubRepos);
  reportGlobalPackages(setup.globalPackages, installGlobalPackages && !dryRun, dryRun);
  reportShellConfigs(setup.shellConfigs);
  reportGitConfig(setup.gitConfig);
  reportVersionManagers(setup.versionManagers);
  reportMenubarConfig(setup.menubarConfig);

  if (dryRun) {
    console.log('\n*** DRY RUN COMPLETE - No changes were made ***');
    console.log('\nTo actually perform the restore, run without --dry-run flag');
  } else {
    console.log('\n=== Restore process completed ===');
  }

  console.log('\nRecommended next steps:');
  console.log('1. Check manual installation list above');
  console.log('2. Restore ~/bin scripts and set permissions');
  console.log('3. Clone GitHub repositories');
  console.log('4. Restore shell configuration files');
  console.log('5. Configure git user name and email');
  console.log('6. Review and restore login items');
  if (!installGlobalPackages && setup.globalPackages &&
      (setup.globalPackages.npm.length > 0 || setup.globalPackages.bun.length > 0 ||
       setup.globalPackages.dart.length > 0 || setup.globalPackages.ruby.length > 0)) {
    console.log('7. Install global packages (or re-run with --install-global-packages)');
    console.log('8. Install version managers if needed');
    console.log('9. Run: brew cleanup');
    console.log('10. Sign in to applications that require authentication');
    console.log('11. Restore application preferences if needed');
  } else {
    console.log('7. Install version managers if needed');
    console.log('8. Run: brew cleanup');
    console.log('9. Sign in to applications that require authentication');
    console.log('10. Restore application preferences if needed');
  }
}

function verifyInstallations(setup) {
  const { execSync } = require('child_process');

  let verified = 0;
  let failed = 0;

  console.log('Verifying Homebrew formulae...');
  for (const formula of setup.homebrew.formulae.slice(0, 10)) {
    try {
      execSync(`brew list ${formula.name}`, { stdio: 'ignore' });
      verified++;
    } catch (error) {
      console.log(`  ✗ ${formula.name} not found`);
      failed++;
    }
  }

  console.log('Verifying Homebrew casks...');
  for (const cask of setup.homebrew.casks.slice(0, 10)) {
    try {
      execSync(`brew list --cask ${cask.name}`, { stdio: 'ignore' });
      verified++;
    } catch (error) {
      console.log(`  ✗ ${cask.name} not found`);
      failed++;
    }
  }

  console.log(`\nVerification complete: ${verified} verified, ${failed} failed`);
  if (failed > 0) {
    console.log('Some packages failed to install. Check the logs above for details.');
  }
}

main();
