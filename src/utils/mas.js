const { execSilent } = require('./exec');

/**
 * Checks if 'mas' CLI tool is installed
 * @returns {boolean} - True if mas is available
 */
function isMasInstalled() {
  const result = execSilent('which mas');
  return result !== null;
}

/**
 * Gets all Mac App Store applications
 * @returns {Array<Object>} - Array of MAS apps with id, name, version
 */
function getMasApps() {
  const apps = [];

  if (!isMasInstalled()) {
    return apps;
  }

  const output = execSilent('mas list');
  if (!output) {
    return apps;
  }

  const lines = output.split('\n');
  for (const line of lines) {
    // Parse format: "497799835 Xcode (14.3.1)"
    const match = line.match(/^(\d+)\s+(.+?)\s+\((.+?)\)$/);
    if (match) {
      apps.push({
        id: match[1],
        name: match[2],
        version: match[3]
      });
    }
  }

  return apps;
}

/**
 * Installs Mac App Store apps by ID
 * @param {Array<Object>} apps - Array of apps with 'id' property
 * @param {boolean} dryRun - Preview mode
 * @returns {Object} - Result with success and failure counts
 */
function installMasApps(apps, dryRun = false) {
  const result = {
    success: 0,
    failed: 0,
    skipped: 0
  };

  if (!isMasInstalled()) {
    console.warn('⚠️  mas CLI not installed. Mac App Store apps cannot be automatically installed.');
    console.log('Install mas: brew install mas');
    result.skipped = apps.length;
    return result;
  }

  const { exec } = require('./exec');

  console.log(`${dryRun ? 'Would install' : 'Installing'} ${apps.length} Mac App Store app(s)...`);

  for (const app of apps) {
    if (dryRun) {
      console.log(`  + Would install: ${app.name} (${app.id})`);
      result.success++;
    } else {
      console.log(`  Installing: ${app.name}...`);
      const installResult = exec(`mas install ${app.id}`, { ignoreError: true, silent: false });
      if (installResult !== null) {
        result.success++;
      } else {
        result.failed++;
      }
    }
  }

  return result;
}

/**
 * Checks if a Mac App Store app is installed
 * @param {string} appId - The app ID
 * @returns {boolean} - True if installed
 */
function isMasAppInstalled(appId) {
  if (!isMasInstalled()) {
    return false;
  }

  const installed = getMasApps();
  return installed.some(app => app.id === appId);
}

module.exports = {
  isMasInstalled,
  getMasApps,
  installMasApps,
  isMasAppInstalled
};
