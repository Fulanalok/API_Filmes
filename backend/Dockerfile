FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5001

# utilitário para healthcheck
RUN apk add --no-cache curl

CMD ["npm", "start"]