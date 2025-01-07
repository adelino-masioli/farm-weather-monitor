from flask import Blueprint, jsonify, request
from backend.src.services.settings_service import SettingsService

class SettingsController:
    def __init__(self, settings_service: SettingsService):
        self.settings_service = settings_service
        self.bp = Blueprint('settings', __name__, url_prefix='/api')
        self._register_routes()

    def _register_routes(self):
        self.bp.route('/settings', methods=['GET'])(self.get_settings)
        self.bp.route('/settings', methods=['POST'])(self.update_settings)

    def get_settings(self):
        """Get current settings"""
        settings, error = self.settings_service.get_settings()
        if error:
            return jsonify({'error': error}), 500
        return jsonify(settings.to_dict())

    def update_settings(self):
        """Update settings with new values"""
        settings_data = request.json
        if not settings_data:
            return jsonify({'error': 'No settings data provided'}), 400

        new_settings, error = self.settings_service.update_settings(settings_data)
        if error:
            # Return 400 for validation errors, 500 for server errors
            status_code = 400 if "must be" in error else 500
            return jsonify({'error': error}), status_code

        return jsonify(new_settings)  # Removida a chamada a to_dict()
    
    