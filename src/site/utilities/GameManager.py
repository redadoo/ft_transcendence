from abc import ABC, abstractmethod
from utilities.Player import Player

class GameManager(ABC):
    def __init__(self, max_players: int):
        self.max_players: int = max_players
        self.players: dict[int, Player] = {}

    @abstractmethod
    def add_player(self, player_id: int):
        """
        Initialize players and add them to the game.
        """
        return

    @abstractmethod
    async def game_loop(self):
        """
        Core game loop logic.
        """
        return

    @abstractmethod
    def update_player(self, data: dict):
        """
        update player data
        """
        return

    @abstractmethod
    def player_disconnected(self, player_id: int):
        """
        Handle logic when a player disconnects.
        """
        return
    
    def to_dict(self) -> dict[str, any]:
        """
        Convert the game manager state to a dictionary.
        """
        return {
            "players": {player_id: player.to_dict() for player_id, player in self.players.items()},
        }
