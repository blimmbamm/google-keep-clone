import { LocalStorageKeys } from './shared';

export function getNavMenuOpenState() {
  let navMenuOpen = localStorage.getItem(LocalStorageKeys.NAV_MENU_OPEN_STATE);

  if (navMenuOpen) {
    try {
      navMenuOpen = JSON.parse(navMenuOpen);
    } catch {
      return false;
    }
  }
  return Boolean(navMenuOpen);
}

export function setNavMenuOpenState(value: boolean) {
  localStorage.setItem(
    LocalStorageKeys.NAV_MENU_OPEN_STATE,
    JSON.stringify(value)
  );
}
