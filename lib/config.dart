import 'package:flutter_dotenv/flutter_dotenv.dart';

class Config {
  // Configuración de la API (HTTP)
  // El primer parámetro es el nombre exacto que pusiste en el archivo .env
  static String get baseUrl => dotenv.get('API_BASE_URL', fallback: 'http://localhost:3000/api');

  // Credenciales de Admin para el Login
  static String get adminEmail => dotenv.get('ADMIN_EMAIL', fallback: '');
  static String get adminPassword => dotenv.get('ADMIN_PASSWORD', fallback: '');

  // Configuración MQTT
  static String get mqttServer => dotenv.get('MQTT_SERVER', fallback: '');
  static int get mqttPort => int.parse(dotenv.get('MQTT_PORT', fallback: '8883'));
  static String get mqttUser => dotenv.get('MQTT_USER', fallback: '');
  static String get mqttPass => dotenv.get('MQTT_PASS', fallback: '');
}