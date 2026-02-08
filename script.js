// Simple Fade-in effect for project cards
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card').forEach(card => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "all 0.6s ease-out";
    observer.observe(card);
});

// Custom cursor effect (desktop only)
const cursor = document.getElementById('cursor');
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.opacity = '0.6';
});

document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
});

function animateCursor() {
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;
            
    cursorX += dx * 0.15;
    cursorY += dy * 0.15;
            
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
            
    requestAnimationFrame(animateCursor);
}
animateCursor();


// Smooth scrolling for navigation links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

