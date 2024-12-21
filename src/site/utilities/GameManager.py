from enum import Enum
from abc import ABC, abstractmethod
from utilities.Player import Player

class GameManager(ABC):
    def __init__(self, max_players: int):
        self.max_players: int = max_players
        self.players: dict[int, Player] = {}

    @abstractmethod
    def init_player(self, players: list[Player]) -> None:
        """
        Initialize players and add them to the game.
        """
        return

    def is_game_full(self) -> bool:
        return len(self.players) >= self.max_players
    
    @abstractmethod
    async def init_game_loop(self) -> None:
        return

    @abstractmethod
    async def game_loop(self) -> None:
        """
        Core game loop logic.
        """
        return

    @abstractmethod
    def update_player(self, data: dict) -> None:
        """
        update player data
        """
        return

    @abstractmethod
    def player_disconnected(self, player_id: int) -> None:
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
