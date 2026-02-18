import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class AuthService {
  static String? _token;

  // Getter para obtener el token desde otros servicios
  static String? get token => _token;

  static Future<bool> login() async {
    try {
      print(">>> [AUTH] Intentando login para: angelgonzalez@gmail.com");

      final response = await http.post(
        Uri.parse("${Config.baseUrl}/auth/login"),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          "email": Config.adminEmail, // <--- Cambiado
          "password": Config.adminPassword, // <--- Cambiado
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['token']; // Guardamos el token en memoria
        print(">>> [AUTH] Login exitoso. Token guardado.");
        return true;
      } else {
        print(">>> [AUTH] Error en login: ${response.statusCode}");
        return false;
      }
    } catch (e) {
      print(">>> [AUTH] Excepción: $e");
      return false;
    }
  }
}
