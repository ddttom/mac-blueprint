#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { execSilent, detectSecrets } = require('../utils/exec');
const { SCHEMA_VERSION, createEmptySetup } = require('../utils/schema');
const { getMasApps, isMasInstalled } = require('../utils/mas');

// Track errors during capture for summary
const captureErrors = [];

function exec(command) {
  const result = execSilent(command);
  if (result === null) {
    captureErrors.push({ command, reason: 'Command failed or tool not installed' });
  }
  return result;
}

function getApplications() {
  const apps = [];
  const appsDir = '/Applications';
  
  try {
    const files = fs.readdirSync(appsDir);
    for (const file of files) {
      if (file.endsWith('.app')) {
        const appPath = path.join(appsDir, file);
        const plistPath = path.join(appPath, 'Contents/Info.plist');
        
        let version = 'unknown';
        let bundleId = 'unknown';
        
        if (fs.existsSync(plistPath)) {
          const versionCmd = `/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "${plistPath}" 2>/dev/null`;
          const bundleCmd = `/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "${plistPath}" 2>/dev/null`;
          
          version = exec(versionCmd) || 'unknown';
          bundleId = exec(bundleCmd) || 'unknown';
        }
        
        apps.push({
          name: file,
          path: appPath,
          version: version,
          bundleId: bundleId
        });
      }
    }
  } catch (error) {
    console.error('Error reading applications:', error.message);
  }
  
  return apps;
}

function getHomebrewCasks() {
  const casks = [];
  const output = exec('brew list --cask --versions 2>/dev/null');
  
  if (output) {
    const lines = output.split('\n');
    for (const line of lines) {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        casks.push({
          name: parts[0],
          version: parts.slice(1).join(' ')
        });
      }
    }
  }
  
  return casks;
}

function getHomebrewFormulae() {
  const formulae = [];
  const output = exec('brew list --formula --versions 2>/dev/null');
  
  if (output) {
    const lines = output.split('\n');
    for (const line of lines) {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        formulae.push({
          name: parts[0],
          version: parts.slice(1).join(' ')
        });
      }
    }
  }
  
  return formulae;
}

function getHomebrewTaps() {
  const taps = [];
  const output = exec('brew tap 2>/dev/null');
  
  if (output) {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        taps.push(line.trim());
      }
    }
  }
  
  return taps;
}

function getBinaries() {
  const binaries = [];
  const paths = ['/usr/local/bin', '/opt/homebrew/bin'];
  
  for (const binPath of paths) {
    if (fs.existsSync(binPath)) {
      try {
        const files = fs.readdirSync(binPath);
        for (const file of files) {
          const fullPath = path.join(binPath, file);
          const stats = fs.lstatSync(fullPath);
          
          if (stats.isSymbolicLink()) {
            const target = fs.readlinkSync(fullPath);
            binaries.push({
              name: file,
              path: fullPath,
              type: 'symlink',
              target: target
            });
          } else if (stats.isFile() && (stats.mode & 0o111)) {
            binaries.push({
              name: file,
              path: fullPath,
              type: 'executable'
            });
          }
        }
      } catch (error) {
        console.error(`Error reading ${binPath}:`, error.message);
      }
    }
  }
  
  return binaries;
}

function getHomeBinaries() {
  const binaries = [];
  const homeBin = path.join(process.env.HOME, 'bin');
  
  if (!fs.existsSync(homeBin)) {
    return binaries;
  }
  
  try {
    const files = fs.readdirSync(homeBin);
    for (const file of files) {
      const fullPath = path.join(homeBin, file);
      const stats = fs.lstatSync(fullPath);
      
      let fileInfo = {
        name: file,
        path: fullPath
      };
      
      if (stats.isSymbolicLink()) {
        const target = fs.readlinkSync(fullPath);
        fileInfo.type = 'symlink';
        fileInfo.target = target;
      } else if (stats.isFile()) {
        fileInfo.type = 'file';
        fileInfo.executable = !!(stats.mode & 0o111);
        fileInfo.size = stats.size;
      } else if (stats.isDirectory()) {
        fileInfo.type = 'directory';
      }
      
      binaries.push(fileInfo);
    }
  } catch (error) {
    console.error(`Error reading ~/bin:`, error.message);
  }
  
  return binaries;
}

