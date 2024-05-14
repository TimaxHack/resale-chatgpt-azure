# Используйте официальный образ Node.js в качестве базового слоя
FROM node:16

# Установите рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# Копируйте файлы package.json и package-lock.json
COPY package*.json ./

# Установите зависимости проекта
RUN npm install

# Копируйте исходный код приложения в контейнер
COPY . .

# Задайте команду, запускающую приложение
CMD [ "node", "src/server.js" ]
