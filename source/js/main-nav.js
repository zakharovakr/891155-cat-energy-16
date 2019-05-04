document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.replace('no-js', 'js');

    const mainNav = document.querySelector('.main-nav');
    const burger = document.querySelector('.burger');

    const switchMenu = function () {
        this.classList.toggle('burger--close');
        mainNav.classList.toggle('main-nav--open');
    };

    burger.addEventListener('click', switchMenu);
});