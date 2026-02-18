import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/device_model.dart';

class StorageService {
  static const String _key = 'stored_devices';

  static Future<void> saveDevices(List<Device> devices) async {
    final prefs = await SharedPreferences.getInstance();
    final String data = json.encode(devices.map((d) => d.toJson()).toList());
    await prefs.setString(_key, data);
  }

  static Future<List<Device>> loadDevices() async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString(_key);
    if (data == null) return [];
    final List<dynamic> decoded = json.decode(data);
    return decoded.map((item) => Device.fromJson(item)).toList();
  }
}