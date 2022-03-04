// Top-nav menu initialization
function toggleMenu() {
    const menu = document.getElementById('top-menu');
    const icon = document.getElementById('toggle-icon');
    menu.classList.toggle('active');
    icon.innerText = (icon.innerText == 'menu') ? 'close' : 'menu';
}
document.getElementById('toggle-icon').addEventListener('click', toggleMenu);

// End of code.