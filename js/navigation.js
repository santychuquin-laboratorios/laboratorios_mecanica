const menuButton = document.getElementById('mobile-menu-btn');
const navigation = document.getElementById('nav-menu');
if (menuButton && navigation) {
    const setMenu = (open) => {
        navigation.classList.toggle('show', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    menuButton.addEventListener('click', () => setMenu(!navigation.classList.contains('show')));
    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navigation.classList.contains('show')) {
            setMenu(false);
            menuButton.focus();
        }
    });
}
