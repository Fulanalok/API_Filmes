## Objetivo
- Recriar o histórico Git local com o código já corrigido e forçar a publicação no `main` remoto, ignorando conflitos.

## Verificações Rápidas
- Backend: já compila e roda em `5000`; endpoints `search` e `popular` OK.
- Frontend: build de produção OK; Home, SearchBar e página de detalhes sem conflitos.
- Segredos: `.gitignore` ignora `**/.env*`, `**/node_modules`, `**/.next`, `**/dist`.

## Reset Git (sem conflitos)
1. Abortar estados de rebase/cherry-pick (se houver):
- `git rebase --abort`
- `git cherry-pick --abort`
- Se impedir, remover estado: `Remove-Item -Recurse -Force .git\rebase-merge` (PowerShell)

2. Criar branch órfã com a árvore limpa atual:
- `git checkout --orphan clean-release`
- `git add -A`
- `git -c user.name="LucasVilhena" -c user.email="lucas@example.com" commit -m "Release: código corrigido, .gitignore normalizado"`

3. Forçar publicação para o `main` remoto (override total):
- `git push -f origin clean-release:main`

## Pós-publicação
- Opcional: alinhar local ao remoto:
- `git fetch origin && git checkout main && git reset --hard origin/main`

## Segurança
- Não versionar `TMDB_API_KEY`; manter como secret/variável de ambiente.

## Resultado
- `main` remoto passa a refletir exatamente o código corrigido atual, sem conflitos.

Confirmo executar agora o reset e o force push conforme acima?