import api from './api.js';
import router from './router.js';

const setupConfigEventListeners = async () => {
	const fileInput = document.getElementById('profileImageInput');
	const fileLabel = document.getElementById('fileUploadLabel');

	if (fileInput && fileLabel) {
		fileLabel.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
		});

		fileInput.addEventListener('change', function(event) {
			event.stopPropagation();
			if (this.files && this.files[0]) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const profileImage = document.getElementById('currentProfileImage');
					if (profileImage) {
						profileImage.src = e.target.result;
					}
				};
				reader.readAsDataURL(this.files[0]);
			}
		});
	}

	const uploadBtn = document.getElementById('uploadImageBtn');
	if (uploadBtn) {
		uploadBtn.addEventListener('click', async () => {
			const fileInput = document.getElementById('profileImageInput');
			if (!fileInput.files.length) {
				alert('Please select an image first');
				return;
			}
			try {
				const formData = new FormData();
				formData.append('user_avatar', fileInput.files[0]);
				await api.updateProfileImage(formData).then((response) => {
					console.log('Image upload response:', response);
					if (response == false) {
						alert('Error uploading image');
					}
					else {
						alert('Image uploaded successfully');
					}
				});
			} catch (error) {
				console.error('Error uploading image:', error);
				alert('Error uploading image');
			}
		});
	}

	const changePongStyleBtn = document.getElementById('changePongStyleBtn');
	if (changePongStyleBtn) 
	{
		changePongStyleBtn.addEventListener('click', () => {
			router.is2dPong = !router.is2dPong; 
		});
	}

	const usernameBtn = document.getElementById('updateUsernameBtn');
	if (usernameBtn) {
		usernameBtn.addEventListener('click', async () => {
			const newUsername = document.getElementById('usernameInput')?.value;
			if (!newUsername) {
				alert('Please enter a new username');
				return;
			}
			try {
				const response = await api.updateUsername(newUsername);

				if (response.error) {
					alert(response.error.username[0]);
				} else if (response.message) {
					alert(response.message);
				} else {
					alert('Error updating username');
				}
			} catch (error) {
					console.error('Error updating username:', error);
					alert('Error updating username');
			}
		});
	}

	const emailBtn = document.getElementById('updateEmailBtn');
	if (emailBtn) {
		emailBtn.addEventListener('click', async () => {
			const newEmail = document.getElementById('emailInput')?.value;
			if (!newEmail) {
				alert('Please enter a new email');
				return;
			}

			try {
				const response = await api.updateEmail(newEmail);

				if (response.error) {
					alert(response.error.email[0]);
				} else if (response.message) {
					alert(response.message);
				} else {
					alert('Error updating email');
				}
			} catch (error) {
				console.error('Error updating email:', error);
				alert('Error updating email');
			}
		});
	}

	const passwordBtn = document.getElementById('updatePasswordBtn');
	if (passwordBtn) {
		passwordBtn.addEventListener('click', async () => {
			const currentPassword = document.getElementById('currentPassword')?.value;
			const newPassword = document.getElementById('newPassword')?.value;
			const confirmPassword = document.getElementById('confirmPassword')?.value;

			if (!currentPassword || !newPassword || !confirmPassword) {
				alert('Please fill in all password fields');
				return;
			}

			if (newPassword !== confirmPassword) {
				alert('New passwords do not match');
				return;
			}

			if (newPassword.length < 8) {
				alert('New password must be at least 8 characters long');
				return;
			}

			try {
				const response = await api.updatePassword(currentPassword, newPassword);
				console.log('Password update response:', response);

				if (response.error) {
					alert(response.error);
					return;
				} else if (response.message) {
					alert(response.message);
				} else {
					alert('Error updating password');
					return;
				}

				document.getElementById('currentPassword').value = '';
				document.getElementById('newPassword').value = '';
				document.getElementById('confirmPassword').value = '';



			} catch (error) {
				console.error('Error updating password:', error);
				alert('Error updating password');
			}
		});
	}

	const customFileUpload = document.querySelector('.custom-file-upload');
	if (customFileUpload) {
		customFileUpload.addEventListener('click', () => {
			document.getElementById('profileImageInput')?.click();
		});
	}

		try {
			const userData = await api.getProfileInfo();
			if (userData) {
				const profileImage = document.getElementById('currentProfileImage');
				const usernameInput = document.getElementById('usernameInput');
				const emailInput = document.getElementById('emailInput');

				if (profileImage) profileImage.src = userData.image_url.avatar_url;
				if (usernameInput) usernameInput.placeholder = userData.username;
				if (emailInput) emailInput.placeholder = userData.email;
			}
		} catch (error) {
			console.error('Error fetching user data:', error);
		}
	};

export default setupConfigEventListeners;
