const { execSync } = require('child_process');

/**
 * Sanitizes a package name to prevent command injection
 * @param {string} name - The package name to sanitize
 * @returns {string|null} - The sanitized name or null if invalid
 */
function sanitizePackageName(name) {
  if (typeof name !== 'string') return null;

  // Allow alphanumeric, dash, underscore, slash (for taps), @ (for scoped packages), dot
  // This covers: regular packages, taps (user/repo), scoped packages (@org/pkg)
  if (/^[@a-zA-Z0-9.\-_\/]+$/.test(name)) {
    return name;
  }

  return null;
}

/**
 * Executes a shell command with enhanced error handling
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @param {boolean} options.silent - Don't output to console
 * @param {boolean} options.ignoreError - Don't throw on error
 * @param {boolean} options.logErrors - Log errors to console (default: true)
 * @param {boolean} options.throwOnError - Throw exception on error
 * @param {number} options.timeout - Command timeout in ms
 * @returns {string|null} - Command output or null on error
 */
function exec(command, options = {}) {
  const {
    silent = false,
    ignoreError = false,
    logErrors = true,
    throwOnError = false,
    timeout = 30000
  } = options;

  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      timeout: timeout
    });

    return typeof result === 'string' ? result.trim() : result;
  } catch (error) {
    if (logErrors && !ignoreError) {
      console.error(`Command failed: ${command}`);
      console.error(`Error: ${error.message}`);
      if (error.code) {
        console.error(`Exit code: ${error.code}`);
      }
    }

    if (throwOnError) {
      throw error;
    }

    return null;
  }
}

/**
 * Executes a command and returns output (silent mode for capture operations)
 * @param {string} command - The command to execute
 * @returns {string|null} - Command output or null on error
 */
function execSilent(command) {
  return exec(command, { silent: true, logErrors: false });
}

/**
 * Validates an array of package names and filters out invalid ones
 * @param {Array<Object>} packages - Array of package objects with 'name' property
 * @param {string} context - Context for warning message (e.g., 'Homebrew formulae')
 * @returns {Array<string>} - Array of sanitized package names
 */
function sanitizePackages(packages, context = 'packages') {
  const safeNames = packages
    .map(pkg => sanitizePackageName(pkg.name))
    .filter(Boolean);

  if (safeNames.length !== packages.length) {
    const invalidCount = packages.length - safeNames.length;
    console.warn(`Warning: ${invalidCount} invalid ${context} name(s) were skipped for security`);
  }

  return safeNames;
}

/**
 * Detects if a string might contain secrets
 * @param {string} content - Content to check
 * @returns {Object} - Detection results with found secrets info
 */
function detectSecrets(content) {
  const patterns = [
    { name: 'API Key', regex: /(?:api[_-]?key|apikey)[\s:=]+['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi },
    { name: 'Password', regex: /(?:password|passwd|pwd)[\s:=]+['"]?([^\s'"]+)['"]?/gi },
    { name: 'Token', regex: /(?:token|access[_-]?token)[\s:=]+['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi },
    { name: 'Secret', regex: /(?:secret|private[_-]?key)[\s:=]+['"]?([^\s'"]+)['"]?/gi },
    { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/gi },
    { name: 'GitHub Token', regex: /gh[ps]_[a-zA-Z0-9]{36}/gi },
    { name: 'Private Key', regex: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/gi }
  ];

  const found = [];

  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      found.push({
        type: pattern.name,
        count: matches.length
      });
    }
  }

  return {
    hasSecrets: found.length > 0,
    secrets: found
  };
}

/**
 * Redacts potential secrets from content
 * @param {string} content - Content to redact
 * @returns {string} - Redacted content
 */
function redactSecrets(content) {
  const patterns = [
    /(?:api[_-]?key|apikey)[\s:=]+['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
    /(?:password|passwd|pwd)[\s:=]+['"]?([^\s'"]+)['"]?/gi,
    /(?:token|access[_-]?token)[\s:=]+['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
    /(?:secret|private[_-]?key)[\s:=]+['"]?([^\s'"]+)['"]?/gi,
    /AKIA[0-9A-Z]{16}/gi,
    /gh[ps]_[a-zA-Z0-9]{36}/gi,
    /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |DSA |EC )?PRIVATE KEY-----/gi
  ];

  let redacted = content;

  for (const pattern of patterns) {
    redacted = redacted.replace(pattern, (match) => {
      const keyPart = match.split(/[\s:=]+/)[0];
      return `${keyPart}=[REDACTED]`;
    });
  }

  return redacted;
}

module.exports = {
  exec,
  execSilent,
  sanitizePackageName,
  sanitizePackages,
  detectSecrets,
  redactSecrets
};