function getGithubRepositories() {
  const repos = [];
  const githubPath = path.join(process.env.HOME, 'Documents', 'github');
  
  if (!fs.existsSync(githubPath)) {
    return repos;
  }
  
  try {
    const entries = fs.readdirSync(githubPath);
    for (const entry of entries) {
      const fullPath = path.join(githubPath, entry);
      const stats = fs.lstatSync(fullPath);
      
      if (stats.isDirectory() && !entry.startsWith('.')) {
        let repoInfo = {
          name: entry,
          path: fullPath
        };
        
        // Check if it's a git repository
        const gitPath = path.join(fullPath, '.git');
        if (fs.existsSync(gitPath)) {
          repoInfo.isGit = true;
          
          // Try to get remote URL
          const remoteUrl = exec(`cd "${fullPath}" && git config --get remote.origin.url 2>/dev/null`);
          if (remoteUrl) {
            repoInfo.remoteUrl = remoteUrl;
          }
          
          // Get current branch
          const branch = exec(`cd "${fullPath}" && git branch --show-current 2>/dev/null`);
          if (branch) {
            repoInfo.branch = branch;
          }
          
          // Check for uncommitted changes
          const status = exec(`cd "${fullPath}" && git status --porcelain 2>/dev/null`);
          repoInfo.hasUncommittedChanges = status ? status.length > 0 : false;
        } else {
          repoInfo.isGit = false;
        }
        
        repos.push(repoInfo);
      }
    }
  } catch (error) {
    console.error(`Error reading ~/Documents/github:`, error.message);
  }
  
  return repos;
}

function getGlobalPackages() {
  const packages = {
    npm: [],
    bun: [],
    dart: [],
    ruby: []
  };
  
  // Get npm global packages
  const npmOutput = exec('npm list -g --depth=0 --json 2>/dev/null');
  if (npmOutput) {
    try {
      const npmData = JSON.parse(npmOutput);
      if (npmData.dependencies) {
        for (const [name, info] of Object.entries(npmData.dependencies)) {
          packages.npm.push({
            name: name,
            version: info.version || 'unknown'
          });
        }
      }
    } catch (error) {
      console.error('Error parsing npm packages:', error.message);
    }
  }
  
  // Get bun global packages
  const bunOutput = exec('bun pm ls -g 2>/dev/null');
  if (bunOutput) {
    const lines = bunOutput.split('\n');
    for (const line of lines) {
      // Parse lines like "package-name@1.2.3"
      const match = line.trim().match(/^(.+?)@(.+)$/);
      if (match) {
        packages.bun.push({
          name: match[1],
          version: match[2]
        });
      }
    }
  }
  
  // Get dart global packages
  const dartOutput = exec('dart pub global list 2>/dev/null');
  if (dartOutput) {
    const lines = dartOutput.split('\n');
    for (const line of lines) {
      // Parse lines like "package_name 1.2.3"
      const match = line.trim().match(/^(\S+)\s+(.+)$/);
      if (match) {
        packages.dart.push({
          name: match[1],
          version: match[2]
        });
      }
    }
  }
  
  // Get ruby gems
  const rubyOutput = exec('gem list 2>/dev/null');
  if (rubyOutput) {
    const lines = rubyOutput.split('\n');
    for (const line of lines) {
      // Parse lines like "gem_name (1.2.3, 1.2.2)"
      const match = line.trim().match(/^(\S+)\s+\((.+?)\)/);
      if (match) {
        packages.ruby.push({
          name: match[1],
          version: match[2]
        });
      }
    }
  }
  
  return packages;
}

function getShellConfigs() {
  const configs = [];
  const configFiles = [
    '.zshrc',
    '.bashrc',
    '.bash_profile',
    '.profile',
    '.zshenv',
    '.config/fish/config.fish'
  ];
  
  for (const configFile of configFiles) {
    const fullPath = path.join(process.env.HOME, configFile);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const stats = fs.statSync(fullPath);
        configs.push({
          name: configFile,
          path: fullPath,
          size: stats.size,
          lines: content.split('\n').length,
          content: content
        });
      } catch (error) {
        console.error(`Error reading ${configFile}:`, error.message);
      }
    }
  }
  
  return configs;
}

function getGitConfig() {
  const config = {
    user: {},
    settings: []
  };
  
  // Get user name and email
  const userName = exec('git config --global user.name 2>/dev/null');
  const userEmail = exec('git config --global user.email 2>/dev/null');
  
  if (userName) config.user.name = userName;
  if (userEmail) config.user.email = userEmail;
  
  // Get all global config
  const configOutput = exec('git config --global --list 2>/dev/null');
  if (configOutput) {
    const lines = configOutput.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        config.settings.push({
          key: key.trim(),
          value: value
        });
      }
    }
  }
  
  // Check for .gitignore_global
  const gitignorePath = path.join(process.env.HOME, '.gitignore_global');
  if (fs.existsSync(gitignorePath)) {
    try {
      config.globalGitignore = fs.readFileSync(gitignorePath, 'utf8');
    } catch (error) {
      console.error('Error reading .gitignore_global:', error.message);
    }
  }
  
  return config;
}

