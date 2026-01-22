Set-StrictMode -Version Latest
$root = (Get-Location).Path

# criar pastas
$dirs = @(
  "$root\pages\api",
  "$root\pages\admin",
  "$root\components",
  "$root\lib"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Path $d -Force | Out-Null }

# pages/api/usuarios.js
@'
let usuarios = [
  { 
    id: 1, 
    nomeCompleto: "Admin Sistema", 
    email: "admin@igepps.com", 
    senha: "admin123", 
    tipo: "admin",
    cpf: "000.000.000-00",
    dataNascimento: "1990-01-01",
    whatsapp: "(11) 99999-9999",
    dataCriacao: "2025-11-14",
    status: "ativo"
  }
];

export default function handler(req, res) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const { tipo } = query;
    if (tipo) return res.status(200).json(usuarios.filter(u => u.tipo === tipo));
    return res.status(200).json(usuarios);
  }

  if (method === 'POST') {
    const { nomeCompleto, email, senha, cpf, dataNascimento, whatsapp, tipo } = body;
    if (!nomeCompleto || !email || !senha || !cpf || !dataNascimento || !whatsapp || !tipo) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    if (usuarios.some(u => u.cpf === cpf)) return res.status(409).json({ error: 'CPF já cadastrado' });
    if (usuarios.some(u => u.email === email)) return res.status(409).json({ error: 'Email já cadastrado' });

    const novo = {
      id: Math.max(...usuarios.map(u => u.id),0) + 1,
      nomeCompleto, email, senha, cpf, dataNascimento, whatsapp, tipo,
      dataCriacao: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };
    usuarios.push(novo);
    return res.status(201).json({ message: 'Usuário criado com sucesso', usuario: novo });
  }

  if (method === 'PUT') {
    const { id } = query;
    const idx = usuarios.findIndex(u => u.id === parseInt(id));
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { nomeCompleto, email, cpf, dataNascimento, whatsapp, tipo, status } = body;

    if (cpf && cpf !== usuarios[idx].cpf && usuarios.some(u => u.cpf === cpf)) return res.status(409).json({ error: 'CPF já cadastrado' });
    if (email && email !== usuarios[idx].email && usuarios.some(u => u.email === email)) return res.status(409).json({ error: 'Email já cadastrado' });

    usuarios[idx] = { ...usuarios[idx], nomeCompleto: nomeCompleto || usuarios[idx].nomeCompleto, email: email || usuarios[idx].email, cpf: cpf || usuarios[idx].cpf, dataNascimento: dataNascimento || usuarios[idx].dataNascimento, whatsapp: whatsapp || usuarios[idx].whatsapp, tipo: tipo || usuarios[idx].tipo, status: status || usuarios[idx].status };

    return res.status(200).json({ message: 'Usuário atualizado com sucesso', usuario: usuarios[idx] });
  }

  if (method === 'DELETE') {
    const { id } = query;
    const idx = usuarios.findIndex(u => u.id === parseInt(id));
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
    const removed = usuarios.splice(idx,1)[0];
    return res.status(200).json({ message: 'Usuário deletado com sucesso', usuario: removed });
  }

  res.status(405).json({ error: 'Método não permitido' });
}
'@ | Out-File -Encoding UTF8 -Force "$root\pages\api\usuarios.js"

