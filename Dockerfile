# Build em um estagio e execucao em outro: a imagem final nao carrega o
# compilador TypeScript nem as dependencias de desenvolvimento.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Processo sem privilegio de root: a imagem base ja traz o usuario `node`.
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
