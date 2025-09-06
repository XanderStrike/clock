# Simple Nginx-based image to serve static clock page
FROM nginx:alpine

COPY index.html style.css script.js /usr/share/nginx/html/
