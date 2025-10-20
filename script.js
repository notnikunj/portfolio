  const openButtons = document.querySelectorAll('.open-modal');
  const closeButtons = document.querySelectorAll('.close-modal');
  const modals = document.querySelectorAll('.modal');

openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.parentElement.getAttribute('data-modal');
      document.getElementById(modalId).style.display = 'flex';
      document.body.style.overflow = 'hidden'; 
    });
});

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
      document.body.style.overflow = 'auto';
    });
});


