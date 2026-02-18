import { device } from 'detox';

export async function resetApp() {
  await device.launchApp({ delete: true });
}

export async function relaunchApp() {
  await device.launchApp({ newInstance: true });
}

export async function seedAndLaunch() {
  await device.launchApp({ delete: true, launchArgs: { detoxSeedState: 'true' } });
}
