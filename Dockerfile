FROM node:latest

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package*.json ./
RUN npm install

HEALTHCHECK --interval=5m --timeout=90s --retries=2 \
  CMD curl -f http://localhost/ || exit 1

RUN useradd -ms /bin/bash appuser
USER appuser
WORKDIR /home/appuser

COPY . .

EXPOSE 3000

CMD . ./env.sh && npm start
