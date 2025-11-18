const fs = require('fs');
const path = require('path');
const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      params[k.slice(2)] = v ?? args[++i];
    } else if (!params.token) {
      params.token = a;
    }
  }
  return params;
}

function shouldIgnore(rel) {
  const segs = rel.split(path.sep);
  const name = segs[segs.length - 1];
  const ignoredDirNames = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.trae']);
  for (const s of segs) {
    if (ignoredDirNames.has(s)) return true;
  }
  if (name === '.env' || name.endsWith('.env') || name.startsWith('.env.')) return true;
  if (name.endsWith('.log')) return true;
  return false;
}

function listFiles(rootDir) {
  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(rootDir, full);
      if (shouldIgnore(rel)) continue;
      if (e.isDirectory()) walk(full);
      else files.push(rel);
    }
  }
  walk(rootDir);
  return files;
}

function ghRequest(method, urlPath, token, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: urlPath,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'trae-upload-script',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`GitHub API ${method} ${urlPath} failed: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getExistingSha(owner, repo, branch, token, filePath) {
  const url = `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g,'/')}` + (branch ? `?ref=${encodeURIComponent(branch)}` : '');
  try {
    const resp = await ghRequest('GET', url, token);
    return resp && resp.sha ? resp.sha : null;
  } catch (e) {
    return null;
  }
}

async function repoExists(owner, repo, token) {
  try {
    await ghRequest('GET', `/repos/${owner}/${repo}`, token);
    return true;
  } catch (e) {
    return false;
  }
}

async function createRepo(owner, repo, token) {
  // Create under authenticated user; owner must match the token's account
  return ghRequest('POST', `/user/repos`, token, {
    name: repo,
    private: false,
    auto_init: false,
  });
}

async function uploadFile(owner, repo, branch, token, rootDir, relPath, commitMessage) {
  const abs = path.join(rootDir, relPath);
  const content = fs.readFileSync(abs);
  const b64 = content.toString('base64');
  const existingSha = await getExistingSha(owner, repo, branch, token, relPath.replace(/\\/g, '/'));
  const body = {
    message: commitMessage,
    content: b64,
    branch,
  };
  if (existingSha) body.sha = existingSha;
  const url = `/repos/${owner}/${repo}/contents/${encodeURIComponent(relPath.replace(/\\/g, '/')).replace(/%2F/g,'/')}`;
  return ghRequest('PUT', url, token, body);
}

async function main() {
  const args = parseArgs();
  const token = args.token || process.env.GITHUB_TOKEN;
  const owner = args.owner || 'Fulanalok';
  const repo = args.repo || 'API_Filmes';
  const branch = args.branch || 'main';
  const rootDir = args.root || process.cwd();
  const message = args.message || 'Initial upload via API';
  if (!token) {
    console.error('Missing GitHub token');
    process.exit(1);
  }
  const exists = await repoExists(owner, repo, token);
  if (!exists) {
    try {
      await createRepo(owner, repo, token);
      console.log(`Created repository ${owner}/${repo}`);
    } catch (e) {
      console.error(`Failed to create repository ${owner}/${repo}: ${e.message}`);
      process.exit(1);
    }
  }
  const files = listFiles(rootDir);
  for (let i = 0; i < files.length; i++) {
    const rel = files[i];
    try {
      await uploadFile(owner, repo, branch, token, rootDir, rel, message);
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 300));
      process.stdout.write(`Uploaded: ${rel}\n`);
    } catch (e) {
      process.stderr.write(`Failed: ${rel} -> ${e.message}\n`);
    }
  }
  console.log('Done');
}

main().catch((e) => { console.error(e); process.exit(1); });