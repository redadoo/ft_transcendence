# Generated by Django 5.1.1 on 2024-11-30 17:40

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0003_matchhistory'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserStats',
            fields=[
                ('customUser', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='user_stat', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('exp', models.IntegerField(default=0)),
                ('mmr', models.IntegerField(default=1000)),
                ('win', models.IntegerField(default=0)),
                ('lose', models.IntegerField(default=0)),
                ('longest_winstreak', models.IntegerField(default=0)),
                ('longest_losestreak', models.IntegerField(default=0)),
                ('total_points_scored', models.IntegerField(default=0)),
                ('longest_game', models.IntegerField(default=0)),
                ('time_on_site', models.IntegerField(default=0)),
                ('date_updated', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'User Stat',
                'verbose_name_plural': 'User Stats',
            },
        ),
    ]
