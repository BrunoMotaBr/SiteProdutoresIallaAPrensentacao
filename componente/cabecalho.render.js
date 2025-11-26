(function (global) {
  "use strict";

  const EMPRESA_CACHE_KEY = "ialla_empresa_perfil";

  async function obterEmpresa(id) {
    try {
      const salvo = localStorage.getItem(EMPRESA_CACHE_KEY);
      if (salvo) {
        const obj = JSON.parse(salvo);
        if (obj && String(obj.id) === String(id)) {
          return obj;
        }
      }
    } catch (e) {
      console.warn("Erro ao ler cache da empresa:", e);
    }

    if (typeof global.pegarDados === "function" && id) {
      const resp = await global.pegarDados(id);
      const empresa = resp[0]?.resultado || resp[0]?.empresa || resp[0];
      if (empresa && empresa.id) {
        try {
          localStorage.setItem(EMPRESA_CACHE_KEY, JSON.stringify(empresa));
        } catch (e) {
          console.warn("Erro ao salvar cache da empresa:", e);
        }
        return empresa;
      }
    }

    return null;
  }

  async function renderCabecalho(elOrSelector, id) {
    const el = (typeof elOrSelector === "string")
      ? document.querySelector(elOrSelector)
      : elOrSelector;

    if (!el) {
      console.warn("renderCabecalho: elemento não encontrado.");
      return;
    }

    let nome = "Ialla Produções";
    let imagemPerfil = "../imagens/image.png";

    const baseUrl = global.BASE_URL || "https://apiiallas.onrender.com";

    try {
      const empresa = await obterEmpresa(id);

      if (empresa) {
        if (empresa.nome) {
          nome = empresa.nome;
        }
        if (empresa.foto_perfil) {
          imagemPerfil = empresa.foto_perfil.startsWith("http")
            ? empresa.foto_perfil
            : `${baseUrl}${empresa.foto_perfil}`;
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados da empresa no cabeçalho:", e);
    }

    el.innerHTML = `
      <a href="dashboard.html?id=${id}" aria-label="Ir para o Dashboard">
        <img src="../imagens/logoPequena.png" alt="Logo Ialla">
      </a>

      <nav aria-label="Menu principal">
        <ul>
          <li><a class="link-underline" href="dashboard.html?id=${id}">Dashboard</a></li>
          <li><a class="link-underline" href="meusEventos.html?id=${id}">Meus eventos</a></li>
          <li><a class="link-underline" href="cardapios.html?id=${id}">Cardápios</a></li>
          <li><a class="link-underline" href="mensagens.html?id=${id}">Mensagens</a></li>
        </ul>
      </nav>

      <ul style="display:flex; align-items:center; gap:14px; list-style:none; margin:0; padding:0;">
        <li class="icone-notificacoes">
          <a href="#" aria-label="Notificações">
            <img src="../icons/notificacoes.svg" alt="Notificações">
          </a>
        </li>

        <li style="position: relative; list-style:none;">
          <button class="botao--branco botao-perfil" type="button" aria-haspopup="menu" aria-expanded="false">
            <img style="width: 45px; height: 50px" src="${imagemPerfil}" alt="Perfil">
            <a href="#" style="text-decoration:none;">${nome}</a>
          </button>

          <div class="mini-menu" role="menu" hidden>
            <a role="menuitem" href="perfil.html?id=${id}"><img src="../icons/user.png" alt=""><p>Perfil</p></a>
            <a role="menuitem" href="configuracoes.html?id=${id}"><img src="../icons/gear.png" alt=""><p>Configurações</p></a>
            <a role="menuitem" href="#" onclick="logoutEmpresa()">
              <img src="../icons/exit.png" alt="">
              <p>Sair</p>
            </a>
          </div>
        </li>
      </ul>
    `;

    const botaoPerfil = el.querySelector(".botao-perfil");
    const menu = el.querySelector(".mini-menu");

    function abrirMenu() {
      if (!menu) return;
      menu.hidden = false;
      menu.classList.add("mini-menu-ativo");
      botaoPerfil?.setAttribute("aria-expanded", "true");
    }

    function fecharMenuPerfil() {
      if (!menu) return;
      menu.hidden = true;
      menu.classList.remove("mini-menu-ativo");
      botaoPerfil?.setAttribute("aria-expanded", "false");
    }

    function alternarMenuPerfil() {
      if (!menu) return;
      if (menu.hidden) abrirMenu();
      else fecharMenuPerfil();
    }

    global.abrirMenu = alternarMenuPerfil;

    botaoPerfil?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      alternarMenuPerfil();
    });

    document.addEventListener("click", (e) => {
      if (menu?.hidden) return;
      if (!el.contains(e.target)) fecharMenuPerfil();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu?.hidden) fecharMenuPerfil();
    });
  }

  function logoutEmpresa() {
    try {
      localStorage.removeItem(EMPRESA_CACHE_KEY);
      console.log("Cache da empresa removido:", EMPRESA_CACHE_KEY);
    } catch (e) {
      console.warn("Erro ao limpar cache da empresa:", e);
    }

    window.location.href = "../index.html";
  }

  global.logoutEmpresa = logoutEmpresa;
  global.renderCabecalho = renderCabecalho;

})(window);
