# FROM node:12.13-alpine

# # WORKDIR /usr/src/app

# COPY package*.json ./

# RUN npm install glob rimraf

# RUN npm install --only=development

# COPY . .

# RUN npm run build

FROM node:14-alpine3.14 as builder

ENV NODE_ENV build

WORKDIR /home/node

COPY . /home/node

RUN npm ci \
    && npm run build \
    && npm prune --production

# ---

FROM node:14-alpine3.14

ENV NODE_ENV production
ENV MONGODB_URI= mongodb+srv://Admin:Admin123456@bassthalk.7nkfp.mongodb.net/test1?retryWrites=true&w=majority
USER node
WORKDIR /home/node

COPY --from=builder /home/node/package*.json /home/node/
COPY --from=builder /home/node/node_modules/ /home/node/node_modules/
COPY --from=builder /home/node/dist/ /home/node/dist/

CMD ["node", "dist/main.js"]