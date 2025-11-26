// das.atualizado.js — versão JS puro (sem React) com CSS separado, botão de “Sacar” e filtro “Hoje”

(function () {
  // ----- "Estado" -----
  const state = {
    periodo: "7d",               // valores: "hoje", "7d", "30d", "ano"
    showModalVenda: false,
    vendaSelecionada: null,
    eventoSelecionado: null,
    modalEventosVisible: false,

    // Novo: modal de Saque
    modalSaqueVisible: false,
    saqueValorCentavos: 0,

    summary: {
      saldo_centavos: 125000,
      ingressos_7d: 342,
      receita_centavos: 512300,
      participantes_unicos: 289,
      checkins: 214,
      eventos: 9,
    },
    notificacoesVendas: [
      {
        id: "v1",
        tipo: "venda",
        texto: "Venda confirmada (+R$ 150,00)",
        valor: 150,
        produto: "Ingresso VIP – Show Sunset",
        ts: new Date(),
      },
    ],
    campanhasIA: [
      { id: "c1", titulo: "Público que curtiu o evento", subtitulo: "Alvos quentes – sugerir vouchers", qtd: 72, sugestao: "Envie 72 vouchers de R$ 10 para converter interesse em compra.", acao: "Gerar Vouchers", tag: "conversão", cor: "#2EB67D" },
      { id: "c2", titulo: "Seguidores que foram ao evento", subtitulo: "Convide-os para trazer amigos", qtd: 38, sugestao: "Campanha 'Leve um amigo' com 15% de desconto.", acao: "Criar Campanha 15%", tag: "indicação", cor: "#36C5F0" },
      { id: "c3", titulo: "Avaliações negativas recentes", subtitulo: "Recuperar relacionamento", qtd: 11, sugestao: "Envie cupom de reconquista (R$ 15) com pedido de feedback.", acao: "Enviar Cupom", tag: "reconquista", cor: "#E01E5A" },
    ],
    eventos: [
      { id: 1, nome: "Festival de Verão" },
      { id: 2, nome: "Feira Tech 2025" },
      { id: 3, nome: "Show Beneficente" },
      { id: 4, nome: "Congresso de Inovação" },
    ],
  };

  // ----- Helpers -----
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmtMoeda = (centavos) => "R$ " + (centavos / 100).toFixed(2);

  function tempoRelativo(data) {
    const diff = (Date.now() - new Date(data).getTime()) / 1000;
    if (diff < 60) return `há ${Math.floor(diff)}s`;
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function isSameDay(d1, d2){
    const a = new Date(d1), b = new Date(d2);
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  // ----- Helpers: Relatório (PDF/CSV) -----
  function montarDadosRelatorio() {
    const vendas = getVendasFiltradas();
    return {
      periodo: state.periodo,
      eventoSelecionado: state.eventoSelecionado ? state.eventoSelecionado.nome : "—",
      summary: {
        saldo: (state.summary.saldo_centavos / 100).toFixed(2),
        ingressos: state.summary.ingressos_7d,
        receita: (state.summary.receita_centavos / 100).toFixed(2),
        participantes_unicos: state.summary.participantes_unicos,
        checkins: state.summary.checkins,
        eventos: state.summary.eventos,
      },
      campanhas: state.campanhasIA.map((c) => ({
        titulo: c.titulo, tag: c.tag, qtd: c.qtd, sugestao: c.sugestao, acao: c.acao,
      })),
      vendasRecentes: vendas.slice(0, 12).map((v) => ({
        texto: v.texto, produto: v.produto, valor: v.valor.toFixed(2), quando: new Date(v.ts).toLocaleString("pt-BR"),
      })),
      geradoEm: new Date().toLocaleString("pt-BR"),
    };
  }

  function gerarCSV(dados) {
    const linhas = [];
    const push = (...cols) => linhas.push(cols.map(escaparCSV).join(";"));
    push("Relatório Ialla - Painel do Produtor");
    push("Gerado em", dados.geradoEm);
    push("Período", labelPeriodo(dados.periodo));
    push("Evento selecionado", dados.eventoSelecionado);
    linhas.push("");
    push("Métrica", "Valor");
    push("Saldo Atual (R$)", dados.summary.saldo);
    push("Ingressos", dados.summary.ingressos);
    push("Receita Total (R$)", dados.summary.receita);
    push("Participantes Únicos", dados.summary.participantes_unicos);
    push("Check-ins", dados.summary.checkins);
    push("Eventos Ativos", dados.summary.eventos);
    linhas.push("");
    push("Campanhas (IA)");
    push("Título", "Tag", "Qtd", "Sugestão", "Ação");
    dados.campanhas.forEach((c) => push(c.titulo, c.tag, String(c.qtd), c.sugestao, c.acao));
    linhas.push("");
    push("Vendas Recentes");
    push("Texto", "Produto", "Valor (R$)", "Data/Hora");
    dados.vendasRecentes.forEach((v) => push(v.texto, v.produto, v.valor, v.quando));
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    baixarBlob(blob, `relatorio-ialla-${Date.now()}.csv`);
  }
  function escaparCSV(v) {
    const s = String(v ?? "");
    return (/[;"\n]/.test(s)) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function labelPeriodo(p) {
    if (p==="hoje") return "Hoje";
    if (p==="7d") return "Últimos 7 dias";
    if (p==="30d") return "Últimos 30 dias";
    return "Último ano";
  }
  function baixarBlob(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  // ===== PDF (jsPDF via CDN) =====
  async function gerarPDF(dados) {
    const jsPDF = await ensureJsPDF();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margem = 40;
    let y = margem;

    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("Relatório Ialla - Painel do Produtor", margem, y); y += 22;

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${dados.geradoEm}`, margem, y); y += 14;
    doc.text(`Período: ${labelPeriodo(dados.periodo)}`, margem, y); y += 14;
    doc.text(`Evento selecionado: ${dados.eventoSelecionado}`, margem, y); y += 20;

    y = blocoTitulo(doc, "Resumo", y, margem);
    y = linhaKV(doc, "Saldo Atual (R$)", dados.summary.saldo, y, margem);
    y = linhaKV(doc, "Ingressos", String(dados.summary.ingressos), y, margem);
    y = linhaKV(doc, "Receita Total (R$)", dados.summary.receita, y, margem);
    y = linhaKV(doc, "Participantes Únicos", String(dados.summary.participantes_unicos), y, margem);
    y = linhaKV(doc, "Check-ins", String(dados.summary.checkins), y, margem);
    y = linhaKV(doc, "Eventos Ativos", String(dados.summary.eventos), y, margem); y += 10;

    y = blocoTitulo(doc, "Campanhas (IA)", y, margem);
    dados.campanhas.forEach((c) => {
      y = linhaBullet(doc, `• ${c.titulo}  [${c.tag}] — Qtd: ${c.qtd}`, y, margem);
      y = paragrafo(doc, c.sugestao, y, margem, 515);
      y = linhaBullet(doc, `Ação sugerida: ${c.acao}`, y, margem);
      y += 6;
    });
    y += 6;

    y = blocoTitulo(doc, "Vendas recentes", y, margem);
    dados.vendasRecentes.forEach((v) => {
      y = linhaBullet(doc, `• ${v.texto}`, y, margem);
      y = linhaKV(doc, "Produto", v.produto, y, margem);
      y = linhaKV(doc, "Valor (R$)", v.valor, y, margem);
      y = linhaKV(doc, "Data/Hora", v.quando, y, margem);
      y += 6;
    });

    doc.save(`relatorio-ialla-${Date.now()}.pdf`);
  }
  function blocoTitulo(doc, txt, y, margem) {
    quebraPaginaSe(doc, y, 60);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(txt, margem, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    return y + 16;
  }
  function linhaKV(doc, k, v, y, margem) {
    quebraPaginaSe(doc, y, 30);
    doc.setFont("helvetica", "bold"); doc.text(`${k}:`, margem, y);
    doc.setFont("helvetica", "normal"); doc.text(String(v ?? "—"), margem + 140, y);
    return y + 14;
  }
  function linhaBullet(doc, txt, y, margem) { quebraPaginaSe(doc, y, 20); doc.text(txt, margem, y); return y + 14; }
  function paragrafo(doc, txt, y, margem, larguraMax) {
    const linhas = doc.splitTextToSize(String(txt ?? ""), larguraMax);
    linhas.forEach((l) => { quebraPaginaSe(doc, y, 20); doc.text(l, margem, y); y += 14; });
    return y;
  }
  function quebraPaginaSe(doc, yAtual, espacoNecessario) {
    const altura = doc.internal.pageSize.getHeight();
    if (yAtual + espacoNecessario > altura - 40) { doc.addPage(); return 40; }
    return yAtual;
  }
  function ensureJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      s.async = true;
      s.onload = () => resolve(window.jspdf.jsPDF);
      s.onerror = () => reject(new Error("Falha ao carregar jsPDF"));
      document.head.appendChild(s);
    }).then(() => window.jspdf.jsPDF);
  }

  // ----- Render -----
  function render() {
    const root = $("#app-dashboard");
    if (!root) return;

    const temEvento = !!state.eventoSelecionado;
    const vendas = getVendasFiltradas();

    root.innerHTML = `
      <div class="dash-wrap">
        <div class="periodos">
          ${["hoje","7d","30d","ano"].map(id => {
            const label = id==="hoje" ? "Hoje" : id==="7d" ? "Últimos 7 dias" : id==="30d" ? "Últimos 30 dias" : "Último ano";
            const ativo = state.periodo === id;
            return `<button data-p="${id}" class="btn-periodo ${ativo?'btn-periodo--ativo':''}">${label}</button>`;
          }).join("")}
        </div>

        <div class="action-bar">
          <button id="btn-export-pdf" class="btn-action">📄 Baixar PDF</button>
          <button id="btn-export-excel" class="btn-action">📊 Baixar Excel</button>
          <button id="btn-sacar" class="btn-action">💸 Sacar</button>
        </div>

        <div class="cards">
          ${card("Saldo Atual", fmtMoeda(state.summary.saldo_centavos))}
          ${card(`Ingressos (${labelPeriodo(state.periodo)})`, state.summary.ingressos_7d)}
          ${card("Receita Total", fmtMoeda(state.summary.receita_centavos))}
          ${card("Participantes Únicos", state.summary.participantes_unicos)}
          ${card("Check-ins", state.summary.checkins)}
          ${cardEventos()}
        </div>

        <div class="cols">
          <div class="col">
            <div class="titulo">🧠 Campanhas sugeridas (IA)</div>
            <div class="lista-campanhas">
              ${state.campanhasIA.map((c) => campanhaItem(c)).join("")}
            </div>
          </div>

          <div class="col">
            <div class="titulo">💳 Vendas (${state.periodo==='hoje'?'de hoje':'tempo real'})</div>
            <div class="lista-vendas">
              ${vendas.map(v => vendaItem(v)).join("")}
            </div>
          </div>
        </div>

        <div class="atualiza-info">📊 Dados atualizados automaticamente</div>

        <!-- Modal Selecionar Evento -->
        <div id="modal-eventos" class="modal ${state.modalEventosVisible ? 'modal--aberto':''}">
          <div class="modal__conteudo">
            <div class="modal__titulo">Selecionar Evento</div>
            <div>
              ${state.eventos.map(ev => `<button class="modal__btn btn-escolher-evento" data-eid="${ev.id}">${ev.nome}</button>`).join("")}
              <button id="btn-cancelar-eventos" class="modal__btn">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- Modal Detalhes da Venda -->
        <div id="modal-venda" class="modal ${state.showModalVenda ? 'modal--aberto':''}">
          <div class="modal__conteudo">
            <div class="modal__titulo">🧾 Detalhes da Venda</div>
            ${state.vendaSelecionada ? `
              <div class="modal__linha">Produto: ${state.vendaSelecionada.produto}</div>
              <div class="modal__linha">Valor: R$ ${state.vendaSelecionada.valor.toFixed(2)}</div>
              <div class="modal__linha">Data: ${new Date(state.vendaSelecionada.ts).toLocaleString("pt-BR")}</div>
            ` : ""}
            <button id="btn-fechar-venda" class="modal__btn">Fechar</button>
          </div>
        </div>

        <!-- Modal Saque -->
        <div id="modal-saque" class="modal ${state.modalSaqueVisible ? 'modal--aberto':''}">
          <div class="modal__conteudo">
            <div class="modal__titulo">💸 Solicitar Saque</div>
            <label class="modal__linha">Valor do saque (R$)
              <input id="input-saque-valor" class="modal__input" type="number" min="0" step="0.01" placeholder="0,00" inputmode="decimal">
            </label>
            <button id="btn-confirmar-saque" class="modal__btn">Confirmar</button>
            <button id="btn-cancelar-saque" class="modal__btn">Cancelar</button>
          </div>
        </div>
      </div>
    `;

    // listeners dos botões de período
    $$(".btn-periodo", root).forEach((btn) => {
      btn.addEventListener("click", () => handlePeriodo(btn.getAttribute("data-p")));
    });

    // exportações
    $("#btn-export-pdf", root)?.addEventListener("click", async () => {
      const dados = montarDadosRelatorio(); await gerarPDF(dados);
    });
    $("#btn-export-excel", root)?.addEventListener("click", () => {
      const dados = montarDadosRelatorio(); gerarCSV(dados);
    });

    // botão selecionar evento
    $("#btn-sel-evento", root)?.addEventListener("click", () => { state.modalEventosVisible = true; render(); });

    // lista de vendas: abre modal
    $$(".item-venda", root).forEach((el) => {
      el.addEventListener("click", () => {
        const vid = el.getAttribute("data-vid");
        const venda = state.notificacoesVendas.find((v) => v.id === vid);
        if (venda) { state.vendaSelecionada = venda; state.showModalVenda = true; render(); }
      });
    });

    // ações das campanhas
    $$(".btn-campanha-acao", root).forEach((el) => {
      el.addEventListener("click", () => {
        const cid = el.getAttribute("data-cid");
        const item = state.campanhasIA.find((c) => c.id === cid);
        if (item) alert(`Campanha "${item.titulo}" processada com sucesso!`);
      });
    });

    // modal eventos
    $("#btn-cancelar-eventos")?.addEventListener("click", () => { state.modalEventosVisible = false; render(); });
    $$(".btn-escolher-evento").forEach((el) => {
      el.addEventListener("click", () => {
        const eid = Number(el.getAttribute("data-eid"));
        const evento = state.eventos.find((e) => e.id === eid);
        if (evento) filtrarPorEvento(evento);
      });
    });

    // modal venda
    $("#btn-fechar-venda")?.addEventListener("click", () => { state.showModalVenda = false; state.vendaSelecionada = null; render(); });

    // Saque
    $("#btn-sacar", root)?.addEventListener("click", () => { state.modalSaqueVisible = true; render(); });
    $("#btn-cancelar-saque")?.addEventListener("click", () => { state.modalSaqueVisible = false; render(); });
    $("#btn-confirmar-saque")?.addEventListener("click", () => {
      const input = $("#input-saque-valor");
      const valor = Math.max(0, parseFloat((input?.value || "0").replace(",", ".")));
      const emCentavos = Math.round(valor * 100);
      if (!valor || emCentavos <= 0) return alert("Informe um valor válido.");
      if (emCentavos > state.summary.saldo_centavos) return alert("Saldo insuficiente.");
      state.summary.saldo_centavos -= emCentavos;
      state.modalSaqueVisible = false;
      alert(`Saque de R$ ${valor.toFixed(2)} solicitado!`);
      render();
    });
  }

  // ----- sub-views -----
  function card(label, value) {
    return `
      <div class="card-resumo">
        <div class="label">${label}</div>
        <div class="valor">${value}</div>
      </div>
    `;
  }
  function cardEventos() {
    return `
      <div class="card-resumo">
        <div class="label">Eventos Ativos</div>
        <div class="valor">${state.summary.eventos}</div>
        <button id="btn-sel-evento" class="btn-action" style="width:100%; margin-top:8px;">Selecionar Evento</button>
      </div>
    `;
  }
  function campanhaItem(item) {
    const bg = hexWithAlpha(item.cor, 0.13);
    const bd = hexWithAlpha(item.cor, 0.33);
    const tagBg = hexWithAlpha(item.cor, 0.13);
    const tagBd = hexWithAlpha(item.cor, 0.33);
    return `
      <div class="campanha" style="border-color:${bd}">
        <div class="tag" style="border-color:${tagBd}; background:${tagBg};">
          <span style="font-size:10px; font-weight:800; letter-spacing:.5px; color:${item.cor}">${item.tag.toUpperCase()}</span>
        </div>
        <div class="titulo">${item.titulo}</div>
        <div class="subtitulo">${item.subtitulo}</div>
        <div class="sugestao">${item.sugestao}</div>
        <button class="btn btn-campanha-acao" data-cid="${item.id}" style="border-color:${bd}; background:${bg};"> ${item.acao} </button>
      </div>
    `;
  }
  function vendaItem(v) {
    return `
      <div class="item-venda" data-vid="${v.id}">
        <div class="icon">💳</div>
        <div style="flex:1">
          <div class="texto">${v.texto}</div>
          <div class="quando">${tempoRelativo(v.ts)}</div>
        </div>
      </div>
    `;
  }
  function hexWithAlpha(hex, alpha) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ----- Ações -----
  function getVendasFiltradas(){
    if (state.periodo !== "hoje") return state.notificacoesVendas;
    return state.notificacoesVendas.filter(v => isSameDay(v.ts, new Date()));
  }

  function handlePeriodo(novoPeriodo) {
    state.periodo = novoPeriodo;
    // Simulação simples de variação de métricas
    let mult = 1;
    if (novoPeriodo === "hoje") mult = 0.25;
    else if (novoPeriodo === "30d") mult = 4;
    else if (novoPeriodo === "ano") mult = 10;
    else mult = 1; // 7d

    state.summary.ingressos_7d = Math.max(0, Math.round(300 * mult));
    state.summary.receita_centavos = Math.max(0, Math.round(500000 * mult));
    state.summary.participantes_unicos = Math.max(0, Math.round(289 * mult));
    state.summary.checkins = Math.max(0, Math.round(214 * mult));
    state.summary.eventos = Math.max(1, Math.round(9 * (mult <= 1 ? 1 : mult/2)));
    render();
  }

  function filtrarPorEvento(evento) {
    state.eventoSelecionado = evento;
    state.modalEventosVisible = false;
    alert(`Dashboard ajustado para ${evento.nome}`);
    state.summary.ingressos_7d = Math.floor(Math.random() * 400);
    state.summary.receita_centavos = Math.floor(Math.random() * 800000);
    state.summary.participantes_unicos = Math.floor(Math.random() * 500);
    state.summary.checkins = Math.floor(Math.random() * 300);
    render();
  }

  // ----- Intervalo de “tempo real” -----
  setInterval(() => {
    state.summary.ingressos_7d += Math.floor(Math.random() * 5);
    state.summary.receita_centavos += Math.floor(Math.random() * 2000);

    const valor = (50 + Math.floor(Math.random() * 200)).toFixed(2);
    const venda = {
      id: String(Date.now()),
      tipo: "venda",
      texto: "Venda confirmada (+R$ " + valor + ")",
      valor: Number(valor),
      produto: ["Ingresso VIP", "Camarote", "Área Premium", "Pista"].sort(() => 0.5 - Math.random())[0],
      ts: new Date(),
    };
    state.notificacoesVendas = [venda, ...state.notificacoesVendas].slice(0, 50);

    const i = Math.floor(Math.random() * state.campanhasIA.length);
    state.campanhasIA[i] = { ...state.campanhasIA[i], qtd: state.campanhasIA[i].qtd + Math.floor(Math.random() * 3) };

    render();
  }, 3000);

  // inicializa
  render();
})();
