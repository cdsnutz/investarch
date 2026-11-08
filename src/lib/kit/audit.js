// Deterministic verification of a generated application before it is packaged.
// Three independent passes over every file: structure, syntax and contracts.
// Any error blocks the export; warnings are recorded in the shipped AUDIT.md.

const REQUIRED_PATHS = [
  '.env.example',
  '.gitignore',
  'package.json',
  'eslint.config.js',
  'vite.config.js',
  'vitest.config.js',
  'index.html',
  'verify.sh',
  'README.md',
  'MANIFEST.md',
  'AGENT_ORDERS.md',
  'USER_GUIDE.md',
  'TECHNICAL_GUIDE.md',
  'brand/BRAND.md',
  'database/migrate.js',
  'database/seed.js',
  'database/migrations/001_init.sql',
  'server/app.js',
  'server/index.js',
  'server/db.js',
  'server/schema.js',
  'server/wrap.js',
  'server/middleware/auth.js',
  'server/routes/index.js',
  'server/routes/auth.js',
  'server/routes/records.js',
  'server/services/auth.js',
  'server/services/records.js',
  'src/main.jsx',
  'src/index.css',
  'src/App.jsx',
  'src/api.js',
  'src/auth.jsx',
  'src/schema.js',
  'src/brand.js',
  'src/components/Shell.jsx',
  'src/components/RecordForm.jsx',
  'src/components/StateBlock.jsx',
  'src/pages/Landing.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/Reset.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/RecordList.jsx',
  'src/pages/RecordNew.jsx',
  'src/pages/RecordDetail.jsx',
  'src/pages/Settings.jsx',
  'src/pages/NotFound.jsx',
  'tests/setup.js',
  'tests/health.test.js',
  'tests/auth-guard.test.js',
  'tests/validation.test.js',
  'tests/schema.test.js',
  'tests/contract.test.js',
  'tests/ownership.test.js'
];

const PASS_LABEL = {
  1: 'Structure: every required file, no empties, no duplicates',
  2: 'Syntax: braces, strings, JSX tags, CSS, JSON, SQL, fences',
  3: 'Contracts: imports, exports, collections, routes, brand'
};

const SECRETS = [
  { re: /sk_live_[A-Za-z0-9]{8,}/, message: 'A live secret key is in the output.' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, message: 'A private key is in the output.' },
  { re: /eyJhbGciOi[A-Za-z0-9_-]{10,}/, message: 'A hard-coded token is in the output.' }
];

const PLACEHOLDERS = [
  { re: /__[A-Z0-9_]{3,}__/, message: 'An unreplaced template token is still in the file.' },
  { re: /\[object Object\]/, message: 'An object was stringified into the output.' },
  { re: /^(<{7}|={7}|>{7})/m, message: 'A merge-conflict marker is in the file.' }
];

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'crypto', 'events', 'fs', 'http', 'https', 'net',
  'os', 'path', 'process', 'querystring', 'stream', 'string_decoder', 'tls', 'url', 'util', 'zlib'
]);

// A slash only starts a regular expression after these tokens. Angle brackets are excluded
// on purpose: in JSX, "</" is a closing tag, not a pattern.
const REGEX_PREVIOUS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', ';', '+', '-', '*', '%', '~', '^']);

function dirOf(path) {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}

function resolvePath(fromPath, spec) {
  const segments = dirOf(fromPath) ? dirOf(fromPath).split('/') : [];
  for (const part of spec.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') segments.pop();
    else segments.push(part);
  }
  return segments.join('/');
}

function findTarget(map, base) {
  const candidates = [base, base + '.js', base + '.jsx', base + '.json', base + '.css', base + '/index.js'];
  return candidates.find((candidate) => map.has(candidate)) || null;
}

