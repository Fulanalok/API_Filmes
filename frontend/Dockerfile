# frontend/Dockerfile
# Etapa 1: Builder - Instala dependências e constrói a aplicação Next.js
FROM node:20-alpine AS builder

# Define o diretório de trabalho onde o código será copiado
WORKDIR /app

# Copia package.json e os arquivos de lock primeiro para otimizar o cache do Docker
COPY package.json yarn.lock* package-lock.json* ./

# Instala as dependências (npm ci é mais robusto para builds automatizados)
RUN \
    if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; \
    fi

# Copia o restante do código-fonte da aplicação
# Isso deve incluir todas as pastas como 'pages', 'styles', 'components', etc.
COPY . .

# Constrói a aplicação Next.js para produção
# Certifique-se de que 'npm run build' está definido corretamente no package.json
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Etapa 2: Runner - Imagem final para rodar a aplicação em produção
# Usamos uma imagem Node.js menor, mas que seja suficiente para rodar o Next.js
FROM node:20-alpine AS runner

# Define o diretório de trabalho na imagem final
WORKDIR /app

# Variáveis de ambiente para o modo de produção
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Copia apenas os resultados da build e os arquivos necessários para o runtime:
# 1. Pasta .next (o build da aplicação)
# 2. Pasta public (assets estáticos como imagens, favicon)
# 3. package.json (necessário para o 'npm start')
# 4. node_modules (completa, do estágio builder, para garantir todas as deps)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

# Se você usou o App Router e tem a pasta 'app' (apenas se aplicável):
# COPY --from=builder /app/app ./app

# Expõe a porta em que a aplicação Next.js vai rodar
EXPOSE 3000

# utilitário para healthcheck
RUN apk add --no-cache curl

# Comando para iniciar o servidor Next.js em modo de produção
# Next.js geralmente espera o .next no WORKDIR, o que já está configurado.
CMD ["npm", "start"]