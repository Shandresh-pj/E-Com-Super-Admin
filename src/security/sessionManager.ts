import { AppState, AppStateStatus } from 'react-native';
import { AppLockService } from './appLockService';

export class SessionManager {
  private static appStateListener: any = null;
  private static onLockRequiredCallback: (() => void) | null = null;

  /**
   * Initialize app lifecycle listener for background auto-lock
   */
  static init(onLockRequired: () => void) {
    this.onLockRequiredCallback = onLockRequired;

    if (this.appStateListener) {
      this.appStateListener.remove();
    }

    let previousState = AppState.currentState;

    this.appStateListener = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      // Transitioning TO background/inactive: record timestamp
      if (previousState === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        await AppLockService.updateLastActiveTimestamp();
      }

      // Transitioning FROM background/inactive TO active: check if should lock
      if ((previousState === 'background' || previousState === 'inactive') && nextState === 'active') {
        const shouldLock = await AppLockService.shouldLockApp();
        if (shouldLock && this.onLockRequiredCallback) {
          this.onLockRequiredCallback();
        }
      }

      previousState = nextState;
    });
  }

  /**
   * Teardown listener on app unmount
   */
  static destroy() {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }
}
