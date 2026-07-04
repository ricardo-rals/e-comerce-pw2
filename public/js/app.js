document.addEventListener('DOMContentLoaded', () => {

  // Confirmação de exclusão via delegação (funciona também em linhas inseridas
  // dinamicamente pela busca ao vivo).
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form && form.matches && form.matches('form[data-confirm]')) {
      if (!confirm(form.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    }
  });

  // Auto-dismiss das mensagens flash após 5 segundos
  document.querySelectorAll('.flash').forEach((el) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';

      setTimeout(() => el.remove(), 400);
    }, 5000);
  });

  // Máscaras de input
  function mascaraCPF(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/^(\d{3})(\d{1,3})/, '$1.$2');
    e.target.value = v;
  }

  function mascaraTelefone(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = v.replace(/^(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,5})/, '($1) $2');
    else if (v.length > 0) v = v.replace(/^(\d{1,2})/, '($1');
    e.target.value = v;
  }

  const campoCPF = document.getElementById('cpf');
  if (campoCPF) campoCPF.addEventListener('input', mascaraCPF);

  const campoTelefone = document.getElementById('telefone');
  if (campoTelefone) campoTelefone.addEventListener('input', mascaraTelefone);

  // Busca dinâmica: formulários com data-live recarregam só a tabela alvo.
  document.querySelectorAll('form[data-live]').forEach((form) => {
    const alvo = document.querySelector(form.getAttribute('data-alvo'));
    if (!alvo) return;

    let timer;

    const buscar = () => {
      const params = new URLSearchParams(new FormData(form));
      params.set('parcial', '1');

      fetch(form.action + '?' + params.toString())
        .then((r) => r.text())
        .then((html) => { alvo.innerHTML = html; })
        .catch(() => { /* silencioso: mantém a tabela atual */ });
    };

    const agendar = () => {
      clearTimeout(timer);
      timer = setTimeout(buscar, 250);
    };

    form.addEventListener('input', agendar);
    form.addEventListener('change', agendar);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(timer);
      buscar();
    });
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
