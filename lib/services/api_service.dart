import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/device_model.dart';
import 'auth_service.dart';

class ApiService {
  // 1. Obtener la lista de usuarios (como antes)
  static Future<List<Device>> fetchUsers() async {
    try {
      final response = await http.get(
        Uri.parse("${Config.baseUrl}/users"),
        headers: {'Authorization': 'Bearer ${AuthService.token}'},
      );
      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data.map((u) => Device(
          id: u['id'],
          mac: u['dispositivo_mac'] ?? "Sin MAC",
          alias: u['nombre'] ?? "Usuario",
          status: "offline",
          lastSeen: DateTime.now(),
        )).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // 2. NUEVA FUNCIÓN: Obtener estados de los dispositivos
  static Future<List<dynamic>> fetchEspStatuses() async {
    try {
      final response = await http.get(
        Uri.parse("${Config.baseUrl}/esp32/all"),
        headers: {'Authorization': 'Bearer ${AuthService.token}'},
      );
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print("Error cargando estados: $e");
    }
    return [];
  }
}