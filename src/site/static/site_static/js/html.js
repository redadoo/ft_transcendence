const html = {
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
									<span class="hundin-font multiplayer text-down">PLAY WITH FRIENDS AND FOES</span>
								</div>
							</div>
							<div class="nav-link-right singleplayer" data-link="/singleplayer">
								<span class="pixel-font singleplayer">SP </span>
								<div class="column-text">
									<span class="hundin-font singleplayer text-up">SINGLEPLAYER</span>
									<span class="hundin-font singleplayer text-down">DA CAPIRE</span>
								</div>
							</div>
							<div class="nav-link-right leaderboard" data-link="/leaderboard">
								<span class="pixel-font leaderboard">LDB</span>
								<div class="column-text">
									<span class="hundin-font leaderboard text-up">LEADERBOARD</span>
									<span class="hundin-font leaderboard text-down">DA CAPIRE ZIO PERA</span>
								</div>
							</div>
							<div class="nav-link-right config" data-link="/config">
								<span class="pixel-font config">CFG</span>
								<div class="column-text">
									<span class="hundin-font config text-up">CONFIG</span>
									<span class="hundin-font config text-down">DA CAPIRE QUESTION MARK</span>
								</div>
							</div>
							<div class="nav-link-right about" data-link="/about">
								<span class="pixel-font about">ABT</span>
								<div class="column-text">
									<span class="hundin-font about text-up">ABOUT</span>
									<span class="hundin-font about text-down">ALL ABOUT TRANSCENDENCE</span>
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

	singleplayer: `
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
					<div class="game-card pong" data-link="/singleplayer/pong">
					<div class="game-box">
						<div class="game-content">
						<h2 class="pixel-font">PONG</h2>
						<p class="hundin-font">THE CLASSIC GAME</p>
						</div>
					</div>
					</div>
				</div>

				<div class="col-5 p-4">
					<div class="game-card game2" data-link="">
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
		<div id="testId" class="container-fluid game-container">
			<div class="row h-100">
				<div class="col d-flex justify-content-center align-items-center">
					<button id="startMatchmaking" class="btn btn-primary btn-lg">
						Start Matchmaking
					</button>
				</div>
			</div>
		</div>
	`,

	liarsbar: `
	<div> </div>
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
		<div class="friends-sidebar">
			<div class="friends-header pixel-font" style="text-align: right;">
				<span id="overlayUsername"></span>
				<span class="friend-status online">Online</span>
			</div>

			<div class="friends-search">
				<input type="text" placeholder="FIND SOMEONE..." class="search-input pixel-font">
			</div>

			<div class="friends-tabs pixel-font">
				<span class="tab online active">ONLINE</span>
				<span class="tab all">ALL</span>
				<span class="tab other">OTHER</span>
				<span class="tab blocked">BLOCKED</span>
			</div>

			<div class="friends-list" id="online-list"></div>
			<div class="friends-list d-none" id="all-list"></div>
			<div class="friends-list d-none" id="other-list"></div>
			<div class="friends-list d-none" id="blocked-list"></div>
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
							<a class="nav-link-right tournament" data-link="/">
								<span class="pixel-font tournament">TMT</span>
								<div class="column-text">
									<span class="hundin-font tournament text-up">TOURNAMENT</span>
									<span class="hundin-font tournament text-down">KINGDOM HEARTS PROPAGANDA</span>
								</div>
							</a>
							<a class="nav-link-right ranked" data-link="/multiplayer/pong_ranked">
								<span class="pixel-font ranked">RNK</span>
								<div class="column-text">
									<span class="hundin-font ranked text-up">RANKED</span>
									<span class="hundin-font ranked text-down">KINGDOM HEARTS PROPAGANDA</span>
								</div>
							</a>
							<a class="nav-link-right unranked" data-link="/multiplayer/pong_unranked">
								<span class="pixel-font unranked">UNK</span>
								<div class="column-text">
									<span class="hundin-font unranked text-up">UNRANKED</span>
									<span class="hundin-font unranked text-down">KINGDOM HEARTS PROPAGANDA</span>
								</div>
							</a>
							<a class="nav-link-right lobby" data-link="/">
								<span class="pixel-font lobby">LBY</span>
								<div class="column-text">
									<span class="hundin-font lobby text-up">LOBBY</span>
									<span class="hundin-font lobby text-down">KINGDOM HEARTS PROPAGANDA</span>
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
			<div class="header-button notification d-none" id="notificationBtn"></div>

			<div class="header-button profile d-none" id="profileBtn" data-link="/profile">
				<div class="d-flex flex-column">
					<span class="hundin-font header-text-up" id="headerUsername"></span>
					<span class="hundin-font header-text-bottom" id="headerLevel">LV. </span>
				</div>
				<div class="header-profile-image-container mb-4"><img src="" alt="Profile" class="profile-image" id="headerProfileImage"></div>
			</div>
		</div>
	`,
};