function packageOf(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function isBuiltin(spec) {
  if (spec.startsWith('node:')) return true;
  return NODE_BUILTINS.has(packageOf(spec));
}

// Pass 2 for JavaScript: a small scanner that walks strings, templates, comments and regex
// literals so bracket balance is checked on code only.
function scanJs(source) {
  const problems = [];
  const stack = [];
  const closer = { '}': '{', ']': '[', ')': '(' };
  let i = 0;
  let line = 1;
  let previous = '\n';
  const length = source.length;

  while (i < length) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === '\n') {
      line += 1;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '/') {
      while (i < length && source[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) {
        problems.push('line ' + line + ': a block comment is never closed');
        return problems;
      }
      line += (source.slice(i, end).match(/\n/g) || []).length;
      i = end + 2;
      continue;
    }

    if (ch === '/' && (REGEX_PREVIOUS.has(previous) || previous === '\n')) {
      const startLine = line;
      i += 1;
      let closed = false;
      while (i < length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === '\n') break;
        if (source[i] === '/') {
          closed = true;
          i += 1;
          while (i < length && /[a-z]/i.test(source[i])) i += 1;
          break;
        }
        i += 1;
      }
      if (!closed) {
        problems.push('line ' + startLine + ': a regular expression is never closed');
        return problems;
      }
      previous = '/';
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      const startLine = line;
      i += 1;
      let closed = false;
      while (i < length) {
        const current = source[i];
        if (current === '\\') {
          i += 2;
          continue;
        }
        if (current === '\n') {
          if (quote !== '`') break;
          line += 1;
        }
        if (current === quote) {
          closed = true;
          i += 1;
          break;
        }
        if (quote === '`' && current === '$' && source[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < length && depth > 0) {
            if (source[i] === '\n') line += 1;
            if (source[i] === '{') depth += 1;
            if (source[i] === '}') depth -= 1;
            i += 1;
          }
          if (depth !== 0) {
            problems.push('line ' + startLine + ': a template expression is never closed');
            return problems;
          }
          continue;
        }
        i += 1;
      }
      if (!closed) {
        problems.push('line ' + startLine + ': a string or template is never closed');
        return problems;
      }
      previous = quote;
      continue;
    }

    if (ch === '{' || ch === '[' || ch === '(') {
      stack.push({ ch, line });
      previous = ch;
      i += 1;
      continue;
    }

    if (ch === '}' || ch === ']' || ch === ')') {
      const open = stack.pop();
      if (!open) problems.push('line ' + line + ': unexpected "' + ch + '"');
      else if (open.ch !== closer[ch]) {
        problems.push('line ' + line + ': "' + ch + '" closes "' + open.ch + '" from line ' + open.line);
      }
      previous = ch;
      i += 1;
      continue;
    }

    if (!/\s/.test(ch)) previous = ch;
    i += 1;
  }

  for (const open of stack) problems.push('line ' + open.line + ': "' + open.ch + '" is never closed');
  return problems;
}

// JSX tag balance: counted per tag name, reported as warnings (a scanner, not a parser).
function jsxProblems(source) {
  const counts = new Map();
  const bump = (name, delta) => counts.set(name, (counts.get(name) || 0) + delta);
  let i = 0;

  while (i < source.length) {
    if (source[i] !== '<') {
      i += 1;
      continue;
    }
    const window = source.slice(i, i + 120);

    if (source[i + 1] === '/') {
      const close = /^<\/([A-Za-z][\w.]*)\s*>/.exec(window);
      if (close) {
        bump(close[1], -1);
        i += close[0].length;
        continue;
      }
      i += 1;
      continue;
    }

    const open = /^<([A-Za-z][\w.]*)/.exec(window);
    if (!open) {
      i += 1;
      continue;
    }

    let j = i + open[0].length;
    let depth = 0;
    let selfClosing = false;
    while (j < source.length) {
      const ch = source[j];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        j += 1;
        while (j < source.length && source[j] !== quote) {
          if (source[j] === '\\') j += 1;
          j += 1;
        }
        j += 1;
        continue;
      }
      if (ch === '{') {
        depth += 1;
        j += 1;
        continue;
      }
      if (ch === '}') {
        depth -= 1;
        j += 1;
        continue;
      }
      if (depth === 0 && ch === '/' && source[j + 1] === '>') {
        selfClosing = true;
        j += 2;
        break;
      }
      if (depth === 0 && ch === '>') {
        j += 1;
        break;
      }
      j += 1;
    }

    if (!selfClosing) bump(open[1], 1);
    i = j;
  }

  const problems = [];
  for (const [name, count] of counts) {
    if (count !== 0) problems.push('JSX tag <' + name + '> is unbalanced (' + count + ' unclosed)');
  }
  return problems;
}

