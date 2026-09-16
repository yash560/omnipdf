/**
 * Safe haptic vibration utility for mobile touch interfaces.
 * Gracefully degrades to no-op on unsupported browsers/devices.
 */

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'selection':
        navigator.vibrate(12);
        break;
      case 'light':
        navigator.vibrate(18);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate([45, 30, 45]);
        break;
      case 'success':
        navigator.vibrate([15, 50, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 40, 30]);
        break;
      case 'error':
        navigator.vibrate([50, 40, 50, 40, 50]);
        break;
      default:
        navigator.vibrate(20);
    }
  } catch {
    // Ignore permissions or unsupported errors
  }
};
