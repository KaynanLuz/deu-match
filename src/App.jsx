
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [tela, setTela] = useState('inicio');
  const [participantes, setParticipantes] = useState([]);
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [genero, setGenero] = useState('');
  const [procura, setProcura] = useState('');
  const [foto, setFoto] = useState('');
  const [curtidos, setCurtidos] = useState([]);
  const [busca, setBusca] = useState('');
  const [participanteAtualId, setParticipanteAtualId] = useState(
    () => localStorage.getItem('deuMatchParticipanteId') || ''
  );

  // Para testar no mesmo computador, use localhost.
  // Para celulares na mesma rede Wi-Fi, troque pelo IP local do computador.
  const API_URL = 'https://deu-match-api.onrender.com';

  useEffect(() => {
    if (tela !== 'participantes' || !participanteAtualId) return;

    async function carregarDados() {
      try {
        const [respostaPessoas, respostaCurtidas] = await Promise.all([
          fetch(`${API_URL}/api/participantes?excluirId=${encodeURIComponent(participanteAtualId)}`),
          fetch(`${API_URL}/api/curtidas?deId=${encodeURIComponent(participanteAtualId)}`)
        ]);

        if (!respostaPessoas.ok || !respostaCurtidas.ok) {
          throw new Error('Não foi possível carregar os participantes.');
        }

        const pessoas = await respostaPessoas.json();
        const dadosCurtidas = await respostaCurtidas.json();

        setParticipantes(pessoas);
        setCurtidos(dadosCurtidas.curtidos || []);
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
      }
    }

    carregarDados();
    const intervalo = setInterval(carregarDados, 3000);
    return () => clearInterval(intervalo);
  }, [tela, participanteAtualId]);

  function abrirCadastroOuDescoberta() {
  if (participanteAtualId) {
    setTela('participantes');
  } else {
    setTela('cadastro');
  }
}

  async function cadastrar(e) {
  e.preventDefault();

  // Se já existe um perfil salvo neste navegador,
  // volta para a descoberta em vez de criar outro.
  if (participanteAtualId) {
    setTela('participantes');
    return;
  }

  const novo = {
    nome: nome.trim(),
    idade: Number(idade),
    genero,
    procura,
    foto,
  };

  try {
    const resposta = await fetch(
      `${API_URL}/api/participantes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novo),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao cadastrar.');
    }

    localStorage.setItem('deuMatchParticipanteId', dados.id);
    setParticipanteAtualId(dados.id);
    setNome('');
    setIdade('');
    setGenero('');
    setProcura('');
    setFoto('');
    setCurtidos([]);
    setTela('participantes');
  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    alert(erro.message || 'Não foi possível cadastrar. Tente novamente.');
  }
}

  async function curtir(id) {
    if (!participanteAtualId) {
      alert('Crie seu perfil antes de curtir outras pessoas.');
      setTela('cadastro');
      return;
    }

    const jaCurtiu = curtidos.includes(id);

    try {
      const resposta = await fetch(
        `${API_URL}/api/curtidas`,
        {
          method: jaCurtiu ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deId: participanteAtualId,
            paraId: id,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível registrar a curtida.');
      }

      setCurtidos((lista) =>
        jaCurtiu
          ? lista.filter((item) => item !== id)
          : [...lista, id]
      );

      if (dados.match) {
        alert(`💘 Deu match com ${dados.nome || 'essa pessoa'}!`);
      }
    } catch (erro) {
      console.error('Erro ao registrar curtida:', erro);
      alert(erro.message || 'Não foi possível registrar a curtida.');
    }
  }

  const filtrados = participantes.filter((pessoa) =>
    pessoa.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setTela('inicio')}
          aria-label="Ir para o início"
        >
          <span className="brand-icon">♥</span>
          <span>deu<span className="brand-light">match</span></span>
        </button>

        <span className="online-label">
          <span className="online-dot" />
          EDIÇÃO ESPECIAL
        </span>

        <button
          className="profile-button"
          onClick={abrirCadastroOuDescoberta}
          aria-label={
          participanteAtualId ? 'Ver participantes' : 'Criar perfil'
        }
        >
          <span>＋</span>
        </button>
      </header>

      {tela === 'inicio' && (
        <>
          <section className="hero">
            <div className="hero-content">
              <span className="eyebrow">
                ✦ SUA PRÓXIMA HISTÓRIA COMEÇA AQUI
              </span>

              <h1>
                Uma conexão!
                <span> Um novo começo.</span>
              </h1>

              <p className="hero-description">
                Conheça pessoas novas, descubra afinidades
                e deixe a conexão acontecer.
              </p>

              <button
                className="primary-button"
                onClick={abrirCadastroOuDescoberta}
              >
                Criar meu perfil <span>→</span>
              </button>

              <div className="hero-note">
                <span>♥</span> Novas conexões, boas histórias.
              </div>
            </div>

            <div className="hero-art">
              <div className="glow glow-one" />
              <div className="glow glow-two" />

              <div className="floating-heart heart-one">♥</div>
              <div className="floating-heart heart-two">♥</div>

              <div className="mock-profile">
                <div className="mock-photo">
                  <div className="photo-symbol">✦</div>
                  <span className="photo-caption">
                    SUA PRÓXIMA CONEXÃO
                  </span>
                </div>
                <div className="mock-info">
                  <div>
                    <strong>Uma nova história</strong>
                    <p>Começa com um oi.</p>
                  </div>
                  <div className="mock-heart">♥</div>
                </div>
              </div>

              <div className="floating-card">
                <span>♥</span>
                <div>
                  <strong>Quem sabe?</strong>
                  <small>Seu próximo match pode estar aqui.</small>
                </div>
              </div>
            </div>
          </section>

          <section className="steps-section">
            <div className="section-heading">
              <span className="eyebrow">É MAIS FÁCIL DO QUE PARECE</span>
              <h2>Três passos para conectar.</h2>
            </div>

            <div className="steps-grid">
              <article className="step-card">
                <span className="step-icon">✦</span>
                <small>01</small>
                <h3>Crie seu perfil</h3>
                <p>Coloque sua foto e conte um pouco sobre você.</p>
              </article>

              <article className="step-card">
                <span className="step-icon">♡</span>
                <small>02</small>
                <h3>Descubra pessoas</h3>
                <p>Explore os perfis e curta quem chamou sua atenção.</p>
              </article>

              <article className="step-card">
                <span className="step-icon">♥</span>
                <small>03</small>
                <h3>Deu match!</h3>
                <p>Quando o interesse é recíproco, a magia acontece.</p>
              </article>
            </div>
          </section>
        </>
      )}

      {tela === 'cadastro' && (
        <section className="form-layout">
          <div className="form-intro">
            <span className="eyebrow">BEM-VINDO(A) AO DEU MATCH</span>
            <h1>Vamos criar uma conexão?</h1>
            <p>
              Monte seu perfil e prepare-se para conhecer
              alguém interessante.
            </p>

            <div className="form-decoration">♥</div>
            <div className="form-tip">
              <strong>Uma dica</strong>
              <p>Escolha uma foto em que você se sinta bem!</p>
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-heading">
              <span className="eyebrow">SEU PERFIL</span>
              <h2>Apresente-se 💗</h2>
              <p>Preencha os campos para participar.</p>
            </div>

            <form onSubmit={cadastrar}>
              <label className="upload-box" htmlFor="foto">
                {foto ? (
                  <img src={foto} alt="Prévia do perfil" />
                ) : (
                  <>
                    <span className="upload-icon">＋</span>
                    <strong>Adicione sua foto</strong>
                    <small>Toque para escolher uma imagem</small>
                  </>
                )}
                <span className="upload-edit">
                  {foto ? 'Trocar foto' : 'Foto opcional'}
                </span>
              </label>

              <input
                id="foto"
                className="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (!arquivo) return;

                  if (!arquivo.type.startsWith('image/')) {
                    alert('Selecione um arquivo de imagem.');
                    e.target.value = '';
                    return;
                  }

                  if (arquivo.size > 5 * 1024 * 1024) {
                    alert('Escolha uma foto de até 5 MB.');
                    e.target.value = '';
                    return;
                  }

                  const leitor = new FileReader();
                  leitor.onload = () => setFoto(leitor.result);
                  leitor.readAsDataURL(arquivo);
                }}
              />

              <label htmlFor="nome">Como podemos te chamar?</label>
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome ou apelido"
                maxLength={30}
                required
              />

              <div className="form-row">
                <div>
                  <label htmlFor="idade">Sua idade</label>
                  <input
                    id="idade"
                    type="number"
                    min="18"
                    max="120"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value)}
                    placeholder="18+"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="genero">Gênero</label>
                  <select
                    id="genero"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    <option>Mulher</option>
                    <option>Homem</option>
                    <option>Outro</option>
                    <option>Prefiro não informar</option>
                  </select>
                </div>
              </div>

              <label htmlFor="procura">O que você procura?</label>
              <select
                id="procura"
                value={procura}
                onChange={(e) => setProcura(e.target.value)}
                required
              >
                <option value="">Escolha uma opção</option>
                <option value="Relacionamento">Relacionamento ❤️</option>
                <option value="Algo casual">Algo casual 😏</option>
                <option value="Conhecer pessoas">Conhecer pessoas 🥳</option>
              </select>

              <label className="consent">
                <input type="checkbox" required />
                <span>
                  Tenho 18 anos ou mais, estou solteiro(a) e
                  aceito participar da dinâmica.
                </span>
              </label>

              <button className="primary-button submit-button" type="submit">
                Criar meu perfil <span>→</span>
              </button>
            </form>

            <button
              className="back-button"
              onClick={() => setTela('inicio')}
            >
              ← Voltar ao início
            </button>
          </div>
        </section>
      )}

      {tela === 'participantes' && (
        <section className="discover-section">
          <div className="discover-heading">
            <div>
              <span className="eyebrow">NOVAS CONEXÕES ESPERAM POR VOCÊ</span>
              <h1>Descubra pessoas<span>.</span></h1>
              <p>Alguém por aqui pode despertar seu interesse.</p>
            </div>

            <button
              className="primary-button new-profile-button"
              onClick={() => setTela('cadastro')}
            >
              + Meu perfil
            </button>
          </div>

          <div className="search-bar">
            <span>⌕</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              aria-label="Buscar participantes"
            />
          </div>

          <div className="results-line">
            <strong>Participantes</strong>
            <span>{filtrados.length} perfis</span>
          </div>

          {filtrados.length === 0 ? (
            <div className="empty-state">
              <span>♡</span>
              <h2>A pista está esperando!</h2>
              <p>
                Ainda não há outros perfis disponíveis.
                Assim que outra pessoa se cadastrar, o perfil aparecerá aqui.
              </p>
              <button
                className="primary-button"
                onClick={() => setTela('cadastro')}
              >
                Adicionar perfil
              </button>
            </div>
          ) : (
            <div className="profile-grid">
              {filtrados.map((pessoa) => {
                const curtido = curtidos.includes(pessoa.id);

                return (
                  <article className="profile-card" key={pessoa.id}>
                    <div className="profile-photo">
                      {pessoa.foto ? (
                        <img src={pessoa.foto} alt={`Foto de ${pessoa.nome}`} />
                      ) : (
                        <div className="no-photo">♥</div>
                      )}

                      <span className="profile-tag">SOLTEIRO(A)</span>

                      <button
                        className={`like-button ${curtido ? 'liked' : ''}`}
                        onClick={() => curtir(pessoa.id)}
                        aria-label={
                          curtido
                            ? `Remover interesse em ${pessoa.nome}`
                            : `Demonstrar interesse em ${pessoa.nome}`
                        }
                      >
                        {curtido ? '♥' : '♡'}
                      </button>

                      <div className="profile-overlay">
                        <h2>{pessoa.nome}, {pessoa.idade}</h2>
                        <p>{pessoa.procura}</p>
                      </div>
                    </div>

                    <div className="profile-card-footer">
                      <span>♡</span>
                      <span>{curtido ? 'Você curtiu este perfil' : 'Pode surgir uma conexão'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="demo-notice">
            Protótipo em desenvolvimento: os perfis e as curtidas são gerenciados pelo servidor.
          </p>
        </section>
      )}

      <footer className="footer">
        <span className="footer-brand">♥ deu<span>match</span></span>
        <p>Conexões reais começam com uma atitude.</p>
        <small>Participe com respeito. Conecte-se com leveza.</small>
      </footer>
    </main>
  );
}

export default App;