const html = {
	empty: `
		<div>
		</div>
	`,
	home: `
		<div class="main-container container-fluid mt-5 pt-3">
			<div class="row h-100">
			
				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<div class="nav-link-left back" data-link="/logout">
								<span class="hundin-font back">LOGOUT</span>
							</div>
						</div>
					</nav>
				</div>

				<div class="col-1"></div>

				<div class="col-9 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<div class="nav-link-right multiplayer" data-link="/multiplayer">
								<span class="pixel-font multiplayer">MP </span>
								<div class="column-text">
									<span class="hundin-font multiplayer text-up">MULTIPLAYER</span>
									<span class="hundin-font multiplayer text-down">PLAY WITH FRIENDS AND FOES.</span>
								</div>
							</div>
							<div class="nav-link-right singleplayer" data-link="/singleplayer/pong">
								<span class="pixel-font singleplayer">SP </span>
								<div class="column-text">
									<span class="hundin-font singleplayer text-up">SINGLEPLAYER</span>
									<span class="hundin-font singleplayer text-down">SOLO MODE. SHOW YOUR SKILLS.</span>
								</div>
							</div>
							<div class="nav-link-right config" data-link="/config">
								<span class="pixel-font config">CFG</span>
								<div class="column-text">
									<span class="hundin-font config text-up">CONFIG</span>
									<span class="hundin-font config text-down">CUSTOMIZE YOUR EXPERIENCE.</span>
								</div>
							</div>
							<div class="nav-link-right about" data-link="/about">
								<span class="pixel-font about">ABT</span>
								<div class="column-text">
									<span class="hundin-font about text-up">ABOUT</span>
									<span class="hundin-font about text-down">EVERYTHING ABOUT TRANSCENDENCE.</span>
								</div>
							</div>
						</div>
					</nav>
				</div>
			</div>
		</div>
	`,

	login: `
		<div class="container mt-5 pt-5">
			<div class="row justify-content-center">
				<div class="col-md-6 col-lg-5">
					<form id="loginForm" class="registration-form p-4">
						<div class="mb-3">
							<label for="username">Username</label>
							<input type="text" class="form-control" id="username" name="username" required>
						</div>
						<div class="mb-3">
							<label for="password">Password</label>
							<input type="password" class="form-control" id="password" name="password" required>
						</div>
						<div class="alert alert-danger d-none" id="loginError"></div>
						<div class="buttons-container">
							<button type="submit" class="btn btn-register flex-grow-1">Login</button>
						</div>

						<div class="divider mt-4 mb-4"> or </div>

						<div class="d-flex flex-column gap-3 text-center">
							<div class="auth-option p-2 rounded">
								<a class="text-decoration-none" data-link="/register">
									<div class="d-flex align-items-center justify-content-center gap-2">
										<span class="auth-text">Create new account</span>
									</div>
								</a>
							</div>

							<div class="auth-option p-2 rounded">
								<a class="text-decoration-none" data-link="/login42">
									<div class="d-flex align-items-center justify-content-center gap-2">
										<span class="auth-text">Login with 42</span>
									</div>
								</a>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	`,

	login42: `
				<div class="container mt-5 pt-5">
			<div class="row justify-content-center">
				<div class="col-md-6 col-lg-5">
					<form id="loginForm" class="registration-form p-4">
						<div class="alert alert-danger d-none" id="loginError"></div>
						<div class="buttons-container">
							<button type="submit" class="btn btn-register flex-grow-1">Login 42</button>
						</div>

						<div class="divider mt-4 mb-4"> or </div>

						<div class="d-flex flex-column gap-3 text-center">
							<div class="auth-option p-2 rounded">
								<a class="text-decoration-none" data-link="/register">
									<div class="d-flex align-items-center justify-content-center gap-2">
										<span class="auth-text">Create new account</span>
									</div>
								</a>
							</div>

							<div class="auth-option p-2 rounded">
								<a class="text-decoration-none" data-link="/login">
									<div class="d-flex align-items-center justify-content-center gap-2">
										<span class="auth-text">Login</span>
									</div>
								</a>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	`,

	register: `
		<div class="container mt-5 pt-5">
			<div class="row justify-content-center">
				<div class="col-md-6 col-lg-5">
					<form id="registerForm" class="registration-form p-4">
						<div class="alert alert-danger d-none" id="non-field-errors"></div>
						<div class="mb-3">
							<label for="username">Username</label>
							<input type="text" class="form-control" id="username">
							<div class="d-none" style="color: pink;" id="invalid-username"></div>
						</div>
						<div class="mb-3">
							<label for="email">Email</label>
							<input type="email" class="form-control" id="email">
							<div class="d-none" style="color: pink;" id="invalid-email"></div>
						</div>
						<div class="mb-3">
							<label for="password1">Password</label>
							<input type="password" class="form-control" id="password1">
							<div class="d-none" style="color: pink;" id="invalid-password1">jionono</div>
						</div>
						<div class="mb-3">
							<label for="password2">Confirm Password</label>
							<input type="password" class="form-control" id="password2">
							<div class="d-none" style="color: pink;" id="invalid-password2"></div>
						</div>
						<div class="buttons-container">
							<button type="submit" class="btn btn-register flex-grow-1">Register</button>
						</div>

						<div class="divider mt-4 mb-4"> or </div>

						<div class="d-flex flex-column gap-3 text-center">
							<div class="auth-option p-2 rounded">
								<a class="text-decoration-none" data-link="/login">
									<div class="d-flex align-items-center justify-content-center gap-2">
										<span class="auth-text">Login</span>
									</div>
								</a>
							</div>

							<div class="auth-option p-2 rounded">
								<a class="text-decoration-none" data-link="/login42">
									<div class="d-flex align-items-center justify-content-center gap-2">
										<span class="auth-text">Login with 42</span>
									</div>
								</a>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	`,

	multiplayer: `
		<div class="container-fluid game-container">
			<div class="row h-100">

				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<div class="nav-link-left back" data-link="/">
								<span class="hundin-font back">BACK</span>
							</div>
						</div>
					</nav>
				</div>

				<div class="col-5 p-4">
					<div class="game-card pong" data-link="/multiplayer/pong_selection">
					<div class="game-box">
						<div class="game-content">
						<h2 class="pixel-font">PONG</h2>
						<p class="hundin-font">THE CLASSIC GAME</p>
						</div>
					</div>
					</div>
				</div>

				<div class="col-5 p-4">
					<div class="game-card game2" data-link="/multiplayer/liarsbar">
					<div class="game-box">
						<div class="game-content">
						<h2 class="pixel-font">LIAR'S BAR</h2>
						<p class="hundin-font">THE NOT SO CLASSIC GAME</p>
						</div>
					</div>
					</div>
				</div>
			</div>
		</div>
	`,

	alreadyLoggedIn: `
		<div class="container mt-5 pt-5">
			<div class="row justify-content-center">
				<div class="col-md-6 col-lg-5">
				<div class="already-logged p-4 mt-5">
					<h2 style="font-family: 'pfw'; color: #de4f5d;">Already Logged In!</h2>
					<p id="alreadyLoggedInUsername"></p>
					<div class="buttons-container">
						<div class="btn btn-register flex-grow-1" data-link="/">Home</div>
						<div class="btn btn-register flex-grow-1" data-link="/logout">Logout</div>
					</div>
				</div>
			</div>
		</div>
	`,

	pong: `
		<div id="pong-container" class="container-fluid game-container d-flex justify-content-center align-items-center">
			<div class="text-center">
				<h1 class="pixel-font multiplayer">PONG</h1>
				<p id="matchmakingStatus" class="hundin-font text-up multiplayer">Click below to start matchmaking</p>
				<button id="startMatchmaking" class="btn btn-matchmaking">
					START MATCHMAKING
				</button>
			</div>
		</div>
	`,

	singleplayerPong: `
	<div class="container-fluid game-container">
			<div class="row h-100">

				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<a class="nav-link-left back" data-link="/">
								<span class="hundin-font back">BACK</span>
							</a>
						</div>
					</nav>
				</div>
				<div class="col-1"></div>

				<div class="col-9 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<a class="nav-link-right Vs-bot" data-link="/singleplayer/pong/selection/vs_bot">
								<span class="pixel-font Vs-bot">BOT</span>
								<div class="column-text">
									<span class="hundin-font Vs-bot text-up">Vs bot</span>
									<span class="hundin-font Vs-bot text-down">TRAIN YOUR SKILLS</span>
								</div>
							</a>
							<a class="nav-link-right Same-keyboard" data-link="/singleplayer/pong/selection/same_keyboard">
								<span class="pixel-font Same-keyboard">SK</span>
								<div class="column-text">
									<span class="hundin-font Same-keyboard text-up">Same keyboard</span>
									<span class="hundin-font Same-keyboard text-down">HAVE FUN WITH A FRIEND</span>
								</div>
							</a>
						</div>
					</nav>
				</div>
			</div>
		</div>
	`,

	pongOverlay: `
		<div id="pong-container" class="container-fluid game-container d-flex justify-content-center align-items-center">
			<div class="text-center">
				<h1 class="pixel-font multiplayer">CONGRATULATIONS!</h1>
				<p id="matchmakingStatus" class="hundin-font text-up multiplayer">Wait for your next opponent...</p>
			</div>
		</div>
	`,

	pongCountDown:
	`
		<div class="container-fluid">
			<!-- Orologio posizionato in alto al centro -->
			<div id="clockOverlay" style="position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 1000;">
				<div id="clockContainer" class="pulsatered" style="position: relative; width: 120px; height: 120px;">
					<img id="clockImage" src="/media/png/timer.png" alt="Orologio">
					<div id="PongClockText" class="red"></div>
				</div>
			</div>
			<div class="players-container">
				<div class="player-text" id="player1">Player 1</div>
				<div class="player-text" id="player2">Player 2</div>
			</div>
		</div>
	`,

	liarsbar: `
		<div id="pong-container" class="container-fluid game-container d-flex justify-content-center align-items-center">
			<div class="text-center">
				<h1 class="pixel-font multiplayer">LIAR'S BAR</h1>
				<p id="matchmakingStatus" class="hundin-font text-up multiplayer">Click below to start matchmaking</p>
				<button id="startMatchmaking" class="btn btn-matchmaking">
					START MATCHMAKING
				</button>
			</div>
		</div>
	`,

	liarsbarOverlay: `

		<div class="container-fluid">
		 <!-- Orologio posizionato in alto al centro -->
		<div id="clockOverlay" style="position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 1000;">
			<div id="clockContainer" style="position: relative; width: 120px; height: 120px;">
				<img id="clockImage" src="/media/png/timer.png" alt="Orologio">
				<div id="clockText"></div>
			</div>
		</div>
		<div id="tableCardOverlay">
        	<span id="tableCardText">TABLE'S CARD</span>
        	<div id="tableCardContainer">
            	<img id="tableCardImage" src="/media/png/timer.png" alt="Table Card">
        	</div>
    	</div>
		<div id="centralText" class="central-text">CARDS SENT</div>
		<div id="verticalIcons">
			<div class="icon-container">
				<span class="icon-text">Claims <span class="number">5</span> <span class="card-name">Ace</span></span>
				<span class="doubt-text">DOUBT!</span> <!-- Nuovo elemento -->
				<img src="/media/png/porygon.png" alt="Icon 0" class="icon">
			</div>
			<div class="icon-container">
				<span class="icon-text">Claims <span class="number">3</span> <span class="card-name">Ace</span></span>
				<span class="doubt-text">DOUBT!</span> <!-- Nuovo elemento -->
				<img src="/media/png/mew.png" alt="Icon 1" class="icon">
			</div>
			<div class="icon-container">
				<span class="icon-text">Claims <span class="number">7</span> <span class="card-name">Ace</span></span>
				<span class="doubt-text">DOUBT!</span> <!-- Nuovo elemento -->
				<img src="/media/png/cubone.png" alt="Icon 2" class="icon">
			</div>
			<div class="icon-container">
				<span class="icon-text">Claims <span class="number">2</span> <span class="card-name">Ace</span></span>
				<span class="doubt-text">DOUBT!</span> <!-- Nuovo elemento -->
				<img src="/media/png/magikarp.png" alt="Icon 3" class="icon">
			</div>
		</div>
		<div class="card-container">
		<div class="your-turn-text">Your Turn!</div>
		<div class="row h-100">
					<div class="col-1"> </div>
					<div class="col-1">
						<div class="card" data-card-type="ACE">
							<img src="/media/png/pox.png" alt="ACE">
						</div>
					</div>
					<div class="col-1">
						<div class="card" data-card-type="QUEEN">
							<img src="/media/png/momo.png" alt="QUEEN">
						</div>
					</div>
					<div class="col-1">
						<div class="card" data-card-type="KING">
							<img src="/media/png/glim.png" alt="KING">
						</div>
					</div>
					<div class="col-1">

						<div class="card" data-card-type="JOLLY">
							<img src="/media/png/master.png" alt="JOLLY">
						</div>
					</div>

					<div class="col-1">

						<div class="card" data-card-type="JOLLY">
							<img src="/media/png/master.png" alt="JOLLY">
						</div>
					</div>
					<div class="col-6"> </div>
				</div>
			</div>
		</div>
	`,
	profile: `
		<div class="container-fluid game-container">
			<div class="row">
				<div class="col-5 nav-wrapper">
					<div class="profile-container">
						<div class="profile-image-container mb-4"><img src="" alt="Profile" class="profile-image" id="profilePageImage"></div>
						<div class="mb-2"><span class="pixel-font profile-name" id="profilePageName"></span></div>
						<div class="mb-2"><span class="pixel-font profile-level" id="profilePageLevel">LV. </span></div>
						<div class="exp-container mb-2"><div class="exp-bar" style="" id="profilePagePercent"></div></div>
						<div class="exp-text mb-4"><span class="pixel-font profile-level" id="currentExp"></span></div>
						<div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">RANK POINTS</span>
								<span class="pixel-font profile-value" id="profilePageMmr"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">WINS</span>
								<span class="pixel-font profile-win" id="profilePageWin"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">LOSSES</span>
								<span class="pixel-font profile-lose" id="profilePageLose"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">WIN STREAK</span>
								<span class="pixel-font profile-value" id="profilePageStreak"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">TOTAL POINTS</span>
								<span class="pixel-font profile-value" id="profilePagePoint"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">LONGEST GAME</span>
								<span class="pixel-font profile-value" id="profilePageLongestGame"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">TIME PLAYED</span>
								<span class="pixel-font profile-value" id="profilePageTime"></span>
							</div>
							<div class="stat-item d-flex justify-content-between">
								<span class="pixel-font profile-stat">MEMBER SINCE</span>
								<span class="pixel-font profile-value" id="profilePageCreated"></span>
							</div>
						</div>
					</div>
					<div class="d-flex flex-column">
						<div class="nav-link-left back" data-link="/"><span class="hundin-font back">BACK</span></div>
					</div>
				</div>

				<div class="col-7 nav-wrapper">
					<div class="match-history-container">
						<div class="mb-2">
							<span class="pixel-font match-history">MATCH HISTORY</span>
						</div>
						<div id="matchHistoryContent"></div>
					</div>
				</div>
			</div>
		</div>
	`,

	overlay: `
		<div class="chat-sidebar d-none"></div>
		<div class="friends-sidebar">
			<div class="friends-header pixel-font" style="text-align: right;">
				<span id="overlayUsername"></span>
				<span class="friend-status online" style="cursor: pointer;" id="userStatus">Online</span>
			</div>

			<div class="friends-search">
				<input type="text" placeholder="FIND SOMEONE..." class="search-input pixel-font">
			</div>

			<div class="friends-tabs pixel-font">
				<span class="tab online active">ONLINE</span>
				<span class="tab all">ALL</span>
				<span class="tab blocked">BLOCKED</span>
			</div>

			<div class="friends-list" id="onlineList"></div>
			<div class="friends-list d-none" id="allList"></div>
			<div class="friends-list d-none" id="blockedList"></div>
		</div>
		<div class="notification-sidebar">
			<div class="notification-header pixel-font" style="text-align: right;">
				<span>NOTIFICATIONS</span>
				<span class="notification-count" id="notificationCount">0</span>
			</div>

			<div class="notification-list" id="notifications">

			</div>
		</div>
	`,

	statusOverlay: `
		<div class="row h-100">
			<div class="col-3"></div>
			<div class="col-9 px-0">
				<nav class="nav-wrapper">
					<div class="d-flex flex-column">
						<div class="nav-link-right user-status" data-status="Online">
							<div style="display: flex; flex-direction: column;">
								<span class="hundin-font text-up user-status online">ONLINE</span>
								<span class="hundin-font text-down user-status">APPEAR AS USUAL</span>
							</div>
						</div>
						<div class="nav-link-right user-status" data-status="Away">
							<div style="display: flex; flex-direction: column;">
								<span class="hundin-font text-up user-status away">AWAY</span>
								<span class="hundin-font text-down user-status">APPEAR AWAY</span>
							</div>
						</div>
						<div class="nav-link-right user-status" data-status="Busy">
							<div style="display: flex; flex-direction: column;">
								<span class="hundin-font text-up user-status busy">BUSY</span>
								<span class="hundin-font text-down user-status">APPEAR BUSY</span>
							</div>
						</div>
					</div>
				</nav>
			</div>
		</div>
	`,

	pongSelection: `
		<div class="container-fluid game-container">
			<div class="row h-100">

				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<a class="nav-link-left back" data-link="/multiplayer">
								<span class="hundin-font back">BACK</span>
							</a>
						</div>
					</nav>
				</div>
				<div class="col-1"></div>


				<div class="col-9 px-0">
					<nav class="nav-wrapper">
						<input type="lobbyID" class="pfw-font lobbyID-input" placeholder="enter room id or url and hit enter..." id="lobbyID" name="lobbyID">

						<div class="d-flex flex-column">
							<a class="nav-link-right tournament" data-link="/tournament">
								<span class="pixel-font tournament">TMT</span>
								<div class="column-text">
									<span class="hundin-font tournament text-up">TOURNAMENT</span>
									<span class="hundin-font tournament text-down">BATTLE FOR THE TOP SPOT</span>
								</div>
							</a>
							<a class="nav-link-right ranked" data-link="/multiplayer/pong_ranked">
								<span class="pixel-font ranked">RNK</span>
								<div class="column-text">
									<span class="hundin-font ranked text-up">RANKED</span>
									<span class="hundin-font ranked text-down">CLIMB THE LEADERBOARD</span>
								</div>
							</a>
							<a class="nav-link-right lobby" data-link="/lobby">
								<span class="pixel-font lobby">LBY</span>
								<div class="column-text">
									<span class="hundin-font lobby text-up">LOBBY</span>
									<span class="hundin-font lobby text-down">GATHER BEFORE THE GAME</span>
								</div>
							</a>
						</div>
					</nav>
				</div>
			</div>
		</div>
	`,

	header: `
		<span class="px-4"><div id="header_text"></div></span>
		<div class="d-flex">
			<div class="header-button notification d-none" id="notificationBtn">
				👥/🔔
				<div id="notificationCounter" class="notification-badge">0</div>
			</div>

			<div class="header-button profile d-none" id="profileBtn" data-link="/profile">
				<div class="d-flex flex-column">
					<span class="hundin-font header-text-up" id="headerUsername"></span>
					<span class="hundin-font header-text-bottom" id="headerLevel">LV. </span>
				</div>
				<div class="header-profile-image-container mb-4"><img src="" alt="Profile" class="profile-image" id="headerProfileImage"></div>
			</div>
		</div>
	`,

	about: `
		<div class="container-fluid game-container">
			<div class="row h-100">
				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<a class="nav-link-left back" data-link="/">
								<span class="hundin-font back">BACK</span>
							</a>
						</div>
					</nav>
				</div>

				<div class="col-10 px-4">
					<div class="about-scroll-container">
						<div class="about-container p-4">
							<h1 class="title-text text-center mb-5">ABOUT TRANSCENDENCE</h1>

							<div class="mb-5">
								<h2 class="section-title">PROJECT OVERVIEW</h2>
								<p class="section-text">
									ft_transcendence enhances the classic Pong game with modern features and adds Liar's Bar, our original social deduction game.
									Built with Django backend, Bootstrap frontend, and PostgreSQL database, our platform offers rich multiplayer experiences with
									real-time gameplay, user authentication, and advanced 3D graphics.
								</p>
							</div>

							<div class="mb-5">
								<h2 class="section-title">OUR TEAM</h2>
								<div class="row g-4">
									<div class="col-md-4">
										<div class="team-card">
											<div class="member-photo franco">
											</div>
											<h3 class="member-name red">FURSINI</h3>
											<p class="team-realname">Franco Ursini</p>
											<p class="team-role">Frontend Development & UI/UX Design</p>
											<ul class="member-contributions">
												<li>Bootstrap Integration</li>
												<li>User Interface Design</li>
												<li>Frontend Architecture</li>
											</ul>
										</div>
									</div>

									<div class="col-md-4">
										<div class="team-card">
											<div class="member-photo edoardo">
											</div>
											<h3 class="member-name green">EVOCATUR</h3>
											<p class="team-realname">Edoardo Vocaturo</p>
											<p class="team-role">Backend Development</p>
											<ul class="member-contributions">
												<li>Django Framework</li>
												<li>Database Management</li>
												<li>Authentication Systems</li>
											</ul>
										</div>
									</div>

									<div class="col-md-4">
										<div class="team-card">
											<div class="member-photo francesco">
											</div>
											<h3 class="member-name blue">FBORROTO</h3>
											<p class="team-realname">Francesco Borroto</p>
											<p class="team-role">Game Logic & Systems</p>
											<ul class="member-contributions">
												<li>Game Mechanics</li>
												<li>AI Implementation</li>
												<li>3D Graphics</li>
											</ul>
										</div>
									</div>
								</div>
							</div>

							<div class="mb-5">
								<h2 class="section-title">FEATURES & GAMES</h2>
								<div class="row g-4">
									<div class="col-md-6">
										<div class="game-card">
											<h3 class="game-title white">PONG</h3>
											<p class="game-description">
												The classic arcade game reimagined with modern features, including 3D graphics,
												AI opponents, and real-time multiplayer capabilities.
											</p>
										</div>
									</div>
									<div class="col-md-6">
										<div class="game-card">
											<h3 class="game-title yellow">LIAR'S BAR</h3>
											<p class="game-description">
												Our original social deduction game where players navigate through deception and
												strategy in a unique bar setting. Features custom matchmaking and live chat.
											</p>
										</div>
									</div>
								</div>
							</div>

							<div class="mb-5">
								<h2 class="section-title">IMPLEMENTED MODULES</h2>
								<div class="row g-3">
									<div class="col-12">
										<div class="module-section">
											<h3 class="module-title">Major Modules</h3>
											<div class="module-grid">
												<div class="module-item">Django Backend Framework</div>
												<div class="module-item">User Management & Authentication</div>
												<div class="module-item">Remote Authentication (OAuth)</div>
												<div class="module-item">Remote Players System</div>
												<div class="module-item">Liar's Bar Integration</div>
												<div class="module-item">Live Chat System</div>
												<div class="module-item">AI Opponent</div>
												<div class="module-item">3D Graphics Implementation</div>
											</div>
										</div>
									</div>
									<div class="col-12">
										<div class="module-section">
											<h3 class="module-title">Minor Modules</h3>
											<div class="module-grid">
												<div class="module-item">Bootstrap Frontend</div>
												<div class="module-item">PostgreSQL Database</div>
												<div class="module-item">Server-Side Rendering</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div class="special-thanks">
								<h2 class="section-title">SPECIAL THANKS</h2>
								<div class="thanks-card">
									<div class="thanks-photo">
										<img src="" />
									</div>
									<div class="thanks-content">
										<h3 class="thanks-name">Michele Lania</h3>
										<p class="thanks-contribution">For his outstanding contribution to our project through the creation of amazing 3D models that enhanced our game's visual experience.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,

	friendsProfile: `
				<div class="container-fluid game-container">
			<div class="row">
				<div class="col-5 nav-wrapper">
					<div class="profile-container">
						<div class="profile-image-container mb-4"><img src="" alt="Profile" class="profile-image" id="profilePageImage"></div>
						<div class="mb-2"><span class="pixel-font profile-name" id="profilePageName"></span></div>
						<div class="mb-2"><span class="pixel-font profile-level" id="profilePageLevel">LV. </span></div>
						<div class="exp-container mb-2"><div class="exp-bar" style="" id="profilePagePercent"></div></div>
						<div class="exp-text mb-4"><span class="pixel-font profile-level" id="currentExp"></span></div>
						<div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">RANK POINTS</span>
								<span class="pixel-font profile-value" id="profilePageMmr"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">WINS</span>
								<span class="pixel-font profile-win" id="profilePageWin"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">LOSSES</span>
								<span class="pixel-font profile-lose" id="profilePageLose"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">WIN STREAK</span>
								<span class="pixel-font profile-value" id="profilePageStreak"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">TOTAL POINTS</span>
								<span class="pixel-font profile-value" id="profilePagePoint"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">LONGEST GAME</span>
								<span class="pixel-font profile-value" id="profilePageLongestGame"></span>
							</div>
							<div class="stat-item d-flex justify-content-between mb-2">
								<span class="pixel-font profile-stat">TIME PLAYED</span>
								<span class="pixel-font profile-value" id="profilePageTime"></span>
							</div>
							<div class="stat-item d-flex justify-content-between">
								<span class="pixel-font profile-stat">MEMBER SINCE</span>
								<span class="pixel-font profile-value" id="profilePageCreated"></span>
							</div>
						</div>
					</div>
					<div class="d-flex flex-column">
						<div class="nav-link-left back" data-link="/"><span class="hundin-font back">BACK</span></div>
					</div>
				</div>

				<div class="col-7 nav-wrapper">
					<div class="match-history-container">
						<div class="mb-2">
							<span class="pixel-font match-history">MATCH HISTORY</span>
						</div>
						<div id="matchHistoryContent"></div>
					</div>
				</div>
			</div>
		</div>
	`,

	config: `
		<div class="container-fluid game-container">
			<div class="row h-100">
				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<a class="nav-link-left back" data-link="/">
								<span class="hundin-font back">BACK</span>
							</a>
						</div>
					</nav>
				</div>

				<div class="col-10 px-4">
					<div class="config-scroll-container">
						<div class="config-container p-4">
							<h1 class="title-text mb-5">USER SETTINGS</h1>

							<div class="config-section mb-5">
								<h2 class="section-title">PROFILE IMAGE</h2>
								<div class="profile-image-section">
									<div class="current-image">
										<img src="" alt="Current Profile" id="currentProfileImage" />
									</div>
									<div class="image-controls">
										<label for="profileImageInput" class="custom-file-upload" id="fileUploadLabel">
											Choose New Image
										</label>
										<input type="file" id="profileImageInput" accept="image/*" class="d-none" />
										<button class="config-button" id="uploadImageBtn">Update Image</button>
									</div>
								</div>
							</div>

							<div class="config-section mb-5">
								<h2 class="section-title">USERNAME</h2>
								<div class="input-group">
									<input type="text" id="usernameInput" class="config-input" placeholder="Enter new username" />
									<button class="config-button" id="updateUsernameBtn">Update Username</button>
								</div>
							</div>

							<div class="config-section mb-5">
								<h2 class="section-title">PONG STYLE</h2>
								<div class="d-flex align-items-center">
									<div class="custom-toggle mr-3">
										<input type="checkbox" id="pongStyleToggle" class="toggle-checkbox">
										<label for="pongStyleToggle" class="toggle-label"></label>
									</div>
									<span class="ml-3 pong-style-text">Classic Mode</span>
									<span class="ml-3 pong-style-text-3d d-none">3D Mode</span>
								</div>
							</div>

							<div class="config-section mb-5">
								<h2 class="section-title">EMAIL</h2>
								<div class="input-group">
									<input type="email" id="emailInput" class="config-input" placeholder="Enter new email" />
									<button class="config-button" id="updateEmailBtn">Update Email</button>
								</div>
							</div>

							<div class="config-section">
								<h2 class="section-title">PASSWORD</h2>
								<div class="password-fields">
									<div class="mb-3">
										<input type="password" id="currentPassword" class="config-input" placeholder="Current password" />
									</div>
									<div class="mb-3">
										<input type="password" id="newPassword" class="config-input" placeholder="New password" />
									</div>
									<div class="mb-3">
										<input type="password" id="confirmPassword" class="config-input" placeholder="Confirm new password" />
									</div>
									<button class="config-button" id="updatePasswordBtn">Update Password</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,

	lobby: `
		<div class="container-fluid game-container">
			<div class="row h-100">

				<div class="col-12 px-0">
					<div class="lobby-container">
						<div class="lobby-header">
							<span class="pixel-font lobby-title">GAME LOBBY</span>
							<div class="lobby-code-container">
								<span class="pixel-font lobby-code-label">LOBBY CODE:</span>
								<span class="pixel-font lobby-code" id="lobbyCode"></span>
							</div>
						</div>

						<div class="lobby-content">
							<div class="players-container">
								<div class="player-slot">
									<div class="player-avatar">
										<img src="" alt="Player 1" id="player1Avatar">
									</div>
									<span class="pixel-font player-name" id="player1Name">WAITING...</span>
									<span class="pixel-font player-status host">HOST</span>
								</div>
								<div class="player-slot empty">
									<div class="player-avatar">
										<img src="" alt="Player 2" id="player2Avatar">
									</div>
									<span class="pixel-font player-name" id="player2Name">WAITING...</span>
									<span class="pixel-font player-status">GUEST</span>
								</div>
							</div>

							<div class="lobby-controls">
								<button class="start-button pixel-font" id="startGame" disabled>
									START GAME
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,

	lobbyGuest: `
		<div class="container-fluid game-container">
			<div class="row h-100">
				<div class="col-12 px-0">
					<div class="lobby-container">
						<div class="lobby-header">
							<span class="pixel-font lobby-title">GAME LOBBY</span>
						</div>

						<div class="lobby-content">
							<div class="players-container">
								<div class="player-slot">
									<div class="player-avatar">
										<img src="" alt="Player 1" id="player1Avatar">
									</div>
									<span class="pixel-font player-name" id="player1Name">WAITING...</span>
									<span class="pixel-font player-status host">HOST</span>
								</div>
								<div class="player-slot empty">
									<div class="player-avatar">
										<img src="" alt="Player 2" id="player2Avatar">
									</div>
									<span class="pixel-font player-name" id="player2Name">WAITING...</span>
									<span class="pixel-font player-status">GUEST</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,

	matchResult: `
		<div class="container-fluid game-container">
			<div class="row h-100">
				<div class="col-2 px-0">
					<nav class="nav-wrapper">
						<div class="d-flex flex-column">
							<div class="nav-link-left back" data-link="/">
								<span class="hundin-font back">BACK</span>
							</div>
						</div>
					</nav>
				</div>

				<div class="col-10 d-flex align-items-center justify-content-center">
					<div class="match-result-container">
						<div class="title">
							<span class="pixel-font result-title">MATCH RESULT</span>
						</div>

						<div class="match-players">
							<div class="player-section">
								<div class="profile-image-container mb-4">
									<div class="profile-image">
										<img src="" alt="Player 1" id="player1Avatar" />
									</div>
								</div>
								<div class="player-left">
									<span class="pixel-font player-name" id="player1Name">Player 1</span>
								<div class="stat-line">
									<span class="pixel-font stat-label">SCORE: </span>
									<span class="pixel-font stat-value" id="player1Score">0</span>
								</div>
								<div class="stat-line">
									<span class="pixel-font stat-label">RP: </span>
									<span class="pixel-font stat-value" id="player1MMR">0</span>
								</div>
							</div>
							<span class="pixel-font vs">VS</span>
							<div class="player-right">
								<span class="pixel-font player-name" id="player2Name">Player 2</span>
								<div class="stat-line">
									<span class="pixel-font stat-label">SCORE: </span>
									<span class="pixel-font stat-value" id="player2Score">0</span>
								</div>
								<div class="stat-line">
									<span class="pixel-font stat-label">RP: </span>
									<span class="pixel-font stat-value" id="player2MMR">0</span>
								</div>
							</div>
							<div class="profile-image-container mb-4">
								<div class="profile-image">
									<img src="" alt="Player 2" id="player2Avatar" />
								</div>
							</div>
						</div>
					</div>

					<div class="winner-section">
						<span class="pixel-font winner-label">WINNER</span>
						<span class="pixel-font winner-name" id="winnerName">Player 1</span>
					</div>

					<div class="match-details">
						<div class="detail-item">
							<span class="pixel-font detail-label">DURATION</span>
							<span class="pixel-font detail-value" id="matchDuration">0 min 0 sec</span>
						</div>
						<div class="detail-item">
							<span class="pixel-font detail-label">START</span>
							<span class="pixel-font detail-value" id="matchStart">--</span>
						</div>
						<div class="detail-item">
							<span class="pixel-font detail-label">END</span>
							<span class="pixel-font detail-value" id="matchEnd">--</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,

	tournamentResult: `
		<div class="container-fluid game-container">
			<div class="row h-100">
				<div class="col-2 px-0">
				<nav class="nav-wrapper">
					<div class="d-flex flex-column">
					<div class="nav-link-left back" data-link="/">
						<span class="hundin-font back">BACK</span>
					</div>
					</div>
				</nav>
				</div>

				<div class="col-10 d-flex align-items-center justify-content-center">
				<div class="tournament-result-container">
					<div class="title">
					<span class="pixel-font tournament-result-title">TOURNAMENT RESULTS</span>
					</div>

					<!-- Winner Section -->
					<div class="winner-section">
					<div class="trophy-icon">
						<img src="/media/img/trophy.png" alt="Trophy" id="trophyIcon" />
					</div>
					<div class="winner-content">
						<div class="winner-avatar">
						<img src="" alt="Winner" id="winnerAvatar" />
						</div>
						<div class="winner-info">
						<span class="pixel-font winner-name" id="winnerName">Player 1</span>
						<div class="winner-label">
							<span class="pixel-font winner-text">WINNER</span>
						</div>
						</div>
					</div>
					</div>

					<!-- Losers Section -->
					<div class="losers-section">
					<div class="losers-header">
						<span class="pixel-font losers-title">OTHER PARTICIPANTS</span>
					</div>
					<div class="losers-list">
						<div class="loser-card">
						<div class="loser-avatar">
							<img src="" alt="Loser 1" id="loser1Avatar" />
						</div>
						<span class="loser-name" id="loser1Name">Player 2</span>
						<span class="loser-status">LOSER</span>
						</div>

						<div class="loser-card">
						<div class="loser-avatar">
							<img src="" alt="Loser 2" id="loser2Avatar" />
						</div>
						<span class="loser-name" id="loser2Name">Player 3</span>
						<span class="loser-status">LOSER</span>
						</div>

						<div class="loser-card">
						<div class="loser-avatar">
							<img src="" alt="Loser 3" id="loser3Avatar" />
						</div>
						<span class="loser-name" id="loser3Name">Player 4</span>
						<span class="loser-status">LOSER</span>
						</div>
					</div>
					</div>
				</div>
				</div>
			</div>
		</div>
	`,

	liarsbarResult: `
		<div class="container-fluid game-container">
			<div class="row h-100">
				<div class="col-2 px-0">
				<nav class="nav-wrapper">
					<div class="d-flex flex-column">
					<div class="nav-link-left back" data-link="/">
						<span class="hundin-font back">BACK</span>
					</div>
					</div>
				</nav>
				</div>

				<div class="col-10 d-flex align-items-center justify-content-center">
				<div class="liarsbar-result-container">
					<div class="title">
					<span class="pixel-font liarsbar-result-title">LIAR'S BAR RESULTS</span>
					</div>

					<!-- Winner Section -->
					<div class="liarsbar-winner-section">
					<div class="crown-icon">
						<img src="/media/png/master.png" alt="Crown" id="crownIcon" />
					</div>
					<div class="liarsbar-winner-content">
						<div class="liarsbar-winner-avatar">
						<img src="" alt="Winner" id="liarsbarWinnerAvatar" />
						</div>
						<div class="liarsbar-winner-info">
						<span class="pixel-font liarsbar-winner-name" id="liarsbarWinnerName">Player 1</span>
						<div class="liarsbar-winner-label">
							<span class="pixel-font liarsbar-winner-text">TRUTH BEARER</span>
						</div>
						</div>
					</div>
					</div>

					<!-- Losers Section -->
					<div class="liarsbar-losers-section">
					<div class="liarsbar-losers-header">
						<span class="pixel-font liarsbar-losers-title">THE DECEIVED</span>
					</div>
					<div class="liarsbar-losers-list">
						<div class="liarsbar-loser-card">
						<div class="liarsbar-loser-avatar">
							<img src="" alt="Loser 1" id="liarsbarLoser1Avatar" />
						</div>
						<span class="liarsbar-loser-name" id="liarsbarLoser1Name">Player 2</span>
						<span class="liarsbar-loser-status">DECEIVED</span>
						</div>

						<div class="liarsbar-loser-card">
						<div class="liarsbar-loser-avatar">
							<img src="" alt="Loser 2" id="liarsbarLoser2Avatar" />
						</div>
						<span class="liarsbar-loser-name" id="liarsbarLoser2Name">Player 3</span>
						<span class="liarsbar-loser-status">DECEIVED</span>
						</div>

						<div class="liarsbar-loser-card">
						<div class="liarsbar-loser-avatar">
							<img src="" alt="Loser 3" id="liarsbarLoser3Avatar" />
						</div>
						<span class="liarsbar-loser-name" id="liarsbarLoser3Name">Player 4</span>
						<span class="liarsbar-loser-status">DECEIVED</span>
						</div>
					</div>
					</div>
				</div>
				</div>
			</div>
			</div>
	`,

	tournament: `
		<div class="container-fluid game-container">
		<div class="row h-100">
			<div class="col-12 px-0">
			<div class="nav-wrapper">
			<div class="tournament-container">
				<div class="tournament-header">
				<span class="pixel-font tournament-title">TOURNAMENT LOBBY</span>
				</div>

				<div class="tournament-content">
				<!-- Matchups Display -->
				<div class="matchups-display">
					<span class="pixel-font matchup-title">TOURNAMENT MATCHUPS</span>

					<div class="matchup-container">
					<!-- First Matchup -->
					<div class="matchup">
						<div class="matchup-vs">
						<span class="pixel-font vs-text">VS</span>
						</div>
						<div class="matchup-players">
						<div class="matchup-player">
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 1" id="player1Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player1Name">WAITING...</span>
								<span class="pixel-font player-status host">HOST</span>
							</div>
							</div>
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 2" id="player2Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player2Name">WAITING...</span>
								<span class="pixel-font player-status">PLAYER</span>
							</div>
							</div>
						</div>
						</div>
					</div>

					<!-- Second Matchup -->
					<div class="matchup">
						<div class="matchup-vs">
						<span class="pixel-font vs-text">VS</span>
						</div>
						<div class="matchup-players">
						<div class="matchup-player">
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 3" id="player1Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player3Name">WAITING...</span>
								<span class="pixel-font player-status">PLAYER</span>
							</div>
							</div>
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 4" id="player2Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player4Name">WAITING...</span>
								<span class="pixel-font player-status">PLAYER</span>
							</div>
							</div>
						</div>
						</div>
					</div>
					</div>
				</div>
				</div>
				<div class="tournament-controls">
				<button class="start-button pixel-font" id="startTournament" disabled>
					START TOURNAMENT
				</button>
				</div>
			</div>
			</div>
			</div>
		</div>
		</div>
	`,

	tournamentGuest: `
				<div class="container-fluid game-container">
		<div class="row h-100">
			<div class="col-12 px-0">
			<div class="nav-wrapper">
			<div class="tournament-container">
				<div class="tournament-header">
				<span class="pixel-font tournament-title">TOURNAMENT LOBBY</span>
				</div>

				<div class="tournament-content">
				<!-- Matchups Display -->
				<div class="matchups-display">
					<span class="pixel-font matchup-title">TOURNAMENT MATCHUPS</span>

					<div class="matchup-container">
					<!-- First Matchup -->
					<div class="matchup">
						<div class="matchup-vs">
						<span class="pixel-font vs-text">VS</span>
						</div>
						<div class="matchup-players">
						<div class="matchup-player">
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 1" id="player1Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player1Name">WAITING...</span>
								<span class="pixel-font player-status host">HOST</span>
							</div>
							</div>
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 2" id="player2Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player2Name">WAITING...</span>
								<span class="pixel-font player-status">PLAYER</span>
							</div>
							</div>
						</div>
						</div>
					</div>

					<!-- Second Matchup -->
					<div class="matchup">
						<div class="matchup-vs">
						<span class="pixel-font vs-text">VS</span>
						</div>
						<div class="matchup-players">
						<div class="matchup-player">
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 3" id="player1Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player3Name">WAITING...</span>
								<span class="pixel-font player-status">PLAYER</span>
							</div>
							</div>
							<div class="player-slot semifinal">
							<div class="player-avatar">
								<img src="" alt="Player 4" id="player2Avatar">
							</div>
							<div class="player-info">
								<span class="pixel-font player-name" id="player4Name">WAITING...</span>
								<span class="pixel-font player-status">PLAYER</span>
							</div>
							</div>
						</div>
						</div>
					</div>
					</div>
				</div>
				</div>
			</div>
			</div>
			</div>
		</div>
		</div>
	`,

	pongJs:
	`
		<!-- Center content using Bootstrap container and flex utilities -->
		<div class="container vh-100 d-flex flex-column justify-content-center align-items-center">
			<h1 class="text-white mb-4">Pong Game</h1>
			<canvas id="gameCanvas" width="800" height="600"></canvas>
		</div>
	`
};


export default html;