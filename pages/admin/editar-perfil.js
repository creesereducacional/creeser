import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function EditarPerfil() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    foto: null
  });
  const [senhaData, setSenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Carregar dados do usuário
    const usuarioLogado = localStorage.getItem('usuario');
    if (usuarioLogado) {
      const userData = JSON.parse(usuarioLogado);
      setUser(userData);
      setFormData({
        nome: userData.nome || '',
        email: userData.email || '',
        foto: null
      });
      setPreview(userData.foto || null);
    } else {
      router.push('/login');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setSenhaData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        foto: file
      }));
      
      // Preview da foto
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('nome', formData.nome);
      data.append('email', formData.email);
      if (formData.foto) {
        data.append('foto', formData.foto);
      }

      const response = await fetch('/api/usuarios/atualizar-perfil', {
        method: 'POST',
        body: data
      });

      if (response.ok) {
        const result = await response.json();
        // Atualizar localStorage
        const usuarioAtualizado = {
          ...user,
          nome: formData.nome,
          email: formData.email,
          foto: preview
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
        setUser(usuarioAtualizado);
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar perfil: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    
    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      setMessage({ type: 'error', text: 'As senhas não coincidem!' });
      return;
    }

    if (senhaData.novaSenha.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/usuarios/alterar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          senhaAtual: senhaData.senhaAtual,
          novaSenha: senhaData.novaSenha
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setSenhaData({
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        });
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao alterar senha' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <DashboardLayout><div className="text-center py-8">Carregando...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin/dashboard">
            <button className="text-teal-600 hover:text-teal-700 font-medium text-sm sm:text-base">
              ← Voltar
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Editar Perfil</h1>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Coluna de Foto */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 sticky top-20 md:top-24">
              <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4">Foto de Perfil</h2>
              
              <div className="flex flex-col items-center">
                <div className="w-24 md:w-32 h-24 md:h-32 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-3xl md:text-5xl font-bold mb-4 overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    user.nome?.charAt(0).toUpperCase()
                  )}
                </div>
                
                <label className="cursor-pointer">
                  <span className="inline-block px-3 md:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition text-xs md:text-sm font-medium">
                    Alterar Foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Formatos: JPG, PNG, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Coluna de Dados Pessoais e Senha */}
          <div className="md:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-base md:text-lg font-bold text-gray-800 mb-6">Dados Pessoais</h2>
              
              <form onSubmit={handleSalvarPerfil} className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>

            {/* Alterar Senha */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-base md:text-lg font-bold text-gray-800 mb-6">Alterar Senha</h2>
              
              <form onSubmit={handleAlterarSenha} className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    name="senhaAtual"
                    value={senhaData.senhaAtual}
                    onChange={handleSenhaChange}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    name="novaSenha"
                    value={senhaData.novaSenha}
                    onChange={handleSenhaChange}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    name="confirmarSenha"
                    value={senhaData.confirmarSenha}
                    onChange={handleSenhaChange}
                    className="w-full px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
