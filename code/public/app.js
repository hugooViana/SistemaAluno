let usuarioAtual = JSON.parse(localStorage.getItem('usuarioAtual')) || null;

function mostrarConteudo(conteudo) {
    document.getElementById('conteudo').innerHTML = conteudo;
}

function atualizarMenu() {
    const menu = document.getElementById('menu');
    menu.innerHTML = '';

    if (usuarioAtual) {
        if (usuarioAtual.tipo === 'aluno') {
            menu.innerHTML = `
                <ul>
                    <li><a href="#" onclick="navegarPara('extrato')">Extrato</a></li>
                    <li><a href="#" onclick="navegarPara('vantagens')">Resgatar Vantagem</a></li>
                    <li><a href="#" onclick="logout()">Sair</a></li>
                </ul>
            `;
        } else if (usuarioAtual.tipo === 'professor') {
            menu.innerHTML = `
                <ul>
                    <li><a href="#" onclick="navegarPara('enviarMoedas')">Enviar Moedas</a></li>
                    <li><a href="#" onclick="navegarPara('extrato')">Extrato</a></li>
                    <li><a href="#" onclick="logout()">Sair</a></li>
                </ul>
            `;
        } else if (usuarioAtual.tipo === 'empresa') {
            menu.innerHTML = `
                <ul>
                    <li><a href="#" onclick="navegarPara('cadastrarVantagem')">Cadastrar Vantagem</a></li>
                    <li><a href="#" onclick="logout()">Sair</a></li>
                </ul>
            `;
        }
    } else {
        menu.innerHTML = `
            <ul>
                <li><a href="#" onclick="navegarPara('login')">Login</a></li>
                <li><a href="#" onclick="navegarPara('cadastro')">Cadastro</a></li>
            </ul>
        `;
    }
}

function navegarPara(pagina) {
    switch (pagina) {
        case 'login':
            mostrarLogin();
            break;
        case 'cadastro':
            mostrarCadastro();
            break;
        case 'extrato':
            consultarExtrato();
            break;
        case 'vantagens':
            listarVantagens();
            break;
        case 'enviarMoedas':
            enviarMoedas();
            break;
        case 'cadastrarVantagem':
            cadastrarVantagem();
            break;
        default:
            mostrarLogin();
    }
}

function mostrarLogin() {
    mostrarConteudo(`
        <h2>Login</h2>
        <form id="loginForm">
            <label for="email">E-mail:</label>
            <input type="email" id="email" required>
            <label for="senha">Senha:</label>
            <input type="password" id="senha" required>
            <button type="submit">Entrar</button>
        </form>
    `);

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                usuarioAtual = data;
                localStorage.setItem('usuarioAtual', JSON.stringify(usuarioAtual));
                atualizarMenu();
                alert('Login realizado com sucesso!');
                navegarPara(usuarioAtual.tipo === 'aluno' ? 'extrato' : usuarioAtual.tipo === 'professor' ? 'enviarMoedas' : 'cadastrarVantagem');
            } else {
                alert(data.mensagem);
            }
        } catch (error) {
            alert('Erro ao fazer login');
        }
    });
}

