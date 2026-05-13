from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()

class Command(BaseCommand):
    help = 'Ensure admin user exists for production'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Admin username'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@kilicare.com',
            help='Admin email'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Admin password'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        try:
            user = User.objects.get(username=username)
            self.stdout.write(
                self.style.SUCCESS(f'Admin user "{username}" already exists')
            )
            if not user.is_staff:
                user.is_staff = True
                user.is_superuser = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated "{username}" to superuser')
                )
        except ObjectDoesNotExist:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user "{username}"')
            )

        self.stdout.write(
            self.style.WARNING('Admin user setup complete')
        )
