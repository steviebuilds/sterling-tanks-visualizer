FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/visualiser/package.json apps/visualiser/package.json
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
RUN yarn workspace @septic-system/visualiser build

FROM nginx:alpine
COPY --from=build /app/apps/visualiser/dist /usr/share/nginx/html
COPY apps/visualiser/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
