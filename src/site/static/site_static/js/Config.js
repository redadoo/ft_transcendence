import api from './api.js';

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
				formData.append('avatar', fileInput.files[0]);
				// TODO: Implement API call
				// await api.updateProfileImage(formData);
				alert('Image upload functionality will be implemented');
			} catch (error) {
				console.error('Error uploading image:', error);
				alert('Error uploading image');
			}
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
				await api.updateUsername(newUsername);
				alert('Username updated successfully');
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
				// TODO: Implement API call
				// await api.updateEmail(newEmail);
				alert('Email update functionality will be implemented');
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
				// TODO: Implement API call
				// await api.updatePassword(currentPassword, newPassword);
				alert('Password update functionality will be implemented');
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
