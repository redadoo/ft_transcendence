from enum import Enum
from abc import ABC, abstractmethod


class Player(ABC):
    class PlayerConnectionState(Enum):
        CONNECTED = 0
        DISCONNECTED = 1

    def __init__(self, player_id: int):
        self.player_id = player_id
        self.status = Player.PlayerConnectionState.CONNECTED

    def disconnect(self):
        """
        Handles generic disconnection logic. Subclasses can override this
        if additional disconnection behavior is needed.
        """
        self.status = Player.PlayerConnectionState.DISCONNECTED

    @abstractmethod
    def player_disconnection(self):
        """
        Abstract method for handling player-specific disconnection logic.
        Subclasses must implement this.
        """
        pass

    @abstractmethod
    def to_dict(self):
        """
        Convert the player object to a dictionary for serialization.
        Subclasses must implement this.
        """
        return {
            "player_id": self.player_id,
            "player_connection_state": self.status.name,
        }
