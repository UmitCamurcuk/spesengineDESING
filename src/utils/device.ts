const DEVICE_ICON_PATHS = {
  iosPhone: '/assets/devices/ios-phone.png',
  androidPhone: '/assets/devices/android-phone.png',
  macBrowser: '/assets/devices/mac-browser.png',
  windowsBrowser: '/assets/devices/windows-browser.png',
} as const;

type DeviceIconKey = keyof typeof DEVICE_ICON_PATHS;

interface DeviceResolution {
  iconPath: string;
  label: string;
}

const DEVICE_MATCHERS: Array<{
  key: DeviceIconKey;
  label: string;
  test: (ua: string) => boolean;
}> = [
  {
    key: 'iosPhone',
    label: 'iOS Telefon',
    test: (ua) => /iPhone|iPod/.test(ua),
  },
  {
    key: 'androidPhone',
    label: 'Android Telefon',
    test: (ua) => /Android/.test(ua) && /Mobile/.test(ua),
  },
  {
    key: 'macBrowser',
    label: 'Mac Tarayıcısı',
    test: (ua) => /Macintosh|Mac OS X/.test(ua),
  },
  {
    key: 'windowsBrowser',
    label: 'Windows Tarayıcısı',
    test: (ua) => /Windows NT/.test(ua),
  },
];

export function resolveDeviceIcon(userAgent?: string | null): DeviceResolution | undefined {
  if (!userAgent || typeof userAgent !== 'string') {
    return undefined;
  }

  const normalizedUA = userAgent.trim();
  if (normalizedUA.length === 0) {
    return undefined;
  }

  const match = DEVICE_MATCHERS.find(({ test }) => test(normalizedUA));
  if (!match) {
    return undefined;
  }

  return {
    iconPath: DEVICE_ICON_PATHS[match.key],
    label: match.label,
  };
}

export type { DeviceResolution };
