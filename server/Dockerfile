FROM node:22

WORKDIR /app

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "start:dev"]