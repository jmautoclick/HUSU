import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function tapLight() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* haptics best-effort: ignorar si no hay soporte nativo */ }
}

export async function tapMedium() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* haptics best-effort: ignorar si no hay soporte nativo */ }
}

export async function celebrate() {
  try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* haptics best-effort: ignorar si no hay soporte nativo */ }
}
