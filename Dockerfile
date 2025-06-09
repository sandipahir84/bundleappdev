FROM node:18-alpine
RUN apk add --no-cache openssl && \
  rm -rf /var/cache/apk/*

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

RUN npm remove @shopify/cli

COPY prisma ./prisma/

WORKDIR /app
RUN npx prisma generate

COPY . .

RUN npm run build

CMD ["npm", "run", "docker-start"]
