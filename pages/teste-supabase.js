import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TesteSupabase() {
  const [dados, setDados] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [configStatus, setConfigStatus] = useState(null);

  useEffect(() => {
    // Verificar configuração
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setConfigStatus({
      url: url ? '✅ Definida' : '❌ Não definida',
      key: key ? '✅ Definida' : '❌ Não definida',
      supabaseClient: supabase ? '✅ Inicializado' : '❌ Não inicializado'
    });

    if (supabase) {
      carregarDados();
    } else {
      setErro('Supabase não foi inicializado. Verifique as variáveis de ambiente em .env.local');
      setLoading(false);
    }
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    const resultado = {};

    try {
      // Testar cada tabela
      const tabelas = [
        'unidades',
        'usuarios',
        'alunos',
        'professores',
        'noticias',
        'matriculadores',
        'grades'
      ];

      for (const tabela of tabelas) {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1);

        if (error) {
          resultado[tabela] = { erro: error.message, registros: 0 };
        } else {
          resultado[tabela] = { erro: null, registros: data?.length || 0, dados: data };
        }
      }

      setDados(resultado);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Teste de Integração Supabase</h1>
      <p>Verificando conexão e dados...</p>

      {/* Status da Configuração */}
      {configStatus && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f4f8', 
          borderRadius: '5px',
          border: '1px solid #b3dfe8'
        }}>
          <h3>⚙️ Status da Configuração</h3>
          <p><strong>URL Supabase:</strong> {configStatus.url}</p>
          <p><strong>Chave Anônima:</strong> {configStatus.key}</p>
          <p><strong>Cliente Supabase:</strong> {configStatus.supabaseClient}</p>
        </div>
      )}

      {loading && <p>⏳ Carregando...</p>}

      {erro && (
        <div style={{ color: 'red', backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <strong>❌ Erro:</strong> {erro}
        </div>
      )}

      {!loading && Object.keys(dados).length > 0 && (
        <div>
          <button
            onClick={carregarDados}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            🔄 Recarregar
          </button>

          {Object.entries(dados).map(([tabela, info]) => (
            <div
              key={tabela}
              style={{
                marginBottom: '20px',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: info.erro ? '#fff3cd' : '#e7f3ff'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>
                {info.erro ? '❌' : '✅'} {tabela}
              </h3>

              {info.erro ? (
                <p style={{ color: 'red', margin: '0' }}>
                  <strong>Erro:</strong> {info.erro}
                </p>
              ) : (
                <div>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>Registros encontrados:</strong> {info.registros}
                  </p>

                  {info.dados && info.dados.length > 0 && (
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#007bff' }}>Ver dados</summary>
                      <pre
                        style={{
                          backgroundColor: '#f5f5f5',
                          padding: '10px',
                          borderRadius: '3px',
                          overflowX: 'auto',
                          fontSize: '12px'
                        }}
                      >
                        {JSON.stringify(info.dados, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <h3>📊 Resumo</h3>
            <p>
              Total de tabelas testadas: <strong>{Object.keys(dados).length}</strong>
            </p>
            <p>
              Tabelas com sucesso: <strong style={{ color: 'green' }}>
                {Object.values(dados).filter(d => !d.erro).length}
              </strong>
            </p>
            <p>
              Tabelas com erro: <strong style={{ color: 'red' }}>
                {Object.values(dados).filter(d => d.erro).length}
              </strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
