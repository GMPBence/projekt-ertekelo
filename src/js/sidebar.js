const sidebarItems = document.querySelectorAll('.sidebar__content__list__item');

function setActiveItem(item) {
    sidebarItems.forEach((el) => el.classList.remove('sidebar__item__active'));
    item.classList.add('sidebar__item__active');
}

sidebarItems.forEach((item) => {
    item.addEventListener('click', () => setActiveItem(item));
});

const currentItem = document.getElementById(`sidebar__${document.body.dataset.page}`);
setActiveItem(currentItem ?? sidebarItems[0]);