function getVersionManagers() {
  const managers = {
    nvm: { installed: false, versions: [] },
    pyenv: { installed: false, versions: [] },
    rbenv: { installed: false, versions: [] }
  };
  
  // Check nvm
  const nvmDir = path.join(process.env.HOME, '.nvm');
  if (fs.existsSync(nvmDir)) {
    managers.nvm.installed = true;
    const nvmOutput = exec('bash -c "source ~/.nvm/nvm.sh && nvm list" 2>/dev/null');
    if (nvmOutput) {
      const lines = nvmOutput.split('\n');
      for (const line of lines) {
        const match = line.match(/v(\d+\.\d+\.\d+)/);
        if (match) {
          managers.nvm.versions.push(match[1]);
        }
      }
    }
  }
  
  // Check pyenv
  const pyenvOutput = exec('pyenv versions 2>/dev/null');
  if (pyenvOutput) {
    managers.pyenv.installed = true;
    const lines = pyenvOutput.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^\*?\s*(\d+\.\d+\.\d+)/);
      if (match) {
        managers.pyenv.versions.push(match[1]);
      }
    }
  }
  
  // Check rbenv
  const rbenvOutput = exec('rbenv versions 2>/dev/null');
  if (rbenvOutput) {
    managers.rbenv.installed = true;
    const lines = rbenvOutput.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^\*?\s*(\d+\.\d+\.\d+)/);
      if (match) {
        managers.rbenv.versions.push(match[1]);
      }
    }
  }
  
  return managers;
}

function getMenubarConfiguration() {
  const menubar = {
    loginItems: [],
    runningApps: [],
    launchAgents: []
  };
  
  // Get login items using osascript
  const loginItemsOutput = exec('osascript -e \'tell application "System Events" to get the name of every login item\' 2>/dev/null');
  if (loginItemsOutput) {
    const items = loginItemsOutput.split(', ');
    for (const item of items) {
      if (item.trim()) {
        menubar.loginItems.push(item.trim());
      }
    }
  }
  
  // Get running apps that might be menubar apps
  const psOutput = exec('ps aux | grep -i "\.app/Contents/MacOS" | grep -v grep 2>/dev/null');
  if (psOutput) {
    const lines = psOutput.split('\n');
    const appSet = new Set();
    
    for (const line of lines) {
      const match = line.match(/([^\/]+)\.app\/Contents\/MacOS/);
      if (match) {
        const appName = match[1];
        // Filter out main system apps
        if (!['Finder', 'Dock', 'SystemUIServer', 'WindowServer'].includes(appName)) {
          appSet.add(appName);
        }
      }
    }
    
    menubar.runningApps = Array.from(appSet).sort();
  }
  
  // Get Launch Agents (both user and system)
  const launchAgentsPaths = [
    path.join(process.env.HOME, 'Library/LaunchAgents'),
    '/Library/LaunchAgents'
  ];
  
  for (const agentPath of launchAgentsPaths) {
    if (fs.existsSync(agentPath)) {
      try {
        const files = fs.readdirSync(agentPath);
        for (const file of files) {
          if (file.endsWith('.plist')) {
            const fullPath = path.join(agentPath, file);
            const stats = fs.statSync(fullPath);
            
            // Try to get label from plist
            let label = file.replace('.plist', '');
            const labelCmd = `/usr/libexec/PlistBuddy -c "Print Label" "${fullPath}" 2>/dev/null`;
            const plistLabel = exec(labelCmd);
            
            menubar.launchAgents.push({
              name: file,
              path: fullPath,
              label: plistLabel || label,
              location: agentPath === path.join(process.env.HOME, 'Library/LaunchAgents') ? 'user' : 'system',
              size: stats.size
            });
          }
        }
      } catch (error) {
        console.error(`Error reading ${agentPath}:`, error.message);
      }
    }
  }
  
  return menubar;
}

