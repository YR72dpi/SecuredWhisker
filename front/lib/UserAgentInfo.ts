const UAParser = require('ua-parser-js');

export interface UserAgentInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
}

export function parseUserAgent(uaString: string): UserAgentInfo {
  const parser = new UAParser(uaString); // OK avec require
  const result = parser.getResult();

  let deviceType: UserAgentInfo['deviceType'] = 'unknown';
  if (result.device.type === 'mobile') deviceType = 'mobile';
  else if (result.device.type === 'tablet') deviceType = 'tablet';
  else if (result.device.type === 'smarttv' || result.device.type === 'console' || !result.device.type)
    deviceType = 'desktop';
  else if (result.device.type === 'bot') deviceType = 'bot';

  return {
    deviceType,
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
  };
}