function mostrarCadastro() {
    mostrarConteudo(`
        <h2>Cadastro</h2>
        <form id="cadastroForm">
            <label for="tipoUsuario">Tipo de Usuário:</label>
            <select id="tipoUsuario" required>
                <option value="">Selecione o tipo de usuário</option>
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="empresa">Empresa</option>
            </select>
            <div id="camposCadastro"></div>
            <button type="submit">Cadastrar</button>
        </form>
    `);

    const tipoUsuario = document.getElementById('tipoUsuario');
    const camposCadastro = document.getElementById('camposCadastro');

    tipoUsuario.addEventListener('change', () => {
        switch (tipoUsuario.value) {
            case 'aluno':
                camposCadastro.innerHTML = `
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome" required>
                    <label for="email">E-mail:</label>
                    <input type="email" id="email" name="email" required>
                    <label for="senha">Senha:</label>
                    <input type="password" id="senha" name="senha" required>
                    <label for="cpf">CPF:</label>
                    <input type="text" id="cpf" name="cpf" required>
                    <label for="rg">RG:</label>
                    <input type="text" id="rg" name="rg" required>
                    <label for="endereco">Endereço:</label>
                    <input type="text" id="endereco" name="endereco" required>
                    <label for="instituicao_id">Instituição:</label>
                    <select id="instituicao_id" name="instituicao_id" required>
                        <option value="">Selecione uma instituição</option>
                    </select>
                    <label for="curso">Curso:</label>
                    <input type="text" id="curso" name="curso" required>
                `;
                carregarInstituicoes();
                break;
            case 'professor':
                camposCadastro.innerHTML = `
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome" required>
                    <label for="email">E-mail:</label>
                    <input type="email" id="email" name="email" required>
                    <label for="senha">Senha:</label>
                    <input type="password" id="senha" name="senha" required>
                    <label for="cpf">CPF:</label>
                    <input type="text" id="cpf" name="cpf" required>
                    <label for="instituicao_id">Instituição:</label>
                    <select id="instituicao_id" name="instituicao_id" required>
                        <option value="">Selecione uma instituição</option>
                    </select>
                    <label for="departamento">Departamento:</label>
                    <input type="text" id="departamento" name="departamento" required>
                `;
                carregarInstituicoes();
                break;
            case 'empresa':
                camposCadastro.innerHTML = `
                    <label for="nome">Nome da Empresa:</label>
                    <input type="text" id="nome" name="nome" required>
                    <label for="email">E-mail:</label>
                    <input type="email" id="email" name="email" required>
                    <label for="senha">Senha:</label>
                    <input type="password" id="senha" name="senha" required>
                `;
                break;
            default:
                camposCadastro.innerHTML = '';
        }
    });

    document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = document.getElementById('tipoUsuario').value;
        const formData = new FormData(e.target);
        const dadosCadastro = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/cadastro/${tipo}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCadastro)
            });

            const data = await response.json();

            if (response.ok) {
                alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} cadastrado com sucesso!`);
                navegarPara('login');
            } else {
                alert(`Erro ao cadastrar ${tipo}: ${data.mensagem}`);
            }
        } catch (error) {
            if (error.response) {
                const errorData = await error.response.json();
                alert(`Erro ao cadastrar ${tipo}: ${errorData.mensagem}`);
            } else {
                alert(`Erro ao cadastrar ${tipo}: ${error.message}`);
            }
        }
    });
}

function carregarInstituicoes() {
  fetch('/instituicoes')
    .then(response => response.json())
    .then(instituicoes => {
      const selectInstituicao = document.getElementById('instituicao_id');
      selectInstituicao.innerHTML = '<option value="">Selecione uma instituição</option>';
      instituicoes.forEach(instituicao => {
        const option = document.createElement('option');
        option.value = instituicao.id;
        option.textContent = instituicao.nome;
        selectInstituicao.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar instituições:', error);
    });
}

function enviarMoedas() {
    mostrarConteudo(`
        <h2>Enviar Moedas</h2>
        <form id="enviarMoedasForm">
            <label for="aluno">Aluno:</label>
            <select id="aluno" required>
                <!-- Opções de alunos serão carregadas dinamicamente -->
            </select>
            <label for="quantidade">Quantidade de Moedas:</label>
            <input type="number" id="quantidade" required min="1">
            <label for="motivo">Motivo:</label>
            <textarea id="motivo" required></textarea>
            <button type="submit">Enviar Moedas</button>
        </form>
    `);

    fetch('/alunos')
        .then(response => response.json())
        .then(alunos => {
            const selectAluno = document.getElementById('aluno');
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id;
                option.textContent = aluno.nome;
                selectAluno.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar lista de alunos:', error);
        });

    document.getElementById('enviarMoedasForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const aluno_id = document.getElementById('aluno').value;
        const quantidade = document.getElementById('quantidade').value;
        const motivo = document.getElementById('motivo').value;

        try {
            const response = await fetch('/enviar-moedas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professor_id: usuarioAtual.id, aluno_id, quantidade, motivo })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Moedas enviadas com sucesso!');
                navegarPara('extrato');
            } else {
                alert(data.mensagem);
            }
        } catch (error) {
            alert('Erro ao enviar moedas');
        }
    });
}

function consultarExtrato() {
    fetch(`/extrato/${usuarioAtual.id}`)
    .then(response => response.json())
    .then(data => {
        let conteudo = `
            <h2>Extrato</h2>
            <p>Saldo atual: ${data.saldo} moedas</p>
            <h3>Transações:</h3>
            <ul>
        `;

        data.transacoes.forEach(transacao => {
            conteudo += `
                <li>
                    ${transacao.remetente_id === usuarioAtual.id ? 'Enviou' : 'Recebeu'}
                    ${transacao.quantidade_moedas} moedas
                    ${transacao.motivo ? `- Motivo: ${transacao.motivo}` : ''}
                    (${new Date(transacao.data_transacao).toLocaleString()})
                </li>
            `;
        });

        conteudo += '</ul>';
        mostrarConteudo(conteudo);
    })
    .catch(error => {
        alert('Erro ao consultar extrato');
    });
}

function cadastrarVantagem() {
    mostrarConteudo(`
        <h2>Cadastrar Vantagem</h2>
        <form id="cadastrarVantagemForm">
            <label for="nome">Nome da Vantagem:</label>
            <input type="text" id="nome" required>
            <label for="descricao">Descrição:</label>
            <textarea id="descricao" required></textarea>
            <label for="custo_moedas">Custo em Moedas:</label>
            <input type="number" id="custo_moedas" required min="1">
            <label for="foto_url">URL da Foto:</label>
            <input type="url" id="foto_url" required>
            <button type="submit">Cadastrar Vantagem</button>
        </form>
    `);

    document.getElementById('cadastrarVantagemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const descricao = document.getElementById('descricao').value;
        const custo_moedas = document.getElementById('custo_moedas').value;
        const foto_url = document.getElementById('foto_url').value;

        try {
            const response = await fetch('/cadastrar-vantagem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresa_id: usuarioAtual.id, nome, descricao, custo_moedas, foto_url })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Vantagem cadastrada com sucesso!');
                document.getElementById('cadastrarVantagemForm').reset();
            } else {
                alert(`Erro ao cadastrar vantagem: ${data.mensagem}`);
            }
        } catch (error) {
            alert(`Erro ao cadastrar vantagem: ${error.message}`);
        }
    });
}

function listarVantagens() {
    fetch('/vantagens')
    .then(response => response.json())
    .then(vantagens => {
        let conteudo = `
            <h2>Vantagens Disponíveis</h2>
            <div id="listaVantagens">
        `;

        vantagens.forEach(vantagem => {
            conteudo += `
                <div class="card">
                    <h3>${vantagem.nome}</h3>
                    <p>${vantagem.descricao}</p>
                    <p>Custo: ${vantagem.custo_moedas} moedas</p>
                    <img src="${vantagem.foto_url}" alt="${vantagem.nome}" style="max-width: 200px;">
                    <button onclick="resgatarVantagem(${vantagem.id})">Resgatar</button>
                </div>
            `;
        });

        conteudo += '</div>';
        mostrarConteudo(conteudo);
    })
    .catch(error => {
        alert('Erro ao listar vantagens');
    });
}

function resgatarVantagem(vantagem_id) {
    fetch('/resgatar-vantagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: usuarioAtual.id, vantagem_id })
    })
    .then(response => response.json())
    .then(data => {
        if (data.codigo_cupom) {
            alert(`Vantagem resgatada com sucesso! Seu código de cupom é: ${data.codigo_cupom}`);
            navegarPara('extrato');
        } else {
            alert(data.mensagem || 'Erro ao resgatar vantagem');
        }
    })
    .catch(error => {
        console.error('Erro ao resgatar vantagem:', error);
        alert('Erro ao resgatar vantagem. Por favor, tente novamente.');
    });
}

function logout() {
    usuarioAtual = null;
    localStorage.removeItem('usuarioAtual');
    atualizarMenu();
    navegarPara('login');
}

// Inicialização
atualizarMenu();
if (usuarioAtual) {
    navegarPara(usuarioAtual.tipo === 'aluno' ? 'extrato' : usuarioAtual.tipo === 'professor' ? 'enviarMoedas' : 'cadastrarVantagem');
} else {
    navegarPara('login');
}