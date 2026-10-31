FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN pip3 install --break-system-packages --no-cache-dir numpy==1.26.0 pandas==2.1.1 scikit-learn==1.3.2

RUN npm run build
RUN cp node_modules/connect-pg-simple/table.sql dist/table.sql
ENV NODE_ENV=production
ENV PYTHON_BIN=python3

EXPOSE 5000

CMD ["sh", "-c", "npm run db:push && npm start"]