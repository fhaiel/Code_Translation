import os
import sys
import threading

from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        should_preload = os.environ.get("KABUL_PRELOAD_MODEL", "true").lower() == "true"
        is_runserver_reloader_parent = "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true"
        is_management_command = sys.argv[0].endswith("manage.py") and len(sys.argv) > 1 and sys.argv[1] != "runserver"

        if not should_preload or is_runserver_reloader_parent or is_management_command:
            return

        def preload_translation_model():
            from .views import get_translation_model

            try:
                print("Preloading translation model...", flush=True)
                get_translation_model()
                print("Translation model ready.", flush=True)
            except Exception as exc:
                print(f"Translation model preload failed: {exc}", flush=True)

        threading.Timer(5.0, preload_translation_model).start()
