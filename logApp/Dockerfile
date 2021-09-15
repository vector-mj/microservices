FROM node:current-alpine3.14
WORKDIR /app
COPY package.json .
RUN npm install
RUN npm i -g nodemon
COPY . .
EXPOSE 8082
CMD ["nodemon"]
