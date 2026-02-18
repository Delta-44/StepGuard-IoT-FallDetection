import 'package:flutter_dotenv/flutter_dotenv.dart';

class Config {
  static String get baseUrl => dotenv.get('API_BASE_URL', fallback: 'http://localhost:3000/api');
  static String get server => dotenv.get('MQTT_SERVER', fallback: '');
  
  // Nuevos campos para el login automático
  static String get adminEmail => dotenv.get('ADMIN_EMAIL', fallback: '');
  static String get adminPassword => dotenv.get('ADMIN_PASSWORD', fallback: '');
}