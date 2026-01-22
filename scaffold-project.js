#!/usr/bin/env node
/**
 * Script de scaffold para projeto Next.js baseado em package.json
 * Uso: node scaffold-project.js [caminho/para/package.json]
 *
 * Gera:
 * - next.config.js
 * - app/layout.js
 * - app/page.js
 * - styles/globals.css (com Tailwind se detectado)
 * - tailwind.config.cjs e postcss.config.cjs (se Tailwind detectado)
 * - .gitignore
 * - README.md
 *
 * Não sobrescreve arquivos existentes por padrão.
 */

const fs = require("fs").promises;
const path = require("path");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function log(msg) {
  console.log(msg);
}

async function writeIfNotExists(filePath, content) {
  if (await exists(filePath)) {
    log(`Pulando (existe): ${filePath}`);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  log(`Criado: ${filePath}`);
}

async function main() {
  try {
    const pkgPathArg = process.argv[2] || "./package.json";
    const pkgPath = path.resolve(pkgPathArg);

    if (!(await exists(pkgPath))) {
      console.error(`package.json não encontrado em: ${pkgPath}`);
      process.exit(1);
    }

    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw);
    const projectName = pkg.name || "meu-projeto-next";
    const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
    const hasTailwind =
      deps["tailwindcss"] || deps["postcss"] || deps["autoprefixer"];

    const root = path.dirname(pkgPath);

    // next.config.js
    const nextConfig = `/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: { appDir: true },
};
`;
    await writeIfNotExists(path.join(root, "next.config.js"), nextConfig);

    // app/layout.js
    const layout = `import './globals.css';

export const metadata = {
  title: '${projectName}',
  description: 'Aplicação gerada automaticamente',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
`;
    await writeIfNotExists(path.join(root, "app", "layout.js"), layout);

    // app/page.js
    const page = `export default function Home() {
  return (
    <main style={{padding: 24, fontFamily: 'Arial, sans-serif'}}>
      <h1>Bem-vindo ao ${projectName}</h1>
      <p>Servidor Next.js pronto. Rode <code>npm install</code> e <code>npm run dev</code>.</p>
    </main>
  );
}
`;
    await writeIfNotExists(path.join(root, "app", "page.js"), page);

    // styles/globals.css
    let globalsCss = "";
    if (hasTailwind) {
      globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Estilos globais extras */
html, body {
  height: 100%;
  background: #f8fafc;
}
`;
      // tailwind.config.cjs
      const tailwindConfig = `module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: { extend: {} },
  plugins: [],
};
`;
      await writeIfNotExists(
        path.join(root, "tailwind.config.cjs"),
        tailwindConfig
      );

      // postcss.config.cjs
      const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
      await writeIfNotExists(
        path.join(root, "postcss.config.cjs"),
        postcssConfig
      );
    } else {
      globalsCss = `/* Estilos globais */
html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  background: #fff;
  color: #111827;
}
`;
    }
    await writeIfNotExists(
      path.join(root, "styles", "globals.css"),
      globalsCss
    );

    // .gitignore
    const gitignore = `node_modules
.next
.env.local
.env
dist
`;
    await writeIfNotExists(path.join(root, ".gitignore"), gitignore);

    // README.md
    const readme = `# ${projectName}

Projeto gerado automaticamente.

Como usar:
1. Instale dependências: \`npm install\`
2. Rode em desenvolvimento: \`npm run dev\`
3. Build para produção: \`npm run build && npm start\`

`;
    await writeIfNotExists(path.join(root, "README.md"), readme);

    // opcional: public/favicon.ico (pequeno placeholder como arquivo vazio)
    const publicDir = path.join(root, "public");
    if (!(await exists(path.join(publicDir, "favicon.ico")))) {
      await fs.mkdir(publicDir, { recursive: true });
      // criar arquivo vazio para placeholder
      await fs.writeFile(path.join(publicDir, "favicon.ico"), "", "utf8");
      log(`Criado placeholder: public/favicon.ico`);
    } else {
      log("Pulando (existe): public/favicon.ico");
    }

    log("Scaffold concluído.");
  } catch (err) {
    console.error("Erro:", err.message || err);
    process.exit(1);
  }
}

main();