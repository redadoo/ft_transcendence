#!/bin/bash
# Usage: ./test_pong_api.sh {conn|start|move_up|move_down}

# Get initial cookies (including CSRF token)
curl -c cookies.txt http://localhost:8000/ >/dev/null 2>&1

# Extract the CSRF token from cookies.txt
CSRF_TOKEN=$(grep csrftoken cookies.txt | awk '{print $7}')
echo "CSRF Token: $CSRF_TOKEN"

# Function to retrieve stored room name (if exists)
get_room() {
  if [ -f room.txt ]; then
    cat room.txt
  else
    echo ""
  fi
}

if [ "$1" == "conn" ]; then
    echo "Creating a new Pong room..."
    # Call /api/pong/init to create a new game
    INIT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/pong/init \
         -H "Content-Type: application/json" \
         -H "X-CSRFToken: $CSRF_TOKEN" \
         -b cookies.txt)
    echo "Init Response: $INIT_RESPONSE"
    
    # Extract the room_name using sed (alternative to jq)
    ROOM_NAME=$(echo "$INIT_RESPONSE" | sed -n 's/.*"room_name":"\([^"]*\)".*/\1/p')
    echo "New room created: $ROOM_NAME"
    
    # Store the room name for later use
    echo "$ROOM_NAME" > room.txt

elif [ "$1" == "start" ]; then
    ROOM_NAME=$(get_room)
    if [ -z "$ROOM_NAME" ]; then
       echo "No room found. Please run with 'conn' first."
       exit 1
    fi

    echo "Starting lobby for room: $ROOM_NAME"
    curl -X POST http://localhost:8000/api/pong/start_lobby \
         -H "Content-Type: application/json" \
         -H "X-CSRFToken: $CSRF_TOKEN" \
         -b cookies.txt \
         -d "{\"room_name\": \"$ROOM_NAME\"}"
    echo -e "\nLobby started."

elif [ "$1" == "move_up" ]; then
    ROOM_NAME=$(get_room)
    if [ -z "$ROOM_NAME" ]; then
       echo "No room found. Please run with 'conn' first."
       exit 1
    fi

    echo "Simulating 5 upward moves (KeyW) for room: $ROOM_NAME"
    for i in {1..5}
    do
         echo "Move up $i: Sending key_down event (KeyW)..."
         curl -s -X POST http://localhost:8000/api/pong/player_control \
             -H "Content-Type: application/json" \
             -H "X-CSRFToken: $CSRF_TOKEN" \
             -b cookies.txt \
             -d "{\"room_name\": \"$ROOM_NAME\", \"player_id\": \"-1\", \"action_type\": \"key_down\", \"key\": \"KeyW\"}"
         
         echo "Move up $i: Sending key_up event (KeyW)..."
         curl -s -X POST http://localhost:8000/api/pong/player_control \
             -H "Content-Type: application/json" \
             -H "X-CSRFToken: $CSRF_TOKEN" \
             -b cookies.txt \
             -d "{\"room_name\": \"$ROOM_NAME\", \"player_id\": \"-1\", \"action_type\": \"key_up\", \"key\": \"KeyW\"}"
         
         echo "Upward move $i executed."
         sleep 1
    done

elif [ "$1" == "move_down" ]; then
    ROOM_NAME=$(get_room)
    if [ -z "$ROOM_NAME" ]; then
       echo "No room found. Please run with 'conn' first."
       exit 1
    fi

    echo "Simulating 5 downward moves (KeyS) for room: $ROOM_NAME"
    for i in {1..5}
    do
         echo "Move down $i: Sending key_down event (KeyS)..."
         curl -s -X POST http://localhost:8000/api/pong/player_control \
             -H "Content-Type: application/json" \
             -H "X-CSRFToken: $CSRF_TOKEN" \
             -b cookies.txt \
             -d "{\"room_name\": \"$ROOM_NAME\", \"player_id\": \"-1\", \"action_type\": \"key_down\", \"key\": \"KeyS\"}"
         
         echo "Move down $i: Sending key_up event (KeyS)..."
         curl -s -X POST http://localhost:8000/api/pong/player_control \
             -H "Content-Type: application/json" \
             -H "X-CSRFToken: $CSRF_TOKEN" \
             -b cookies.txt \
             -d "{\"room_name\": \"$ROOM_NAME\", \"player_id\": \"-1\", \"action_type\": \"key_up\", \"key\": \"KeyS\"}"
         
         echo "Downward move $i executed."
         sleep 1
    done

else
    echo "Usage: $0 {conn|start|move_up|move_down}"
fi
