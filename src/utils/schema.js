/**
 * JSON Schema validation for mac-setup.json
 */

const SCHEMA_VERSION = '2.0';

/**
 * Validates the structure of a setup JSON object
 * @param {Object} setup - The setup object to validate
 * @returns {Object} - Validation result with { valid: boolean, errors: Array }
 */
function validateSetup(setup) {
  const errors = [];

  // Check version compatibility
  if (!setup.version) {
    // Legacy format (v1.0) - add version for compatibility
    setup.version = '1.0';
    console.warn('Warning: Legacy setup format detected. Consider re-capturing for full features.');
  }

  // Validate system info
  if (!setup.system) {
    errors.push('Missing required field: system');
  } else {
    if (!setup.system.hostname) {
      errors.push('Missing required field: system.hostname');
    }
    if (!setup.system.macosVersion) {
      errors.push('Missing required field: system.macosVersion');
    }
    if (!setup.system.captureDate) {
      errors.push('Missing required field: system.captureDate');
    }
  }

  // Validate homebrew section
  if (!setup.homebrew) {
    errors.push('Missing required field: homebrew');
  } else {
    if (!Array.isArray(setup.homebrew.taps)) {
      errors.push('Invalid field: homebrew.taps must be an array');
    }
    if (!Array.isArray(setup.homebrew.casks)) {
      errors.push('Invalid field: homebrew.casks must be an array');
    }
    if (!Array.isArray(setup.homebrew.formulae)) {
      errors.push('Invalid field: homebrew.formulae must be an array');
    }

    // Validate package objects have required fields
    if (Array.isArray(setup.homebrew.casks)) {
      setup.homebrew.casks.forEach((cask, idx) => {
        if (!cask.name) {
          errors.push(`Invalid cask at index ${idx}: missing 'name' field`);
        }
      });
    }

    if (Array.isArray(setup.homebrew.formulae)) {
      setup.homebrew.formulae.forEach((formula, idx) => {
        if (!formula.name) {
          errors.push(`Invalid formula at index ${idx}: missing 'name' field`);
        }
      });
    }
  }

  // Validate applications array
  if (setup.applications && !Array.isArray(setup.applications)) {
    errors.push('Invalid field: applications must be an array');
  }

  // Validate global packages
  if (setup.globalPackages) {
    const managers = ['npm', 'bun', 'dart', 'ruby'];
    for (const manager of managers) {
      if (setup.globalPackages[manager] && !Array.isArray(setup.globalPackages[manager])) {
        errors.push(`Invalid field: globalPackages.${manager} must be an array`);
      }
    }
  }

  // Validate shell configs
  if (setup.shellConfigs && !Array.isArray(setup.shellConfigs)) {
    errors.push('Invalid field: shellConfigs must be an array');
  }

  // Validate git config
  if (setup.gitConfig) {
    if (setup.gitConfig.user && typeof setup.gitConfig.user !== 'object') {
      errors.push('Invalid field: gitConfig.user must be an object');
    }
    if (setup.gitConfig.settings && !Array.isArray(setup.gitConfig.settings)) {
      errors.push('Invalid field: gitConfig.settings must be an array');
    }
  }

  // Validate github repos
  if (setup.githubRepos && !Array.isArray(setup.githubRepos)) {
    errors.push('Invalid field: githubRepos must be an array');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Creates a minimal valid setup object
 * @returns {Object} - Minimal valid setup structure
 */
function createEmptySetup() {
  return {
    version: SCHEMA_VERSION,
    system: {
      hostname: 'unknown',
      macosVersion: 'unknown',
      architecture: 'unknown',
      homebrewVersion: 'unknown',
      captureDate: new Date().toISOString()
    },
    applications: [],
    homebrew: {
      taps: [],
      casks: [],
      formulae: []
    },
    binaries: [],
    homeBin: [],
    githubRepos: [],
    globalPackages: {
      npm: [],
      bun: [],
      dart: [],
      ruby: []
    },
    shellConfigs: [],
    gitConfig: {
      user: {},
      settings: []
    },
    versionManagers: {
      nvm: { installed: false, versions: [] },
      pyenv: { installed: false, versions: [] },
      rbenv: { installed: false, versions: [] }
    },
    menubarConfig: {
      loginItems: [],
      runningApps: [],
      launchAgents: []
    }
  };
}

/**
 * Checks if a setup is compatible with current version
 * @param {Object} setup - The setup object to check
 * @returns {boolean} - True if compatible
 */
function isCompatibleVersion(setup) {
  if (!setup.version) {
    // Legacy v1.0 format is still compatible
    return true;
  }

  const [major] = setup.version.split('.');
  const [currentMajor] = SCHEMA_VERSION.split('.');

  // Major version must match for compatibility
  return major === currentMajor;
}

/**
 * Compares two setup objects and returns differences
 * @param {Object} oldSetup - The old setup
 * @param {Object} newSetup - The new setup
 * @returns {Object} - Diff object with added, removed, changed items
 */
function diffSetups(oldSetup, newSetup) {
  const diff = {
    applications: {
      added: [],
      removed: [],
      updated: []
    },
    homebrew: {
      formulae: { added: [], removed: [] },
      casks: { added: [], removed: [] },
      taps: { added: [], removed: [] }
    },
    globalPackages: {
      npm: { added: [], removed: [] },
      bun: { added: [], removed: [] },
      dart: { added: [], removed: [] },
      ruby: { added: [], removed: [] }
    }
  };

  // Compare applications
  const oldApps = new Map(oldSetup.applications.map(a => [a.name, a]));
  const newApps = new Map(newSetup.applications.map(a => [a.name, a]));

  for (const [name, app] of newApps) {
    if (!oldApps.has(name)) {
      diff.applications.added.push(app);
    } else if (oldApps.get(name).version !== app.version) {
      diff.applications.updated.push({
        name,
        oldVersion: oldApps.get(name).version,
        newVersion: app.version
      });
    }
  }

  for (const [name, app] of oldApps) {
    if (!newApps.has(name)) {
      diff.applications.removed.push(app);
    }
  }

  // Compare Homebrew packages
  const comparePackages = (oldPkgs, newPkgs, type, category) => {
    const oldSet = new Set(oldPkgs.map(p => p.name || p));
    const newSet = new Set(newPkgs.map(p => p.name || p));

    for (const pkg of newPkgs) {
      const name = pkg.name || pkg;
      if (!oldSet.has(name)) {
        diff.homebrew[category].added.push(typeof pkg === 'string' ? pkg : pkg.name);
      }
    }

    for (const pkg of oldPkgs) {
      const name = pkg.name || pkg;
      if (!newSet.has(name)) {
        diff.homebrew[category].removed.push(typeof pkg === 'string' ? pkg : pkg.name);
      }
    }
  };

  comparePackages(oldSetup.homebrew.formulae, newSetup.homebrew.formulae, 'formulae', 'formulae');
  comparePackages(oldSetup.homebrew.casks, newSetup.homebrew.casks, 'casks', 'casks');
  comparePackages(oldSetup.homebrew.taps, newSetup.homebrew.taps, 'taps', 'taps');

  // Compare global packages
  for (const manager of ['npm', 'bun', 'dart', 'ruby']) {
    const oldPkgs = oldSetup.globalPackages[manager] || [];
    const newPkgs = newSetup.globalPackages[manager] || [];
    comparePackages(oldPkgs, newPkgs, manager, manager);
  }

  return diff;
}

module.exports = {
  SCHEMA_VERSION,
  validateSetup,
  createEmptySetup,
  isCompatibleVersion,
  diffSetups
};
