# Simple Nginx-based image to serve static clock page
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
