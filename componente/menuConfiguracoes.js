(function (global) {
  "use strict";

  /**
   * Renderiza o menu de configurações dentro de um elemento existente.
   * @param {HTMLElement|string} elOrSelector - Elemento alvo ou seletor (ex: '.nav-config').
   * @param {string|number} id - ID da empresa/usuário para passar na URL.
   */
  function renderMenuConfiguracoes(elOrSelector, id) {
    // --- Resolver elemento alvo ---
    const el = (typeof elOrSelector === "string")
      ? document.querySelector(elOrSelector)
      : elOrSelector;

    if (!el) {
      console.warn("renderMenuConfiguracoes: elemento não encontrado.");
      return;
    }

    // --- HTML do menu lateral de configurações ---
    el.innerHTML = `
      <nav class="nav" aria-label="Menu de configurações">
        <a href="./configuracoes.html?id=${id}" class="nav-item">Configurações</a>
        <a href="./configuracoes-gerais.html?id=${id}" class="nav-item">Configurações Gerais</a>
        <a href="./dados-pessoais.html?id=${id}" class="nav-item">Dados pessoais</a>
        <a href="./alterar-email.html?id=${id}" class="nav-item">Alterar e-mail</a>
        <a href="./alterar-senha.html?id=${id}" class="nav-item">Alterar senha</a>
        <a href="./gerenciar-bloqueados.html?id=${id}" class="nav-item">Gerenciar bloqueados</a>
        <a href="./sobre-a-plataforma.html?id=${id}" class="nav-item">Sobre a plataforma</a>
        <a href="./fale-conosco.html?id=${id}" class="nav-item">Fale conosco</a>
        <a href="./perguntas-frequentes.html?id=${id}" class="nav-item">Perguntas frequentes</a>
        <hr>
        <a href="./termos-de-uso.html?id=${id}" class="nav-item">Termos de uso</a>
        <a href="./politica-de-privacidade.html?id=${id}" class="nav-item">Política de privacidade</a>
        <a href="./conformidade-lgpd.html?id=${id}" class="nav-item">Conformidade LGPD</a>
      </nav>
    `;
  }

  // Disponibiliza no escopo global
  global.renderMenuConfiguracoes = renderMenuConfiguracoes;

})(window);
