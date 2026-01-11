#!/bin/bash

# OrionDesign Installer
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Instalador de OrionDesign ===${NC}"

# Check Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker no está instalado." >&2
  echo "Por favor instala Docker y Docker Compose primero."
  exit 1
fi

echo -e "${GREEN}[1/3] Creando estructura de carpetas...${NC}"
mkdir -p volumes/n8n
mkdir -p volumes/postgres
mkdir -p volumes/redis
mkdir -p volumes/evolution/instances
mkdir -p volumes/evolution/store
mkdir -p letsencrypt

# Set secure permissions for Traefik ACME storage
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json
echo "Permisos de letsencrypt/acme.json ajustados (600)."

echo -e "${GREEN}[2/3] Configurando variables de entorno...${NC}"
if [ ! -f .env ]; then
    if [ -f env.template ]; then
        cp env.template .env
        echo -e "${GREEN}✓ Archivo .env creado exito.${NC}"
    else
        echo "Error: No se encontró env.template."
    fi
else
    echo -e "${YELLOW}! El archivo .env ya existe. No se sobrescribirá.${NC}"
fi

echo -e "${GREEN}[3/3] Listo para desplegar${NC}"
echo "---------------------------------------------------"
echo -e "PASO FINAL: ${YELLOW}Edita el archivo .env${NC} con tus dominios y claves."
echo "Comando sugerido: nano .env"
echo ""
echo "Para iniciar el servidor, ejecuta:"
echo -e "${GREEN}docker compose up -d${NC}"
echo "---------------------------------------------------"
