#!/bin/bash
set -e  # Exit script on error

# Constants for colors and formatting
NONE="\033[0m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
GREEN="\033[0;32m"
PURPLE="\033[0;35m"
GRAY="\033[0;37m"
CURSIVE="\033[3m"

# Define URLs to download Bootstrap and Three.js
BOOTSTRAP_URL="https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip"
THREEJS_URL="https://github.com/mrdoob/three.js/archive/master.zip"

BOOTSTRAP_DIR="src/site/static/lib/bootstrap"
THREEJS_DIR="src/site/static/lib/threejs"

DOCKER_PRODUCTION_COMPOSE_FILE="src/docker-compose.yml"

DJANGO_ENV_PATH="src/site/env"
DJANGO_ENV_FILE="src/site/env/.env.local"

DB_ENV_PATH="src/database/env"
DB_ENV_FILE="src/database/env/.env.prod.db"

# Function to display the banner
banner() {
	echo -e "${CYAN}"
	echo "                                                                  "
	echo "                                                                  "
	echo "                                                                  "
	echo "                                                                  "
	echo "                                                                  "
	echo " _                                          _                     "
	echo "| |_ _ __ __ _ _ __  ___  ___ ___ _ __   __| | ___ _ __   ___ ___ "
	echo "| __| '__/ _\` | '_ \/ __|/ __/ _ \ '_ \ / _\` |/ _ \ '_ \ / __/ _ \\"
	echo "| |_| | | (_| | | | \__ \ (_|  __/ | | | (_| |  __/ | | | (_|  __/"
	echo " \\__|_|  \\__,_|_| |_|___/\\___\\___|_| |_|\\__,_|\\___|_| |_|\\___\\___|"
	echo "                                                                  "
	echo -e "${NONE}"
}

spinner_pid=

function start_spinner {
	set +m
	echo -n "$1         "
	{ while : ; do for X in '  •     ' '   •    ' '    •   ' '     •  ' '      • ' '     •  ' '    •   ' '   •    ' '  •     ' ' •      ' ; do echo -en "\b\b\b\b\b\b\b\b$X" ; sleep 0.1 ; done ; done & } 2>/dev/null
	spinner_pid=$!
}

function stop_spinner {
	{ kill -9 $spinner_pid && wait; } 2>/dev/null
	set -m
	echo -en "\033[2K\r"
}

disable_local_database() {
	if sudo lsof -i :5432 > /dev/null; then
		sudo systemctl stop postgresql
	fi
}

enable_local_database() {
	if ! sudo lsof -i :5432 > /dev/null; then
		sudo systemctl start postgresql
	fi
}