function scanCss(source) {
  const problems = [];
  let depth = 0;
  let line = 1;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '\n') line += 1;
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) {
        problems.push('line ' + line + ': a comment is never closed');
        return problems;
      }
      line += (source.slice(i, end).match(/\n/g) || []).length;
      i = end + 1;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth < 0) {
      problems.push('line ' + line + ': more closing braces than opening ones');
      return problems;
    }
  }
  if (depth !== 0) problems.push('braces never balance (' + depth + ' left open)');

  const defined = new Set();
  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(match[1]);
  for (const match of source.matchAll(/var\((--[a-z0-9-]+)/gi)) {
    if (!defined.has(match[1])) problems.push('uses ' + match[1] + ' but never defines it');
  }
  return problems;
}

function scanSql(source) {
  const problems = [];
  let depth = 0;
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1;
    if (source[i] === ')') depth -= 1;
    if (depth < 0) {
      problems.push('a closing parenthesis has no opening partner');
      return problems;
    }
  }
  if (depth !== 0) problems.push('parentheses never balance (' + depth + ' left open)');
  if (/,\s*\)/.test(source)) problems.push('a column list ends with a trailing comma');
  const dollars = (source.match(/\$\$/g) || []).length;
  if (dollars % 2 !== 0) problems.push('a dollar-quoted function body is never closed');
  for (const match of source.matchAll(/create table if not exists "([^"]+)"/g)) {
    if (!/^[a-z_][a-z0-9_]*$/.test(match[1])) problems.push('table name "' + match[1] + '" is not a safe identifier');
  }
  return problems;
}

