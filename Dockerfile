FROM node

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

EXPOSE 3000
VOLUME /app/config

CMD ["node", "index.js"]