# Check dependencies
check_dependencies() {
	banner
	echo -e "${PURPLE}[checking dependencies]${NONE}"

	command -v curl > /dev/null || { echo "curl is required but not installed."; exit 1; }
	command -v docker > /dev/null || { echo "Docker is required but not installed."; exit 1; }


	# Install unzip if not found
	which unzip > /dev/null || { \
		echo -e "${GRAY}${CURSIVE}Unzip not found. Installing...${NONE}"; \
		sudo apt-get install -y unzip; \
	}

	# Install Bootstrap if not already installed
	if [ ! -d "$BOOTSTRAP_DIR" ]; then
		trap stop_spinner EXIT
		start_spinner "Downloading Bootstrap! "
		mkdir -p tmp
		curl -s -LO "$BOOTSTRAP_URL" || { echo "Error downloading Bootstrap"; exit 1; }
		mv bootstrap-5.3.3-dist.zip tmp/ > /dev/null
		unzip tmp/bootstrap-5.3.3-dist.zip -d tmp > /dev/null
		mkdir -p "$BOOTSTRAP_DIR/css" "$BOOTSTRAP_DIR/js" > /dev/null
		mv tmp/bootstrap-5.3.3-dist/css/* "$BOOTSTRAP_DIR/css/" > /dev/null
		mv tmp/bootstrap-5.3.3-dist/js/* "$BOOTSTRAP_DIR/js/" > /dev/null
		rm -rf tmp > /dev/null
		stop_spinner
		echo -e "${GREEN}\nBootstrap installed${NONE}"
	else
		echo -e "${GREEN}Bootstrap folder already exists. Skipping download.${NONE}"
	fi

	# Install Three.js if not already installed
	if [ ! -d "$THREEJS_DIR" ]; then
		trap stop_spinner EXIT
		start_spinner "Downloading Three.js! "
		mkdir -p tmp
		curl -s -LO "$THREEJS_URL" || { echo "Error downloading Three.js"; exit 1; }
		mv master.zip tmp/ > /dev/null
		unzip tmp/master.zip -d tmp > /dev/null
		mkdir -p "$THREEJS_DIR" 
		mv tmp/three.js-master/* "$THREEJS_DIR/" > /dev/null
		rm -rf tmp
		stop_spinner
		echo -e "${GREEN}\nBootstrap  Three.js${NONE}"
	else
		echo -e "${GREEN}Three.js folder already exists. Skipping download.${NONE}"
	fi
}

check_env() {

    # Check Python virtual environment
    echo -e "${CYAN}Checking Python environment...${NONE}"
    if [[ ! -d "src/site/venv" ]]; then
		trap stop_spinner EXIT
		start_spinner "installing all python dependencies! "
        python3 -m venv src/site/venv
        source src/site/venv/bin/activate
        pip install -r src/site/requirements.txt --upgrade-strategy only-if-needed > /dev/null
		stop_spinner
        echo -e "${GREEN}Python environment created and packages installed.${NONE}"
    else
        echo -e "${GREEN}Python virtual environment already exists.${NONE}"
    fi
    
	# Check database environment
    echo -e "${CYAN}Checking database environment...${NONE}"
    if [[ ! -d "$DB_ENV_PATH" || ! -f "$DB_ENV_FILE" ]]; then
        echo -e "${RED}Database environment or .env.prod.db file not found.${NONE}"
        read -p "Would you like to create it? (yes/no): " create_env_response
        if [[ "$create_env_response" == "yes" || "$create_env_response" == "y" ]]; then
			trap stop_spinner EXIT
			start_spinner "Creating database enviroment! "
            mkdir -p "$DB_ENV_PATH"
            cat <<EOL > "$DB_ENV_FILE"
POSTGRES_USER=42user
POSTGRES_PASSWORD=admin
POSTGRES_DB=ft_transcendence
EOL
			stop_spinner
            echo -e "${GREEN}Database .env file created.${NONE}"
        else
            echo -e "${RED}Cannot proceed without database environment.${NONE}"
            return 1
        fi
    else
        echo -e "${GREEN}Database environment found.${NONE}"
    fi
    
	# Check Django environment
    echo -e "${CYAN}Checking Django environment...${NONE}"
    if [[ ! -d "$DJANGO_ENV_PATH" || ! -f "$DJANGO_ENV_FILE" ]]; then
        echo -e "${RED}Django environment or .env.local file not found.${NONE}"
        read -p "Would you like to create it? (yes/no): " create_env_response
        if [[ "$create_env_response" == "yes" || "$create_env_response" == "y" ]]; then
			trap stop_spinner EXIT
			start_spinner "Creating Django enviroment! "
            mkdir -p $DJANGO_ENV_PATH
            cat <<EOL > "$DJANGO_ENV_FILE"
DEBUG=1
SECRET_KEY=foo
DJANGO_ENV=venv
DATABASE=postgres
DJANGO_ALLOWED_HOSTS=localhost 127.0.0.1 [::1]
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=ft_transcendence
DATABASE_USER=42user
DATABASE_PASSWORD=admin
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DJANGO_STATIC_URL="/static/"
DJANGO_STATIC_ROOT=staticfiles
DJANGO_MEDIA_URL="/media/"
DJANGO_MEDIA_ROOT=media
EOL
			stop_spinner
            echo -e "${GREEN}Django .env file created.${NONE}"
        else
            echo -e "${RED}Cannot proceed without Django environment.${NONE}"
            return 1
        fi
    else
        echo -e "${GREEN}Django environment found.${NONE}"
    fi
}


# Local server
local() {
	check_dependencies
	check_env
	enable_local_database
	echo -e "${YELLOW}Running database locally...${NONE}"
	
	read -p "Do you want to make a migration? (yes/no): " response
	if [[ "$response" == "yes" || "$response" == "y" ]]; then
		echo -e "${YELLOW}Making migrations...${NONE}"
		python3 src/site/manage.py makemigrations
		python3 src/site/manage.py migrate
	fi

	echo -e "${YELLOW}Running server locally...${NONE}"
	python3 src/site/manage.py runserver 0.0.0.0:8000 --verbosity 3
}

# Development environment
dev() {
	check_dependencies
	disable_local_database
	echo -e "${YELLOW}Starting development environment with Docker...${NONE}"
	docker compose -f "$DOCKER_DEVELOPER_COMPOSE_FILE" up -d --build
}

# Stop development containers
dev_down() {
	echo -e "${YELLOW}Stopping and removing development containers...${NONE}"
	docker compose -f "$DOCKER_DEVELOPER_COMPOSE_FILE" down -v
}

# Production environment
prod() {
	check_dependencies
	disable_local_database
	echo -e "${YELLOW}Starting production environment with Docker...${NONE}"
	docker compose -f "$DOCKER_PRODUCTION_COMPOSE_FILE" up -d --build
}

# Stop production containers
prod_down() {
	echo -e "${YELLOW}Stopping and removing production containers...${NONE}"
	docker compose -f "$DOCKER_PRODUCTION_COMPOSE_FILE" down -v
}

# Restart development containers
dev_restart() {
	echo -e "${YELLOW}Restarting development containers...${NONE}"
	docker compose -f "$DOCKER_DEVELOPER_COMPOSE_FILE" restart
}

# Restart production containers
prod_restart() {
	echo -e "${YELLOW}Restarting production containers...${NONE}"
	docker compose -f "$DOCKER_PRODUCTION_COMPOSE_FILE" restart
}

# Show development logs
logs_dev() {
	echo -e "${YELLOW}Showing logs for development containers...${NONE}"
	docker compose -f "$DOCKER_DEVELOPER_COMPOSE_FILE" logs -f
}

# Show production logs
logs_prod() {
	echo -e "${YELLOW}Showing logs for production containers...${NONE}"
	docker compose -f "$DOCKER_PRODUCTION_COMPOSE_FILE" logs -f
}

# Clean up Docker system
clean() {
	echo -e "${YELLOW}Cleaning up Docker system...${NONE}"
	docker system prune -af
}

# Main entry point
case "$1" in
	"test") spinner$$  ;;
	"dev") dev ;;
	"dev_down") dev_down ;;
	"prod") prod ;;
	"prod_down") prod_down ;;
	"dev_restart") dev_restart ;;
	"prod_restart") prod_restart ;;
	"logs_dev") logs_dev ;;
	"logs_prod") logs_prod ;;
	"clean") clean ;;
	"local") local ;;
	*) echo -e "${YELLOW}Usage: $0 {dev|dev_down|prod|prod_down|dev_restart|prod_restart|logs_dev|logs_prod|clean|local}${NONE}" ;;
esac