# lib/usuariosService.js
@'
export const usuariosService = {
  listarTodos: async () => {
    const res = await fetch("/api/usuarios");
    return await res.json();
  },
  listarPorTipo: async (tipo) => {
    const res = await fetch(`/api/usuarios?tipo=${tipo}`);
    return await res.json();
  },
  criar: async (usuario) => {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario)
    });
    return await res.json();
  },
  atualizar: async (id, usuario) => {
    const res = await fetch(`/api/usuarios?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario)
    });
    return await res.json();
  },
  deletar: async (id) => {
    const res = await fetch(`/api/usuarios?id=${id}`, { method: "DELETE" });
    return await res.json();
  }
};
'@ | Out-File -Encoding UTF8 -Force "$root\lib\usuariosService.js"

# lib/formatters.js
@'
export const formatters = {
  somenteDigitos: (s = "") => (s || "").replace(/\D/g, ""),
  formatarCPF: (cpf = "") => {
    const d = (cpf||"").replace(/\D/g, "");
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0,14);
  },
  formatarWhatsApp: (w = "") => {
    const d = (w||"").replace(/\D/g, "");
    return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").slice(0,15);
  },
  formatarData: (d) => d ? new Date(d).toLocaleDateString("pt-BR") : ""
};
'@ | Out-File -Encoding UTF8 -Force "$root\lib\formatters.js"

# components/AdminHeader.js
@'
import { useRouter } from "next/router";

export default function AdminHeader({ usuario }) {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.push("/login");
  };
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">EAD IGEPPS - Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700"><strong>{usuario?.nomeCompleto || usuario?.nome}</strong></span>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">👑 Admin</span>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sair</button>
        </div>
      </div>
    </header>
  );
}
'@ | Out-File -Encoding UTF8 -Force "$root\components\AdminHeader.js"

# components/AdminSidebar.js
@'
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminSidebar() {
  const router = useRouter();
  const isActive = (path) => router.pathname === path ? "bg-blue-600 text-white" : "hover:bg-gray-100";
  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0">
      <nav className="p-6 space-y-2">
        <h3 className="text-gray-500 text-xs font-bold uppercase mb-4">Menu</h3>
        <Link href="/admin/dashboard"><a className={`block px-4 py-2 rounded ${isActive("/admin/dashboard")}`}>📊 Dashboard</a></Link>
        <Link href="/admin/usuarios"><a className={`block px-4 py-2 rounded ${isActive("/admin/usuarios")}`}>👥 Usuários</a></Link>
      </nav>
    </aside>
  );
}
'@ | Out-File -Encoding UTF8 -Force "$root\components\AdminSidebar.js"

# components/AdminUsuarios.js
@'
import { useEffect, useState } from "react";
import InputMask from "react-input-mask";
import { usuariosService } from "@/lib/usuariosService";
import { formatters } from "@/lib/formatters";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    senha: "",
    cpf: "",
    dataNascimento: "",
    whatsapp: "",
    tipo: "aluno",
    status: "ativo"
  });

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setCarregando(true);
    try { const d = await usuariosService.listarTodos(); setUsuarios(d); } catch { setErro("Erro ao carregar"); }
    setCarregando(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErro(""); setSucesso("");
    if (!form.nomeCompleto || !form.email || !form.senha || !form.cpf || !form.dataNascimento || !form.whatsapp) { setErro("Preencha todos os campos obrigatórios"); return; }
    try {
      if (editando) {
        const res = await usuariosService.atualizar(editando.id, form);
        if (res.message) { setSucesso("Atualizado"); setEditando(null); }
        else setErro(res.error || "Erro ao atualizar");
      } else {
        const res = await usuariosService.criar(form);
        if (res.message) setSucesso("Criado");
        else setErro(res.error || "Erro ao criar");
      }
      setForm({ nomeCompleto: "", email: "", senha: "", cpf: "", dataNascimento: "", whatsapp: "", tipo: "aluno", status: "ativo" });
      setMostrarFormulario(false);
      carregar();
    } catch {
      setErro("Erro na operação");
    }
  };

  const editar = (u) => {
    setEditando(u);
    setForm({ nomeCompleto: u.nomeCompleto, email: u.email, senha: u.senha, cpf: u.cpf, dataNascimento: u.dataNascimento, whatsapp: u.whatsapp, tipo: u.tipo, status: u.status });
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deletar = async (id) => {
    if (!confirm("Confirma exclusão?")) return;
    const res = await usuariosService.deletar(id);
    if (res.message) { setSucesso("Deletado"); carregar(); } else setErro(res.error || "Erro");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold">Gerenciar Usuários</h2><p className="text-sm text-gray-600">Total: {usuarios.length}</p></div>
        <button onClick={() => { setMostrarFormulario(!mostrarFormulario); setEditando(null); }} className="bg-blue-600 text-white px-4 py-2 rounded"> {mostrarFormulario ? "✕ Cancelar" : "+ Novo Usuário"} </button>
      </div>

      {erro && <div className="bg-red-100 p-3 rounded text-red-700">{erro}</div>}
      {sucesso && <div className="bg-green-100 p-3 rounded text-green-700">{sucesso}</div>}

      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold">Nome Completo *</label>
            <input name="nomeCompleto" value={form.nomeCompleto} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-semibold">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-semibold">Senha *</label>
            <input name="senha" type="password" value={form.senha} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-semibold">CPF *</label>
            <InputMask mask="999.999.999-99" value={form.cpf} onChange={handleChange}>
              {(inputProps) => <input {...inputProps} name="cpf" className="w-full border rounded px-3 py-2" required />}
            </InputMask>
          </div>

          <div>
            <label className="block text-sm font-semibold">Data de Nascimento *</label>
            <input name="dataNascimento" type="date" value={form.dataNascimento} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-semibold">WhatsApp *</label>
            <InputMask mask="(99) 99999-9999" value={form.whatsapp} onChange={handleChange}>
              {(inputProps) => <input {...inputProps} name="whatsapp" className="w-full border rounded px-3 py-2" required />}
            </InputMask>
          </div>

          <div>
            <label className="block text-sm font-semibold">Tipo *</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="aluno">Aluno</option>
              <option value="professor">Professor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold">Status *</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editando ? "Atualizar" : "Criar"}</button>
            <button type="button" onClick={() => { setMostrarFormulario(false); setEditando(null); setForm({ nomeCompleto: "", email: "", senha: "", cpf: "", dataNascimento: "", whatsapp: "", tipo: "aluno", status: "ativo" }); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      {carregando ? <div>Carregando...</div> : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">CPF</th>
                <th className="p-3 text-left">WhatsApp</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.nomeCompleto}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.cpf}</td>
                  <td className="p-3">{u.whatsapp}</td>
                  <td className="p-3">{u.tipo}</td>
                  <td className="p-3">{u.status}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => editar(u)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Editar</button>
                    <button onClick={() => deletar(u.id)} className="bg-red-500 text-white px-2 py-1 rounded">Deletar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
'@ | Out-File -Encoding UTF8 -Force "$root\components\AdminUsuarios.js"

# pages/admin/usuarios.js
@'
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import AdminUsuarios from "@/components/AdminUsuarios";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usu = localStorage.getItem("usuario");
    if (!usu) { router.push("/login"); return; }
    const u = JSON.parse(usu);
    if (u.tipo !== "admin") { router.push("/dashboard"); return; }
    setUsuario(u);
  }, [router]);

  if (!usuario) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader usuario={usuario} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <AdminUsuarios />
        </main>
      </div>
    </div>
  );
}
'@ | Out-File -Encoding UTF8 -Force "$root\pages\admin\usuarios.js"

Write-Host '✓ Módulo admin/usuarios criado/atualizado.' -ForegroundColor Green
Write-Host 'Execute: npm install react-input-mask  (se ainda não instalou) e reinicie o dev server: npm run dev' -ForegroundColor Yellow