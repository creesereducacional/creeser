import fs from 'fs';
import path from 'path';

const noticiasFilePath = path.join(process.cwd(), 'data', 'noticias.json');

const withLowercaseKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const lowered = {};
  Object.entries(obj).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return { ...obj, ...lowered };
};

const getBodyValue = (body, key) => {
  if (!body) return undefined;
  return body[key] ?? body[key.toLowerCase()];
};

// Função para ler notícias
function lerNoticias() {
  try {
    if (!fs.existsSync(noticiasFilePath)) {
      fs.writeFileSync(noticiasFilePath, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(noticiasFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler notícias:', error);
    return [];
  }
}

// Função para salvar notícias
function salvarNoticias(noticias) {
  try {
    fs.writeFileSync(noticiasFilePath, JSON.stringify(noticias, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar notícias:', error);
    return false;
  }
}

export default function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        const { id } = req.query;
        const noticias = lerNoticias();
        
        if (id) {
          const noticia = noticias.find(n => n.id === parseInt(id));
          if (!noticia) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
          }
          return res.status(200).json(withLowercaseKeys(noticia));
        }
        
        return res.status(200).json(noticias.map(withLowercaseKeys));
      }

      case 'POST': {
        const noticias = lerNoticias();
        const novaNoticia = {
          id: Date.now(),
          titulo: getBodyValue(req.body, 'titulo'),
          resumo: getBodyValue(req.body, 'resumo'),
          conteudo: getBodyValue(req.body, 'conteudo'),
          imagem: getBodyValue(req.body, 'imagem') || '',
          autor: getBodyValue(req.body, 'autor') || 'IGEPPS',
          categoria: getBodyValue(req.body, 'categoria') || 'Geral',
          ativo: getBodyValue(req.body, 'ativo') !== false,
          dataCriacao: new Date().toISOString(),
          dataPublicacao: getBodyValue(req.body, 'dataPublicacao') || new Date().toISOString()
        };
        noticias.unshift(novaNoticia); // Adiciona no início
        salvarNoticias(noticias);
        return res.status(201).json(withLowercaseKeys(novaNoticia));
      }

      case 'PUT': {
        const { id } = req.body;
        const noticias = lerNoticias();
        const noticiaIndex = noticias.findIndex(n => n.id === id);
        
        if (noticiaIndex === -1) {
          return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        noticias[noticiaIndex] = {
          ...noticias[noticiaIndex],
          titulo: getBodyValue(req.body, 'titulo'),
          resumo: getBodyValue(req.body, 'resumo'),
          conteudo: getBodyValue(req.body, 'conteudo'),
          imagem: getBodyValue(req.body, 'imagem') || noticias[noticiaIndex].imagem,
          autor: getBodyValue(req.body, 'autor') || noticias[noticiaIndex].autor,
          categoria: getBodyValue(req.body, 'categoria') || noticias[noticiaIndex].categoria,
          ativo: getBodyValue(req.body, 'ativo') !== undefined ? getBodyValue(req.body, 'ativo') : noticias[noticiaIndex].ativo,
          dataPublicacao: getBodyValue(req.body, 'dataPublicacao') || noticias[noticiaIndex].dataPublicacao
        };

        salvarNoticias(noticias);
        return res.status(200).json(withLowercaseKeys(noticias[noticiaIndex]));
      }

      case 'DELETE': {
        const { id } = req.query;
        const noticias = lerNoticias();
        const novasNoticias = noticias.filter(n => n.id !== parseInt(id));
        
        if (noticias.length === novasNoticias.length) {
          return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        salvarNoticias(novasNoticias);
        return res.status(200).json({ message: 'Notícia excluída com sucesso' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
