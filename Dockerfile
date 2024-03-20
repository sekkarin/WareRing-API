FROM node:21-alpine3.18
WORKDIR /usr/src/app

COPY . .

EXPOSE 3000
RUN npm install cross-env
RUN npm install 

CMD [ "npm","run","start:dev" ]