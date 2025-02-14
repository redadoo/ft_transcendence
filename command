## postgres commnad

sudo -u postgres psql

# Create a New User in PostgreSQL
sudo -u postgres createuser -e [name]

# Create a New User in PostgreSQL with password
sudo -u postgres createuser [name] -P

# Create a New User in PostgreSQL with password and superuser
sudo -u postgres createuser -s 42user -P

# show all database
\l

# connect to database 
\c database_name

# show all table 
\dt

#remove content for table with with reference
truncate table auth_user CASCADE;

#stop postgress
sudo systemctl stop postgresql

# see port
sudo lsof -i :<PORT>

docker run --rm -p 6379:6379 redis:7

#command to log and use pong API
curl -X POST http://localhost:8000/api/users/login/ -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}'

#after get coockies
curl -c cookies.txt http://localhost:8000/

#test
curl -X POST http://localhost:8000/api/pong/init/ \
     -H "Content-Type: application/json" \
     -H "X-CSRFToken: NEWTOKENVALUE" \
     -b cookies.txt

curl -X POST http://localhost:8000/api/pong/player_control/ \
     -H "Content-Type: application/json" \
     -H "X-CSRFToken: NEWTOKENVALUE" \
     -b cookies.txt \
     -d '{"room_name": "admin", "player_id": "admin123", "control_data": "ciao"}'

curl -X POST http://localhost:8000/api/pong/game_state/ \
     -H "Content-Type: application/json" \
     -H "X-CSRFToken: NEWTOKENVALUE" \
     -b cookies.txt \
     -d '{"room_name": "admin"}'
