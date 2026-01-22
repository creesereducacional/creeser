// pages/api/debug-campos.js - DEBUG: Ver exatamente o que está sendo salvo
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const formData = req.body;
    
    console.log('\n📋 DEBUG: Dados recebidos do formulário:');
    console.log(JSON.stringify(formData, null, 2));
    
    console.log('\n🔍 Campos não-vazios:');
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== false && value !== undefined) {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    return res.status(200).json({ 
      sucesso: true,
      totalCampos: Object.keys(formData).length,
      camposPreenchidos: Object.entries(formData).filter(([k, v]) => v !== '' && v !== null && v !== false).length,
      dados: formData
    });
  }
  
  res.status(405).json({ message: 'Método não permitido' });
}
