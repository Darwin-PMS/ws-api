const VERSIONS = ['v1', 'v2'];
const CLIENT_TYPES = ['mobile', 'admin'];
const DEFAULT_VERSION = 'v1';
const DEFAULT_CLIENT_TYPE = 'mobile';

const versionMiddleware = (req, res, next) => {
  const pathParts = req.path.split('/').filter(Boolean);
  
  const potentialVersion = pathParts[0];
  const potentialClientType = pathParts[1];
  
  req.apiVersion = VERSIONS.includes(potentialVersion) ? potentialVersion : DEFAULT_VERSION;
  req.clientType = CLIENT_TYPES.includes(potentialClientType) ? potentialClientType : null;
  
  if (CLIENT_TYPES.includes(potentialVersion)) {
    req.clientType = potentialVersion;
    req.apiVersion = DEFAULT_VERSION;
  }
  
  next();
};

const validateVersion = (req, res, next) => {
  const pathParts = req.path.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return res.status(404).json({
      success: false,
      message: 'Invalid API path. Expected format: /api/{version}/{clientType}/...',
      example: '/api/v1/mobile/* or /api/v1/admin/*'
    });
  }
  
  const [version, clientType] = pathParts;
  
  if (!VERSIONS.includes(version)) {
    return res.status(400).json({
      success: false,
      message: `Invalid API version: ${version}`,
      availableVersions: VERSIONS,
      currentVersion: DEFAULT_VERSION
    });
  }
  
  if (!CLIENT_TYPES.includes(clientType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid client type: ${clientType}`,
      availableClients: CLIENT_TYPES
    });
  }
  
  next();
};

const createVersionedResponse = (data, version, clientType) => {
  return {
    ...data,
    _meta: {
      version,
      clientType,
      timestamp: new Date().toISOString()
    }
  };
};

module.exports = {
  versionMiddleware,
  validateVersion,
  createVersionedResponse,
  VERSIONS,
  CLIENT_TYPES,
  DEFAULT_VERSION,
  DEFAULT_CLIENT_TYPE
};
