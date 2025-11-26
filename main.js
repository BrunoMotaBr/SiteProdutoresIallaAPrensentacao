const BASE_URL = 'https://apiiallas.onrender.com';
window.BASE_URL = BASE_URL;

async function verificarEmail() {
  const email = document.getElementById('email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('E-mail inválido.');
    return;
  }

  try {
    const url = `${BASE_URL}/checarEmail/${encodeURIComponent(email)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.resposta === true) {
      window.location.href = `./cadastreSe.html?email=${encodeURIComponent(email)}`;
    } else {
      alert(data.mensagem);
    }
  } catch (e) {
    alert("Erro desconhecido, não foi possível acessar os dados.");
    console.error(e);
  }
}

async function cadastrarEmpresa() {
  const email = document.getElementById("email").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const CNPJ = document.getElementById("CNPJ").value.trim();
  const cidade = document.getElementById("cidade").value.trim();
  const estado = document.getElementById("estado").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const csenha = document.getElementById("csenha").value.trim();

  if (senha !== csenha) {
    alert("As senhas não conferem!");
    return;
  }

  const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.,;])[A-Za-z\d@$!%*?&#.,;]{8,}$/;
  if (!regexSenha.test(senha)) {
    alert("A senha deve conter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.");
    return;
  }

  try {
    const cidadeResp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
    if (!cidadeResp.ok) {
      alert("Não foi possível validar o estado informado. Verifique a sigla do estado (ex: SP, RJ).");
      return;
    }

    const cidades = await cidadeResp.json();
    const cidadeExiste = cidades.some(c => c.nome.toLowerCase() === cidade.toLowerCase());

    if (!cidadeExiste) {
      alert(`A cidade "${cidade}" não existe no estado "${estado}".`);
      return;
    }
  } catch (error) {
    console.error("Erro ao validar cidade:", error);
    alert("Erro ao validar cidade. Tente novamente mais tarde.");
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/cadastrarEmpresa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        nome,
        cnpj: CNPJ,
        cidade,
        estado,
        senha,
      }),
    });

    const data = await resp.json();

    if (resp.ok && data.resposta) {
      alert("Empresa cadastrada com sucesso!");
      window.location.href = `./login.html`;
    } else {
      alert(`Erro ao cadastrar: ${data.mensagem || "Tente novamente."}`);
    }
  } catch (error) {
    console.error("Erro ao enviar dados:", error);
    alert("Erro na comunicação com o servidor.");
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  try {
    const url = `${BASE_URL}/checarEmail/${encodeURIComponent(email)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.resposta) {
      const respLogin = await fetch(`${BASE_URL}/realizarLoginEmpresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dataLogin = await respLogin.json();

      if (dataLogin.resposta) {
        alert(dataLogin.mensagem);
        window.location.href = `./dashboard.html?id=${dataLogin.empresa}`;
      } else {
        alert(dataLogin.mensagem);
        return;
      }
    } else {
      alert("Email não possui cadastro!");
      return;
    }
  } catch (e) {
    alert("Erro desconhecido, não foi possível acessar os dados.");
    console.error(e);
  }
}

async function uploadImagemPerfil(empresaId, arquivo) {
  const formImg = new FormData();
  formImg.append("tipo", "foto_perfil");
  formImg.append("arquivo", arquivo);
  formImg.append("empresaId", empresaId);

  const resp = await fetch(`${BASE_URL}/upload-imagem`, {
    method: "POST",
    body: formImg,
  });

  let data;
  try {
    data = await resp.json();
  } catch (e) {
    console.error("Erro ao ler JSON do upload:", e);
    throw new Error("Resposta inválida do servidor no upload de imagem.");
  }

  return { resp, data };
}

async function pegarDados(id) {
  const resp = await fetch(`${BASE_URL}/pegarDadosPerfilEmpresa/${id}`);
  const json = await resp.json();
  return [json, BASE_URL];
}

window.verificarEmail = verificarEmail;
window.cadastrarEmpresa = cadastrarEmpresa;
window.login = login;
window.uploadImagemPerfil = uploadImagemPerfil;
window.pegarDados = pegarDados;
