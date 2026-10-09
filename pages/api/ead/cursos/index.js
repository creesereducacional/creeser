import { obterCursosEAD } from '../../../../lib/ead/cursosStorage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  try {
    const apenasAtivos = req.query.apenas_ativos === 'true' || req.query.ativo === 'true';
    const cursos = await obterCursosEAD(apenasAtivos);
    return res.status(200).json(cursos);
  } catch (error) {
    console.error('Erro na API pública de cursos EAD:', error);
    return res.status(500).json({ error: 'Erro ao carregar cursos EAD' });
  }
}
