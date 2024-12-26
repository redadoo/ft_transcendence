import random
import asyncio

from .card import Card
from .LiarsBarPlayer import LiarsBarPlayer
from utilities.GameManager import GameManager
from utilities.Player import Player

class LiarsBarGameManager(GameManager):
	"""
	Manages the Liars Bar game, including player interactions, game state, and deck management.
	"""

	def __init__(self):
		"""
		Initialize the Liars Bar game manager with a maximum of 4 players, a shuffled deck of cards, 
		and mechanisms for tracking the game state and winner.
		"""
		super().__init__(max_players=4)
		self.update_lock = asyncio.Lock()
		self.deck = self.init_cards()

	def init_cards(self) -> list[Card]:
		"""
		Initializes a shuffled deck of cards for the game.

		Returns:
			list[Card]: A list of Card objects representing the shuffled deck.
		"""
		deck = []

		for seed in [Card.CardSeed.ACE, Card.CardSeed.KING, Card.CardSeed.QUEEN]:
			deck.extend([Card(seed)] * 6)

		deck.extend([Card(Card.CardSeed.JOLLY)] * 2)
		random.shuffle(deck)
		return deck

	def add_player(self, players_id: int):
		"""
		Adds a new player to the game using their unique ID.

		Args:
			players_id (int): The unique identifier for the player being added.

		Raises:
			ValueError: If there are already 4 players and the ID is already in the current players list.
		"""
		if len(self.players) > 4 and players_id in self.players:
			raise ValueError("Two unique player IDs are required to initialize players.")

		self.players[players_id] = LiarsBarPlayer(player_id=players_id)

	def update_player(self, data: dict):
		"""
		Updates player data based on the provided dictionary.

		Args:
			data (dict): A dictionary containing the player's update information, including the player ID.

		Raises:
			KeyError: If the player ID is not found in the current players.
		"""
		try:
			player_id = data.get("playerId")
			if player_id not in self.players:
				raise KeyError(f"Player ID {player_id} not found.")

			self.players[player_id].update_player_data(data)
		except (KeyError, ValueError) as e:
			print(f"Error updating player data: {e}")

	def player_disconnected(self, player_id: int):
		"""
		Handles the logic for when a player disconnects from the game.

		Args:
			player_id (int): The ID of the player to mark as disconnected.
		"""
		player = self.players.get(player_id)
		if player:
			player.status = Player.PlayerConnectionState.DISCONNECTED
			print(f"Player {player_id} marked as disconnected.")
		else:
			print(f"Error: Player ID {player_id} not found in players.")

	async def game_loop(self):
		"""
		Executes the core game loop, managing player turns and game state.

		This method acquires a lock to ensure thread-safe updates to the game state.
		"""
		async with self.update_lock:
			for player in self.players.values():
				player.player_loop()

	def to_dict(self) -> dict[str, any]:
		"""
		Converts the current game state to a dictionary format.

		Returns:
			dict[str, any]: A dictionary representation of the game state, including players and the deck.
		"""
		base_dict = super().to_dict()
		base_dict.update({
			"deck": [card.to_dict() for card in self.deck]
		})
		return base_dict