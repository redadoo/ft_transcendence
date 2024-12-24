from pong.scritps import constants


class Paddle:

    def __init__(self, color: int, x: int):
        self.x = x
        self.y = 0
        self.height = constants.PADDLE_HEIGHT
        self.width = constants.PADDLE_WIDTH
        self.depth = constants.PADDLE_DEPTH
        self.speed = constants.PADDLE_SPEED
        self.color = color


    def to_dict(self) -> dict:
        base_dict = {
            "x": self.x,
			"y": self.y,
			"height": self.height,
			"width": self.width,
			"depth": self.depth,
			"speed": self.speed,
			"color": self.color,
        }
        return base_dict     
        
