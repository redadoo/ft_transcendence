import websocket
import threading
import json
import time

WEBSOCKET_URL = "ws://localhost:8000/ws/tournament/pong/test-room"

def on_message(ws, message):
    print(f"Received: {message}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws, player_id):
    print(f"Connection opened for player {player_id}")
    init_event = {
        "type": "init_player",
        "player_id": player_id
    }
    ws.send(json.dumps(init_event))

def create_connection(player_id):
    ws = websocket.WebSocketApp(
        WEBSOCKET_URL,
        on_open=lambda ws: on_open(ws, player_id),
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()

if __name__ == "__main__":
    threads = []
    players_id = ["-2","-3","-4"]
    for i in range(1):
        player_id = i + 1
        t = threading.Thread(target=create_connection, args=(players_id[i],))
        threads.append(t)
        t.start()
        time.sleep(1)

    for t in threads:
        t.join()
