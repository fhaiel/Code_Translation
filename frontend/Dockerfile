# for development: docker build --target dev -t react-docker:1.0.0-dev .
# command to run: docker run --rm -it --name web -p 3000:3000 -v $(pwd):/code react-docker:1.0.0-dev {npm install (if not already installed)}
FROM node:22.11.0 as dev

WORKDIR /code

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

CMD ["npm", "run", "start"]