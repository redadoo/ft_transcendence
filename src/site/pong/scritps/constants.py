# Configurazione del gioco (valori di default)
PADDLE_WIDTH = 0.7         # Larghezza della paddle
PADDLE_HEIGHT = 4          # Altezza della paddle
PADDLE_DEPTH = 1.2         # Altezza della paddle
PADDLE_SPEED = 0.9         # Velocità della paddle
PADDLE_COLOR = 16777215    # Colore della paddle

BALL_SPEED_X = 0.4         # Velocità della palla sull'asse X
BALL_SPEED_Y = 0.4         # Velocità della palla sull'asse Y
BALL_RADIUS = 0.8          # Raggio della palla
BALL_POSITION = [0, 0]     # Posizione iniziale della palla

# Limiti dell'area di gioco
# X_MIN = -20
# X_MAX = 20
# Y_MIN = -SCREEN_HEIGHT / 2
# Y_MAX = SCREEN_HEIGHT / 2

GAME_BOUNDS = {
	"xMin": -20,
	"xMax": 20,
	"yMin": -15,
	"yMax": 15,
}