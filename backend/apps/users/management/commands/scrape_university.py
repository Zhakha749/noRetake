"""
Placeholder scraper for kbtu.kz teacher/subject data.
Future: use BeautifulSoup4 for static HTML or Playwright for dynamic pages.
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Scrape teacher and subject data from kbtu.kz (placeholder)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING(
            'scrape_university is a placeholder. '
            'Implement with BeautifulSoup4 or Playwright to scrape kbtu.kz.'
        ))