function getSystemInfo() {
  return {
    hostname: exec('hostname') || 'unknown',
    macosVersion: exec('sw_vers -productVersion') || 'unknown',
    architecture: exec('uname -m') || 'unknown',
    homebrewVersion: exec('brew --version 2>/dev/null')?.split('\n')[0] || 'not installed',
    captureDate: new Date().toISOString()
  };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const redact = args.includes('--redact-secrets');
  const verbose = args.includes('--verbose');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node capture.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run         Preview capture without creating file');
    console.log('  --redact-secrets  Redact potential secrets from shell configs');
    console.log('  --verbose         Show detailed error information');
    console.log('  --help, -h        Show this help message');
    process.exit(0);
  }

  if (dryRun) {
    console.log('DRY RUN MODE - No files will be created\n');
  }

  if (redact) {
    console.log('SECRET REDACTION ENABLED - Sensitive data will be removed\n');
  }

  console.log('Inspecting Mac setup...\n');

  const setup = {
    version: SCHEMA_VERSION,
    system: getSystemInfo(),
    applications: getApplications(),
    masApps: getMasApps(),
    homebrew: {
      taps: getHomebrewTaps(),
      casks: getHomebrewCasks(),
      formulae: getHomebrewFormulae()
    },
    binaries: getBinaries(),
    homeBin: getHomeBinaries(),
    githubRepos: getGithubRepositories(),
    globalPackages: getGlobalPackages(),
    shellConfigs: getShellConfigs(),
    gitConfig: getGitConfig(),
    versionManagers: getVersionManagers(),
    menubarConfig: getMenubarConfiguration()
  };

  console.log(`System information ${dryRun ? 'found' : 'captured'}`);
  console.log(`- Applications: ${setup.applications.length}`);
  if (isMasInstalled()) {
    console.log(`- Mac App Store apps: ${setup.masApps.length}`);
  } else {
    console.log(`- Mac App Store apps: N/A (install 'mas' CLI: brew install mas)`);
  }
  console.log(`- Homebrew casks: ${setup.homebrew.casks.length}`);
  console.log(`- Homebrew formulae: ${setup.homebrew.formulae.length}`);
  console.log(`- Homebrew taps: ${setup.homebrew.taps.length}`);
  console.log(`- Binaries: ${setup.binaries.length}`);
  console.log(`- ~/bin files: ${setup.homeBin.length}`);
  console.log(`- GitHub repositories: ${setup.githubRepos.length}`);
  console.log(`- NPM global packages: ${setup.globalPackages.npm.length}`);
  console.log(`- Bun global packages: ${setup.globalPackages.bun.length}`);
  console.log(`- Dart global packages: ${setup.globalPackages.dart.length}`);
  console.log(`- Ruby gems: ${setup.globalPackages.ruby.length}`);
  console.log(`- Shell config files: ${setup.shellConfigs.length}`);
  console.log(`- Git config entries: ${setup.gitConfig.settings.length}`);
  console.log(`- Login items: ${setup.menubarConfig.loginItems.length}`);
  console.log(`- Running menubar apps: ${setup.menubarConfig.runningApps.length}`);
  console.log(`- Launch agents: ${setup.menubarConfig.launchAgents.length}`);

  // Check for secrets in shell configs
  if (!redact && setup.shellConfigs.length > 0) {
    let hasSecrets = false;
    for (const config of setup.shellConfigs) {
      const detection = detectSecrets(config.content);
      if (detection.hasSecrets) {
        hasSecrets = true;
        console.warn(`\n⚠️  WARNING: Potential secrets detected in ${config.name}`);
        for (const secret of detection.secrets) {
          console.warn(`   - ${secret.type}: ${secret.count} occurrence(s)`);
        }
      }
    }
    if (hasSecrets) {
      console.warn('\nConsider using --redact-secrets flag to remove sensitive data before sharing.');
    }
  }

  // Show error summary if verbose or if there were significant errors
  if ((verbose || captureErrors.length > 5) && captureErrors.length > 0) {
    console.log(`\n⚠️  Capture warnings (${captureErrors.length}):`);
    console.log('   Some commands failed - this is normal if you don\'t have certain tools installed.');
    console.log('   (e.g., nvm, pyenv, rbenv for version managers you don\'t use)');
    const errorGroups = {};
    for (const error of captureErrors) {
      const key = error.reason;
      errorGroups[key] = (errorGroups[key] || 0) + 1;
    }
    console.log(`\n   - ${errorGroups['Command failed or tool not installed'] || captureErrors.length} command(s) skipped`);
    if (verbose) {
      console.log('\nSkipped commands (use --verbose for details):');
      for (const error of captureErrors.slice(0, 10)) {
        console.log(`   - ${error.command}`);
      }
      if (captureErrors.length > 10) {
        console.log(`   ... and ${captureErrors.length - 10} more`);
      }
    } else {
      console.log('   Use --verbose to see which commands were skipped');
    }
  }

  if (dryRun) {
    console.log(`\nDRY RUN - No file created`);
    console.log(`Would create: mac-setup.json (${JSON.stringify(setup).length} bytes)`);
  } else {
    const outputFile = 'mac-setup.json';
    fs.writeFileSync(outputFile, JSON.stringify(setup, null, 2));
    console.log(`\nSetup saved to: ${outputFile}`);
  }
}

main();
