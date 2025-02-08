from datetime import datetime
import random
import asyncio
import time

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
		self.deck = self.init_cards()
		self.started = False
		self.current_time_stamp = time.time()
		self.player_turn_index = 0
		self.players_alive = 4

	def start_game(self):
		"""Marks the game as started."""
		self.start_match_timestamp = datetime.now()
		self.game_loop_is_active = True
		
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
  
		self.turn_assigned = False
		return deck

	def add_player(self, players_id: int, is_bot: bool):
		"""
		Adds a new player to the game using their unique ID.

		Args:
			players_id (int): The unique identifier for the player being added.

		Raises:
			ValueError: If there are already 4 players and the ID is already in the current players list.
		"""
		if len(self.players) > 4 and players_id in self.players:
			raise ValueError("Two unique player IDs are required to initialize players.")

		self.players[len(self.players)] = LiarsBarPlayer(player_id=players_id)

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
			for index in self.players:
				if self.players[index].player_id == player_id:
					self.players[index].update_player_data(data)
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

	def init_round(self):
		"""
		Handles the start of a round.

		Args:
			player_id (int): The ID of the player to mark as disconnected.
		"""
		print("card dealing")
		self.deck = self.init_cards()
		HAND_SIZE = 5
		self.card_required = Card.CardSeed(random.randint(1, 3))
		self.hands_cleared = 0
		print(f"card required: {self.card_required}")
		for player in self.players.values():
			cards_to_deal = self.deck[:HAND_SIZE]
			self.deck = self.deck[HAND_SIZE:]
			player.hand.clear()
			player.player_turn = False
			player.add_cards_to_hand(cards_to_deal)
			card_names = [card.to_dict() for card in player.hand]
			print(f"Player {player.player_id} has the following cards: {card_names}")
	
	
	def handle_palyer_turn(self, player: LiarsBarPlayer):
		print(player.player_id)
		print(player.status.name)
		if player.status == LiarsBarPlayer.PlayerStatus.ALIVE:
			player.player_turn = True
			self.turn_start = time.time()
			player.card_sent = False
			player.doubting = False
			player.selected_cards.clear()
			card_names = [card.to_dict() for card in player.hand]
			print(f"\n\n Player {player.player_id} has the following cards: {card_names}")
			if self.hands_cleared == (self.players_alive - 1):
				player.doubting = True
				print("forced doubt")
			if len(player.hand) == 0 and not player.doubting:
				print("turn skipping for empty hand")
				self.player_turn_index += 1
				if self.player_turn_index > 3:
						print("fix index")
						self.player_turn_index = 0
				player.player_turn = False
			if self.player_turn_index == 2:
				print(f"inserisco le carte nelle sue selected {player.player_id}")
				player.card_sent = True
				player.selected_cards.append(player.hand.pop(0))
		else:
			self.player_turn_index += 1
			if self.player_turn_index > 3:
					print("fix index")
					self.player_turn_index = 0
			player.player_turn = False
			
		
  
	async def game_loop(self):
		"""
		Executes the core game loop, managing player turns and game state.

		This method acquires a lock to ensure thread-safe updates to the game state.
		"""
		
		if self.players_alive == 1:
			print("mi blocco qua?")
			for player in self.players.values():
				if player.status == LiarsBarPlayer.PlayerStatus.ALIVE:
					print(player.player_id)
			return
		if(self.started != True):
			self.init_round()
			self.started = True
		if self.players[self.player_turn_index].player_turn == False:
			print("turn handle")
			self.handle_palyer_turn(self.players[self.player_turn_index])
		elif not self.players[self.player_turn_index].card_sent and self.players[self.player_turn_index].status == LiarsBarPlayer.PlayerStatus.ALIVE:
			if time.time() - self.turn_start > 5:
				print("timeout")
				if self.players[self.player_turn_index].shoot_yourself():
					self.players[self.player_turn_index].status = LiarsBarPlayer.PlayerStatus.DIED
					self.players_alive -= 1
					print("dead")
					self.started = False
				else:
					self.started = False
				print("round gone")
				self.player_turn_index += 1
				print(self.player_turn_index)
				if self.player_turn_index > 3:
					print("fix index")
					self.player_turn_index = 0
			elif self.players[self.player_turn_index].doubting: #aggiungi controllo primo turno
				print(f"Player {self.players[self.player_turn_index].player_id} Doubt")
				self.players[self.player_turn_index].doubting = False
				for i in range(1, 4):
					check_index = (self.player_turn_index - i) % 4
					print(f"{self.players[check_index].player_id}, {self.players[check_index].status}, {self.players[check_index].card_sent} ")
					if self.players[check_index].status == LiarsBarPlayer.PlayerStatus.ALIVE and self.players[check_index].card_sent:
						card_names = [card.to_dict() for card in self.players[check_index].selected_cards]
						print(f"Player {self.players[check_index].player_id} has the following cards: {card_names}")
						if all(card.seed == self.card_required or card.seed == Card.CardSeed.JOLLY for card in self.players[check_index].selected_cards):
							print(f"player {self.players[check_index].player_id} had the required card")
							if self.players[self.player_turn_index].shoot_yourself():
								self.players[self.player_turn_index].status = LiarsBarPlayer.PlayerStatus.DIED
								self.players_alive -= 1
								print("dead\n")
								self.started = False
							else:
								self.started = False
							self.player_turn_index += 1
							if self.player_turn_index > 3:
									print("fix index")
									self.player_turn_index = 0
							break
						else:
							print(f"player {self.players[check_index].player_id} had not the required card")
							if self.players[check_index].shoot_yourself():
								self.players[check_index].status = LiarsBarPlayer.PlayerStatus.DIED
								self.players_alive -= 1
								print("dead\n")
								self.started = False
							else:
								self.started = False
							self.player_turn_index += 1
							if self.player_turn_index > 3:
									print("fix index")
									self.player_turn_index = 0
							break
		if self.players[self.player_turn_index].card_sent and self.started:
			print("ho mandato carte\n")
			if len(self.players[self.player_turn_index].hand) == 0:
				print("hand cleared")
				self.hands_cleared += 1
			self.players[self.player_turn_index].player_turn = False
			self.player_turn_index += 1
			if self.player_turn_index > 3:
					print("fix index")
					self.player_turn_index = 0

			
		
		

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