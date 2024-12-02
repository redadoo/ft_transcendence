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
