import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function tapLight() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}

export async function tapMedium() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
}

export async function celebrate() {
  try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
}
