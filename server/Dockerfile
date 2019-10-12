FROM node:lts-alpine

RUN mkdir -p /usr/src/app/server
WORKDIR /usr/src/app/server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "app.js"]