import json
import uuid
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer
from pong.scritps.pong_player import PongPlayer
from pong.scritps.ai import PongAI
from utilities.lobbies import Lobbies
from pong.scritps import constants
from pong.scritps.ball import Ball
from pong.scritps import PongGameManager

lobbies = Lobbies()

class  PongSingleplayerConsumer(AsyncWebsocketConsumer):
	game_started = False
	game_over = False

	async def connect(self):
		# Recupera il nome della stanza dall'URL
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.room_group_name = f"pong_singleplayer_{self.room_name}"

		# Crea o recupera la lobby usando la classe Lobbies

		self.lobby = lobbies.create_lobby(self.room_name, {
				"players": {},
				"ball": Ball(),
				"scores": {
					"player": 0,  # Punteggio del giocatore umano
					"player2": 0,  # Punteggio dell'AI
				},
			})

		# Aggiungi il WebSocket al gruppo della stanza
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)

		# Accetta la connessione
		await self.accept()

		self.update_lock = asyncio.Lock()

		# Aggiungi il giocatore umano alla lobby
		self.player_id = str(uuid.uuid4())
		async with self.update_lock:
			self.lobby["players"][self.player_id] = PongPlayer(
				player_id=self.player_id,
				x=constants.GAME_BOUNDS["xMin"] + 1,
				color=constants.PADDLE_COLOR,
			)
			# Aggiungi l'AI alla lobby, se non già presente
			if "AI" not in self.lobby["players"]:
				self.lobby["players"]["AI"] = PongPlayer(
					player_id="AI",
					x=constants.GAME_BOUNDS["xMax"] - 1,
					color=constants.PADDLE_COLOR,
				)
		self.ai_controller = PongAI(self.lobby["players"]["AI"])

		# Invia i dati iniziali al client
		await self.send(
			text_data=json.dumps(
				{
					"type": "playerId",
					"playerId": self.player_id,
					"players": {
						pid: player.to_dict()
						for pid, player in self.lobby["players"].items()
					},
					"bounds": constants.GAME_BOUNDS,
					"ball": self.lobby["ball"].to_dict(),
					"scores": self.lobby["scores"],
				}
			)
		)

	async def disconnect(self, close_code):
		# Rimuovi il giocatore dal gruppo della stanza
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

		# Rimuovi il giocatore dalla lobby
		async with self.update_lock:
			if self.player_id in self.lobby["players"]:
				del self.lobby["players"][self.player_id]

			# Se non ci sono più giocatori nella lobby, rimuovila
			if len(self.lobby["players"]) == 0:
				lobbies.remove_lobby(self.room_name)

		# Aggiorna lo stato del gioco per tutti i client rimasti
		await self.broadcast_lobby()

	async def receive(self, text_data):
		data = json.loads(text_data)
		event_type = data.get("type")
		key = data.get("key")
		player_id = data.get("playerId")
		  
		if event_type == "ready" and player_id == self.player_id:	
			# Avvia il ciclo del gioco
			if not self.game_started:
				self.game_started = True
				asyncio.create_task(self.game_loop())
		if player_id == self.player_id:
			async with self.update_lock:
				player = self.lobby["players"][self.player_id]
				if event_type == "key_down":
					if key == "KeyW":
						player.isMovingUp = True
					elif key == "KeyS":
						player.isMovingDown = True
				elif event_type == "key_up":
					if key == "KeyW":
						player.isMovingUp = False
					elif key == "KeyS":
						player.isMovingDown = False

	def start_game(self):
		self.lobby["ball"].reset()

	async def game_loop(self):
		if not self.game_started and len(self.lobby["players"]) > 1:
			self.start_game()

		while len(self.lobby["players"]) > 1:
			async with self.update_lock:
				for player_id, player in self.lobby["players"].items():
					if player_id == "AI":
						self.ai_controller.update_position(self.lobby["ball"])
					else:
						player.update_player_position()
				# Aggiorna la posizione della palla
				self.lobby["ball"].update_position()

					# Controlla se la palla esce dai limiti laterali
				out_of_bounds = self.lobby["ball"].is_out_of_bounds()
				if out_of_bounds == "right":
					# Punto per il giocatore
					self.lobby["scores"]["player"] += 1
					self.lobby["ball"].reset()
				elif out_of_bounds == "left":
					# Punto per l'AI
					self.lobby["scores"]["player2"] += 1
					self.lobby["ball"].reset()

				if self.lobby["scores"]["player"] >= 4 or self.lobby["scores"]["player2"] >= 4:
					game_over = True
					winner = "player" if self.lobby["scores"]["player"] >= 5 else "player2"
					await self.broadcast_game_over(winner)
					break

				# Gestione delle collisioni con le paddle
				for player_id, player in self.lobby["players"].items():
					self.lobby["ball"].handle_paddle_collision(player)

			# Invia lo stato aggiornato del gioco
			await self.broadcast_lobby()
			await asyncio.sleep(1 / 60)  # 60 FPS

	async def broadcast_game_over(self, winner):
		"""Invia un messaggio di fine partita a tutti i giocatori."""
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				"type": "game_over",
				"winner": winner,
			},
		)

	async def game_over(self, event):
		"""Gestisce la fine della partita lato client."""
		await self.send(
			text_data=json.dumps(
				{
					"type": "gameOver",
					"winner": event["winner"],
				}
			)
		)

	async def broadcast_lobby(self):
		"""Invia lo stato del gioco a tutti i client nella stanza."""
		ball_data = self.lobby["ball"].to_dict()
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				"type": "state_update",
				"players": {pid: player.to_dict() for pid, player in self.lobby["players"].items()},
				"ball": ball_data,
				"scores": self.lobby["scores"],
			},
		)

	async def state_update(self, event):
		"""Gestisce l'aggiornamento dello stato lato client."""

		await self.send(
			text_data=json.dumps(
				{
					"type": "stateUpdate",
					"players": event["players"],
					"ball": event["ball"],
					"scores": event["scores"],
				}
			)
		)

	async def external_start_game(self, event):
			"""
			Handle the start game event triggered from the API.
			"""
			if not self.game_started:
				self.game_started = True
				await self.send(text_data=json.dumps({"type": "system", "message": event["message"]}))
				asyncio.create_task(self.game_loop())

	async def external_update_player(self, event):
		async with self.update_lock:
			player = self.lobby["players"].get(event["player_id"])
			if player:
				player.update_from_dict(event["player_data"])
				await self.broadcast_lobby()


class PongMultiplayerConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		# Recupera il nome della stanza dall'URL
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.room_group_name = f"pong_multiplayer_{self.room_name}"

		# Crea o recupera la lobby
		self.lobby = lobbies.create_lobby(self.room_name, {
			"players": {},  # Giocatori della lobby
			"ball": Ball(),  # Istanza della palla
			"scores": {
				"player1": 0,  # Punteggio del giocatore 1
				"player2": 0,  # Punteggio del giocatore 2
			},
		})

		# Aggiungi il WebSocket al gruppo della stanza
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)

		# Accetta la connessione
		await self.accept()

		self.update_lock = asyncio.Lock()
		self.player_id = str(uuid.uuid4())

		async with self.update_lock:
			# Se c'è un posto libero, aggiungi il giocatore
			if len(self.lobby["players"]) < 2:
				position = "player1" if "player1" not in self.lobby["players"] else "player2"
				self.lobby["players"][position] = PongPlayer(
					player_id=self.player_id,
					x=constants.GAME_BOUNDS["xMin"] if position == "player1" else constants.GAME_BOUNDS["xMax"],
					color=constants.PADDLE_COLOR,
				)
				self.player_position = position
			else:
				# La lobby è piena
				await self.close()

		# Invia i dati iniziali al client
		await self.send(
			text_data=json.dumps({
				"type": "playerId",
				"playerId": self.player_id,
				"position": self.player_position,
				"players": {
					pos: player.to_dict() for pos, player in self.lobby["players"].items()
				},
				"bounds": constants.GAME_BOUNDS,
				"ball": self.lobby["ball"].to_dict(),
				"scores": self.lobby["scores"],
			})
		)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

		# Rimuovi il giocatore
		async with self.update_lock:
			if self.player_position in self.lobby["players"]:
				del self.lobby["players"][self.player_position]

			# Se non ci sono più giocatori nella lobby, rimuovila
			if len(self.lobby["players"]) == 0:
				lobbies.remove_lobby(self.room_name)

		# Aggiorna lo stato della lobby
		await self.broadcast_lobby()

	async def receive(self, text_data):
		data = json.loads(text_data)
		event_type = data.get("type")
		key = data.get("key")

		if event_type == "ready":
			if len(self.lobby["players"]) == 2:  # Entrambi i giocatori devono essere pronti
				asyncio.create_task(self.game_loop())

		elif event_type in ("key_down", "key_up"):
			async with self.update_lock:
				player = self.lobby["players"].get(self.player_position)
				if player:
					if event_type == "key_down":
						if key == "KeyW":
							player.isMovingUp = True
						elif key == "KeyS":
							player.isMovingDown = True
					elif event_type == "key_up":
						if key == "KeyW":
							player.isMovingUp = False
						elif key == "KeyS":
							player.isMovingDown = False

	async def game_loop(self):
		self.start_game()

		while len(self.lobby["players"]) == 2:  # Deve esserci almeno un giocatore per continuare
			async with self.update_lock:
				# Aggiorna la posizione dei giocatori
				for position, player in self.lobby["players"].items():
					player.update_player_position()

				# Aggiorna la posizione della palla
				self.lobby["ball"].update_position()

				# Controlla collisioni con i paddle
				for position, player in self.lobby["players"].items():
					self.lobby["ball"].handle_paddle_collision(player)

				# Controlla i punti
				out_of_bounds = self.lobby["ball"].is_out_of_bounds()
				if out_of_bounds == "right":
					self.lobby["scores"]["player1"] += 1
					self.lobby["ball"].reset()
				elif out_of_bounds == "left":
					self.lobby["scores"]["player2"] += 1
					self.lobby["ball"].reset()

				# Controlla la vittoria
				if self.lobby["scores"]["player1"] >= 5 or self.lobby["scores"]["player2"] >= 5:
					winner = "player1" if self.lobby["scores"]["player1"] >= 5 else "player2"
					await self.broadcast_game_over(winner)
					break

			# Aggiorna lo stato della lobby
			await self.broadcast_lobby()
			await asyncio.sleep(1 / 60)  # 60 FPS

	async def broadcast_lobby(self):
		"""Invia lo stato del gioco a tutti i client."""
		ball_data = self.lobby["ball"].to_dict()
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				"type": "state_update",
				"players": {pos: player.to_dict() for pos, player in self.lobby["players"].items()},
				"ball": ball_data,
				"scores": self.lobby["scores"],
			}
		)

	async def state_update(self, event):
		"""Aggiorna lo stato lato client."""
		await self.send(
			text_data=json.dumps({
				"type": "stateUpdate",
				"players": event["players"],
				"ball": event["ball"],
				"scores": event["scores"],
			})
		)

	async def broadcast_game_over(self, winner):
		"""Informa i giocatori della fine della partita."""
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				"type": "game_over",
				"winner": winner,
			}
		)

	async def game_over(self, event):
		"""Gestisce la fine della partita lato client."""
		await self.send(
			text_data=json.dumps({
				"type": "gameOver",
				"winner": event["winner"],
			})
		)

	def start_game(self):
		"""Avvia il gioco."""
		self.lobby["ball"].reset()
