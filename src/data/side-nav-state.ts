import { LocalStorageKeys } from './shared';

export function getNavMenuOpenState() {
  const navMenuOpen = localStorage.getItem(
    LocalStorageKeys.NAV_MENU_OPEN_STATE
  );
  return Boolean(navMenuOpen && JSON.parse(navMenuOpen));
}

export function setNavMenuOpenState(value: boolean) {
  localStorage.setItem(
    LocalStorageKeys.NAV_MENU_OPEN_STATE,
    JSON.stringify(value)
  );
}