function scanMarkdown(source) {
  const problems = [];
  const fences = (source.match(/^```/gm) || []).length;
  if (fences % 2 !== 0) problems.push('a code fence is never closed');
  if (/\$\{/.test(source)) problems.push('a template expression is unrendered in the prose');
  return problems;
}

function exportedNames(source) {
  const names = new Set();
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+const\s+([A-Za-z_$][\w$]*)/g,
    /export\s+let\s+([A-Za-z_$][\w$]*)/g,
    /export\s+var\s+([A-Za-z_$][\w$]*)/g,
    /export\s+class\s+([A-Za-z_$][\w$]*)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) names.add(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  if (/export\s+default\b/.test(source)) names.add('default');
  if (/export\s*\*/.test(source)) names.add('*');
  return names;
}

function parseImports(source) {
  const found = [];
  for (const match of source.matchAll(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const clause = match[1].trim();
    const named = [];
    const braces = /\{([^}]*)\}/.exec(clause);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        if (name) named.push(name);
      }
    }
    found.push({ spec: match[2], named, namespace: /\*\s+as\s+\w+/.test(clause) });
  }
  for (const match of source.matchAll(/import\s+['"]([^'"]+)['"]/g)) {
    found.push({ spec: match[1], named: [], namespace: false });
  }
  return found;
}

function matchesRoute(target, routes) {
  const parts = target.split(/[?#]/)[0].split('/').filter(Boolean);
  return routes.some((pattern) => {
    const expected = pattern.split('/').filter(Boolean);
    if (expected.length !== parts.length) return false;
    return expected.every((segment, index) => segment.startsWith(':') || segment === parts[index]);
  });
}

function tableBlock(sql, key) {
  const start = sql.indexOf('create table if not exists "' + key + '"');
  if (start === -1) return null;
  const end = sql.indexOf('\n);', start);
  return end === -1 ? sql.slice(start) : sql.slice(start, end);
}

export function auditKit(files, options = {}) {
  const issues = [];
  const add = (file, pass, level, code, message) => issues.push({ file, pass, level, code, message });
  const entities = options.entities || [];
  const brand = options.brand || null;
  const sources = new Map();
  let bytes = 0;

  // ---- Pass 1: structure
  const seen = new Set();
  for (const file of files) {
    if (!file || typeof file.path !== 'string' || !file.path) {
      add('(unnamed)', 1, 'error', 'path', 'A generated file has no path.');
      continue;
    }
    if (seen.has(file.path)) {
      add(file.path, 1, 'error', 'duplicate', 'Two generated files share this path; one would overwrite the other.');
    }
    seen.add(file.path);
    const content = typeof file.content === 'string' ? file.content : '';
    sources.set(file.path, content);
    bytes += content.length;
    if (!content.trim()) add(file.path, 1, 'error', 'empty', 'The file is empty.');
    if (content.length > 400000) add(file.path, 1, 'error', 'size', 'The file is larger than 400 KB.');
    if (/(^|\/)\.env$/.test(file.path)) {
      add(file.path, 1, 'error', 'secret-file', 'A .env file must never ship; .env.example ships instead.');
    }
  }
  for (const required of REQUIRED_PATHS) {
    if (!seen.has(required)) add(required, 1, 'error', 'missing', 'A required file is missing from the build.');
  }

  const envExample = sources.get('.env.example') || '';
  if (envExample && !/DATABASE_URL/.test(envExample)) add('.env.example', 1, 'error', 'env', 'DATABASE_URL is not declared.');
  if (envExample && !/AUTH_SECRET/.test(envExample)) add('.env.example', 1, 'error', 'env', 'AUTH_SECRET is not declared.');
  const gitignore = sources.get('.gitignore') || '';
  if (gitignore && !/node_modules/.test(gitignore)) add('.gitignore', 1, 'warn', 'ignore', 'node_modules is not ignored.');
  if (gitignore && !/\.env/.test(gitignore)) add('.gitignore', 1, 'error', 'ignore', '.env is not ignored, so a secret could be committed.');
  const verifySh = sources.get('verify.sh') || '';
  if (verifySh && !/^#!.*bash/.test(verifySh)) add('verify.sh', 1, 'error', 'shell', 'verify.sh has no bash shebang.');
  if (verifySh && !/set -euo pipefail/.test(verifySh)) add('verify.sh', 1, 'error', 'shell', 'verify.sh does not stop on the first failure.');
  for (const doc of ['README.md', 'MANIFEST.md', 'TECHNICAL_GUIDE.md', 'USER_GUIDE.md', 'AGENT_ORDERS.md']) {
    const body = sources.get(doc) || '';
    if (body && body.trim().length < 400) add(doc, 1, 'warn', 'thin-doc', 'The hand-off document is too thin to be useful.');
  }

  // ---- Pass 2: syntax and hygiene
  for (const [path, content] of sources) {
    if (!content) continue;

    for (const pattern of SECRETS) {
      if (pattern.re.test(content)) add(path, 2, 'error', 'secret', pattern.message);
    }
    for (const pattern of PLACEHOLDERS) {
      if (pattern.re.test(content)) add(path, 2, 'error', 'placeholder', pattern.message);
    }

    let syntax = [];
    if (/\.(js|jsx)$/.test(path)) {
      syntax = scanJs(content);
      if (/\.jsx$/.test(path)) {
        for (const problem of jsxProblems(content)) add(path, 2, 'warn', 'jsx', problem);
      }
    } else if (/\.css$/.test(path)) {
      syntax = scanCss(content);
    } else if (/\.sql$/.test(path)) {
      syntax = scanSql(content);
    } else if (/\.md$/.test(path)) {
      syntax = scanMarkdown(content);
    } else if (/\.json$/.test(path)) {
      try {
        JSON.parse(content);
      } catch (problem) {
        syntax = ['invalid JSON: ' + problem.message];
      }
    }

    for (const problem of syntax) add(path, 2, 'error', 'syntax', problem);
  }

  // ---- Pass 3: contracts
  let dependencies = {};
  try {
    const pkg = JSON.parse(sources.get('package.json') || '{}');
    dependencies = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    for (const script of ['dev', 'dev:web', 'build', 'start', 'test', 'lint', 'db:migrate', 'db:seed', 'verify']) {
      if (!pkg.scripts || !pkg.scripts[script]) add('package.json', 3, 'error', 'script', 'The "' + script + '" script is missing.');
    }
  } catch {
    dependencies = {};
  }

  // 3a. Every relative import resolves, and every named import exists.
  for (const [path, content] of sources) {
    if (!/\.(js|jsx)$/.test(path)) continue;
    for (const entry of parseImports(content)) {
      let targetPath = null;
      if (entry.spec.startsWith('.')) {
        const base = resolvePath(path, entry.spec);
        targetPath = findTarget(sources, base);
        if (!targetPath) {
          add(path, 3, 'error', 'import', 'imports "' + entry.spec + '", which is not in the build.');
          continue;
        }
      } else if (entry.spec.startsWith('/')) {
        continue;
      } else if (isBuiltin(entry.spec)) {
        continue;
      } else if (!Object.prototype.hasOwnProperty.call(dependencies, packageOf(entry.spec))) {
        add(path, 3, 'error', 'dependency', 'imports "' + entry.spec + '", which package.json does not declare.');
        continue;
      }

      if (targetPath && entry.named.length && /\.(js|jsx)$/.test(targetPath)) {
        const exported = exportedNames(sources.get(targetPath) || '');
        if (exported.has('*')) continue;
        for (const name of entry.named) {
          if (!exported.has(name)) {
            add(path, 3, 'error', 'export', 'imports "' + name + '" from ' + targetPath + ', which does not export it.');
          }
        }
      }
    }
  }

  // 3b. The client calls only API methods the client defines.
  const apiSource = sources.get('src/api.js') || '';
  const apiMethods = new Set();
  for (const match of apiSource.matchAll(/^\s{2}(\w+):/gm)) apiMethods.add(match[1]);
  for (const [path, content] of sources) {
    if (!path.startsWith('src/') || !/\.(js|jsx)$/.test(path)) continue;
    for (const match of content.matchAll(/\bapi\.(\w+)\(/g)) {
      if (!apiMethods.has(match[1])) add(path, 3, 'error', 'api', 'calls api.' + match[1] + '(), which src/api.js does not define.');
    }
  }

  // 3c. Routes call only service functions the services export.
  const services = [
    { path: 'server/services/records.js', router: 'server/routes/records.js', alias: 'records' },
    { path: 'server/services/auth.js', router: 'server/routes/auth.js', alias: 'auth' }
  ];
  for (const service of services) {
    const serviceSource = sources.get(service.path);
    const routerSource = sources.get(service.router);
    if (!serviceSource || !routerSource) continue;
    const exported = exportedNames(serviceSource);
    const pattern = new RegExp('\\b' + service.alias + '\\.(\\w+)\\(', 'g');
    for (const match of routerSource.matchAll(pattern)) {
      if (!exported.has(match[1])) {
        add(service.router, 3, 'error', 'service', 'calls ' + service.alias + '.' + match[1] + '(), which ' + service.path + ' does not export.');
      }
    }
  }

  // 3d. Both halves must read the collections from a keyed object, with a lookup helper.
  const schemaModules = [
    ['server/schema.js', sources.get('server/schema.js') || ''],
    ['src/schema.js', sources.get('src/schema.js') || '']
  ];
  for (const [path, source] of schemaModules) {
    if (!source) continue;
    if (!/export const ENTITIES = \{/.test(source)) {
      add(path, 3, 'error', 'collection', 'collections must be exported as a keyed object; a list makes every lookup fail.');
    }
    if (!/export function entityOf/.test(source)) {
      add(path, 3, 'error', 'collection', 'entityOf is missing, so a collection in the URL can never resolve.');
    }
  }

  // 3e. Every collection exists in the migration, both schema modules and its own tests.
  const migration = sources.get('database/migrations/001_init.sql') || '';
  const serverSchema = sources.get('server/schema.js') || '';
  const clientSchema = sources.get('src/schema.js') || '';
  for (const entity of entities) {
    const block = tableBlock(migration, entity.key);
    if (!block) {
      add('database/migrations/001_init.sql', 3, 'error', 'collection', 'collection "' + entity.key + '" has no table.');
      continue;
    }
    for (const field of entity.fields) {
      if (!block.includes('"' + field.name + '"')) {
        add('database/migrations/001_init.sql', 3, 'error', 'column', 'column "' + field.name + '" of "' + entity.key + '" is missing from the migration.');
      }
    }
    if (!migration.includes('"' + entity.key + '_owner_id_idx"')) {
      add('database/migrations/001_init.sql', 3, 'error', 'index', 'collection "' + entity.key + '" has no owner_id index.');
    }
    if (!migration.includes('"' + entity.key + '_touch"')) {
      add('database/migrations/001_init.sql', 3, 'error', 'trigger', 'collection "' + entity.key + '" has no updated_at trigger.');
    }
    for (const [path, source] of [['server/schema.js', serverSchema], ['src/schema.js', clientSchema]]) {
      if (!source.includes('"' + entity.key + '"')) {
        add(path, 3, 'error', 'collection', 'collection "' + entity.key + '" is missing from the schema module.');
        continue;
      }
      for (const field of entity.fields) {
        if (!source.includes('"' + field.name + '"')) {
          add(path, 3, 'error', 'column', 'column "' + field.name + '" of "' + entity.key + '" is missing from the schema module.');
        }
      }
    }
  }
  const contractTest = sources.get('tests/contract.test.js') || '';
  if (!/entityKeys/.test(contractTest)) {
    add('tests/contract.test.js', 3, 'error', 'test', 'The contract suite does not read the collection list.');
  }

  // 3e. Every navigable path in the interface exists as a route.
  const appSource = sources.get('src/App.jsx') || '';
  const routes = [...appSource.matchAll(/<Route\s+path=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((path) => path !== '*');
  const targets = new Set();
  for (const [path, content] of sources) {
    if (!path.startsWith('src/')) continue;
    for (const match of content.matchAll(/\bto=["']([^"']+)["']/g)) targets.add(match[1]);
    for (const match of content.matchAll(/\bto=\{\s*['"]([^'"]+)['"]\s*\}/g)) targets.add(match[1]);
    for (const match of content.matchAll(/\bnavigate\(\s*['"]([^'"]+)['"]/g)) targets.add(match[1]);
  }
  for (const target of targets) {
    if (!target.startsWith('/')) continue;
    if (!matchesRoute(target, routes)) {
      add('src/App.jsx', 3, 'error', 'route', 'a link points at "' + target + '", which no route serves.');
    }
  }

  // 3f. The brand kit actually reached the output.
  if (brand) {
    const css = sources.get('src/index.css') || '';
    const html = sources.get('index.html') || '';
    const brandModule = sources.get('src/brand.js') || '';
    if (brand.primary && !css.toLowerCase().includes(String(brand.primary).toLowerCase())) {
      add('src/index.css', 3, 'error', 'brand', 'the brand primary colour is not in the stylesheet.');
    }
    if (brand.headingFont && !css.includes(brand.headingFont)) {
      add('src/index.css', 3, 'error', 'brand', 'the brand heading font is not in the stylesheet.');
    }
    if (brand.name && !html.includes(brand.name)) {
      add('index.html', 3, 'error', 'brand', 'the brand name is not in the page head.');
    }
    if (brand.name && !brandModule.includes(JSON.stringify(brand.name))) {
      add('src/brand.js', 3, 'error', 'brand', 'the brand name is not in the brand module.');
    }
  }

  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warn');
  const passes = [1, 2, 3].map((id) => {
    const mine = issues.filter((issue) => issue.pass === id);
    return {
      id,
      label: PASS_LABEL[id],
      errors: mine.filter((issue) => issue.level === 'error').length,
      warnings: mine.filter((issue) => issue.level === 'warn').length
    };
  });

  return {
    ok: errors.length === 0,
    files: files.length,
    bytes,
    errors,
    warnings,
    issues,
    passes
  };
}

export function auditMarkdown(report, seed) {
  const lines = [];
  lines.push('# Verification report: ' + (seed?.title || 'generated application'));
  lines.push('');
  lines.push(
    report.ok
      ? 'Every file passed all three passes. ' + report.files + ' files, ' + report.warnings.length + ' advisory notes.'
      : 'This build did not pass verification and must not be deployed.'
  );
  lines.push('');
  lines.push('| Pass | What it checks | Errors | Notes |');
  lines.push('| --- | --- | --- | --- |');
  for (const pass of report.passes) {
    lines.push('| ' + pass.id + ' | ' + pass.label + ' | ' + pass.errors + ' | ' + pass.warnings + ' |');
  }
  lines.push('');
  lines.push('Re-run the same gate at any time with `./verify.sh`, which lints, tests, builds, migrates and probes the running app.');
  if (report.warnings.length) {
    lines.push('');
    lines.push('## Advisory notes');
    lines.push('');
    for (const issue of report.warnings.slice(0, 40)) {
      lines.push('- `' + issue.file + '`: ' + issue.message);
    }
  }
  lines.push('');
  lines.push('Static verification proves structure, syntax and contracts. It is not a substitute for the runtime suite: `npm test` and `./verify.sh` exercise the live routes.');
  return lines.join('\n') + '\n';
}