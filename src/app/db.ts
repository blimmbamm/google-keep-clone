const NAV_MENU_OPEN = 'nav_menu_open';

export function getNavMenuOpenState(){
  const navMenuOpen = localStorage.getItem(NAV_MENU_OPEN);
  return Boolean(navMenuOpen && JSON.parse(navMenuOpen))
}

export function setNavMenuOpenState(value: boolean){
  localStorage.setItem(NAV_MENU_OPEN, JSON.stringify(value))
}