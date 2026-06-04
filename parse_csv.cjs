const fs = require('fs');

let content = fs.readFileSync('professores.csv', 'utf8');

const lines = content.split(/\r?\n/);
let sql = '-- Script de inserção de professores\n\n';
sql += 'INSERT INTO professores (nome, email, telefone, especialidade, documento) VALUES\n';

const values = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  let row = [];
  let inQuotes = false;
  let currentStr = '';
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentStr);
      currentStr = '';
    } else {
      currentStr += char;
    }
  }
  row.push(currentStr);
  
  let nome = row[0] ? row[0].trim() : '';
  let email = row[1] ? row[1].trim() : '';
  let telefone = row[2] ? row[2].trim().replace(/[^0-9]/g, '') : '';
  let especialidade = row[3] ? row[3].trim() : '';
  let documento = row[4] ? row[4].trim() : '';
  
  // Tratamento básico de encoding latin1 para utf8 de alguns caracteres comuns no PT-BR corrompidos (se houver necessidade)
  const charMap = { 'ǭ': 'á', 'ǜ': 'çã', 'Ǹ': 'é', 'Ǧ': 'ê', 'ǧ': 'ú', 'ǟ': 'Ã' };
  for (const [k, v] of Object.entries(charMap)) {
    nome = nome.split(k).join(v);
    especialidade = especialidade.split(k).join(v);
  }
  // Limpar bugs do console que estavam como interrogacoes
  nome = nome.replace(/\?\?\'?/g, '');
  especialidade = especialidade.replace(/\?\?\'?/g, '');
  
  // Limpar aspas do início e fim caso tenham ficado
  nome = nome.replace(/^"|"$/g, '');
  especialidade = especialidade.replace(/^"|"$/g, '');
  
  nome = nome.replace(/'/g, "''");
  especialidade = especialidade.replace(/'/g, "''");
  
  if (!nome) continue;
  
  const valEmail = email ? `'${email}'` : 'NULL';
  const valTel = telefone ? `'${telefone}'` : 'NULL';
  const valEsp = especialidade ? `'${especialidade}'` : 'NULL';
  const valDoc = documento ? `'${documento}'` : 'NULL';
  
  values.push(`  ('${nome}', ${valEmail}, ${valTel}, ${valEsp}, ${valDoc})`);
}

sql += values.join(',\n') + ';\n';
fs.writeFileSync('import_professores.sql', sql, 'utf8');
console.log('Arquivo import_professores.sql gerado com sucesso.');
