from django import forms
from website.models import User
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm, UserChangeForm as BaseUserChangeForm

class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")

class UserChangeForm(BaseUserChangeForm):
    class Meta:
        model = User
        fields = ("username", "email")

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)
