document.addEventListener('DOMContentLoaded', () => {

  // Confirmação de exclusão via data-confirm nos formulários
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const mensagem = form.getAttribute('data-confirm');

      if (!confirm(mensagem)) {
        e.preventDefault();
      }
    });
  });

  // Auto-dismiss das mensagens flash após 5 segundos
  document.querySelectorAll('.flash').forEach((el) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';

      setTimeout(() => el.remove(), 400);
    }, 5000);
  });

  // Dropdown de relatórios
  const dropdownBtn = document.querySelector('.nav-dropdown-btn');
  const dropdownMenu = document.querySelector('.dropdown-menu');

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      dropdownMenu.classList.toggle('aberto');
    });

    document.addEventListener('click', () => {
      dropdownMenu.classList.remove('aberto');
    });
  }

});
