FROM node:16.9.1 as pybuild

RUN apt update -y \
  && apt upgrade -y \
  && apt install build-essential libpq-dev python3 python3-pip -y \
  && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN pip3 install --upgrade pip
RUN pip3 wheel --wheel-dir /wheels apprise

FROM node:16.9.1

COPY --from=pybuild /wheels /wheels

RUN apt update -y \ 
  && apt upgrade -y \
  && apt install build-essential libssl-dev libkrb5-dev python3 python3-pip -y \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip \
  && pip3 install --no-cache /wheels/* \
  && rm -fr /wheels

RUN mkdir /app
WORKDIR /app

COPY package.json  .
COPY package-lock.json .

RUN npm install

COPY . .

EXPOSE 3000
VOLUME /app/config

CMD ["npm", "run", "start"]