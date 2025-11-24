const slides = Array.from(document.querySelectorAll('.slide'));
const totalSlides = slides.length;
let currentSlide = 0;

const slideNumberEl = document.getElementById('slideNumber');
const slideListEl = document.getElementById('slideList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const sidebarEl = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const chevronEl = toggleSidebarBtn.querySelector('.chevron');
const slideContainer = document.querySelector('.slide-container');
const slideListButtons = [];

function renderSlideList() {
    slides.forEach((slide, index) => {
        const label = slide.querySelector('img')?.alt || `スライド ${index + 1}`;
        const listItem = document.createElement('li');
        const button = document.createElement('button');

        button.className = 'slide-list-item';
        button.type = 'button';
        button.setAttribute('data-index', index);
        button.title = label;
        button.innerHTML = `
            <span class="slide-number">${index + 1}</span>
            <span class="slide-label">${label}</span>
        `;
        button.addEventListener('click', () => showSlide(index));

        listItem.appendChild(button);
        slideListEl.appendChild(listItem);
        slideListButtons.push(button);
    });
}

function updateActiveIndicator() {
    slideListButtons.forEach((button, index) => {
        button.classList.toggle('active', index === currentSlide);
    });

    const activeButton = slideListButtons[currentSlide];
    if (activeButton) {
        activeButton.scrollIntoView({ block: 'nearest' });
    }
}

function showSlide(nextIndex) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (nextIndex + totalSlides) % totalSlides;
    slides[currentSlide].classList.add('active');
    slideNumberEl.textContent = `${currentSlide + 1} / ${totalSlides}`;
    updateActiveIndicator();
}

function changeSlide(direction) {
    showSlide(currentSlide + direction);
}

function setSidebarCollapsed(collapsed) {
    sidebarEl.classList.toggle('collapsed', collapsed);
    toggleSidebarBtn.setAttribute('aria-expanded', (!collapsed).toString());
    chevronEl.textContent = collapsed ? '▶' : '◀';
}

function toggleSidebar() {
    setSidebarCollapsed(!sidebarEl.classList.contains('collapsed'));
}

function initializeSidebarState() {
    const shouldCollapse = window.innerWidth < 1100;
    setSidebarCollapsed(shouldCollapse);
}

renderSlideList();
initializeSidebarState();
showSlide(0);

prevBtn.addEventListener('click', () => changeSlide(-1));
nextBtn.addEventListener('click', () => changeSlide(1));
toggleSidebarBtn.addEventListener('click', toggleSidebar);

window.addEventListener('resize', () => {
    if (window.innerWidth < 1100 && !sidebarEl.classList.contains('collapsed')) {
        setSidebarCollapsed(true);
    }
});

// キーボードナビゲーション
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') changeSlide(-1);
    if (event.key === 'ArrowRight') changeSlide(1);
});

// クリックナビゲーション（右半分をクリックで次へ、左半分で前へ）
slideContainer.addEventListener('click', (event) => {
    if (event.target.closest('.navigation')) return;
    const clickX = event.clientX;
    const { innerWidth } = window;

    if (clickX > innerWidth / 2) {
        changeSlide(1);
    } else {
        changeSlide(-1);
    }
});
