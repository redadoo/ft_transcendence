# Game Configuration (default values)
# Paddle Configuration
PADDLE_WIDTH = 0.7         # Width of the paddle
PADDLE_HEIGHT = 4          # Height of the paddle
PADDLE_DEPTH = 1.2         # Depth of the paddle (for 3D simulation)
PADDLE_SPEED = 0.9         # Speed of the paddle
PADDLE_COLOR = 16777215    # Color of the paddle (in RGB format, e.g., white)

# Ball Configuration
BALL_SPEED_X = 0.4         # Speed of the ball along the X axis
BALL_SPEED_Y = 0.4         # Speed of the ball along the Y axis
BALL_RADIUS = 0.8          # Radius of the ball
BALL_POSITION = [0, 0]     # Initial position of the ball (centered)

# Game Area Limits
# X_MIN and X_MAX define the horizontal area
# Y_MIN and Y_MAX define the vertical area
GAME_BOUNDS = {
    "xMin": -20,            # Lower limit for the X axis
    "xMax": 20,             # Upper limit for the X axis
    "yMin": -15,            # Lower limit for the Y axis
    "yMax": 15,             # Upper limit for the Y axis
}