FROM node:24

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json ./ 
COPY package-lock.json ./

COPY apps/bot/package.json ./apps/bot/package.json

RUN npm install

COPY . .

CMD [ "npm", "start" ] 
