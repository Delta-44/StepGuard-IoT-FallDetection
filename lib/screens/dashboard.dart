import 'dart:async';
import 'dart:io'; // Para detectar el sistema operativo
import 'package:flutter/material.dart';
import '../models/device_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/device_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<int, Device> devices = {};
  String connectionStatus = "Iniciando...";
  Timer? pollingTimer;

  @override
  void initState() {
    super.initState();
    _initApp();
  }

  Future<void> _initApp() async {
    setState(() => connectionStatus = "Autenticando...");
    bool loginOk = await AuthService.login();
    
    if (loginOk) {
      await _refreshData();
      // Polling cada 1 segundo
      pollingTimer = Timer.periodic(const Duration(seconds: 1), (_) => _refreshData());
    } else {
      setState(() => connectionStatus = "Error de Login");
    }
  }

Future<void> _refreshData() async {
  if (!mounted) return;

  final espStatuses = await ApiService.fetchEspStatuses();

  setState(() {
    connectionStatus =
        "Actualizado: ${DateTime.now().hour}:${DateTime.now().minute}:${DateTime.now().second}";

    for (var esp in espStatuses) {
      int id = esp['id'] ?? 0;
      String mac = esp['mac_address'];
      String nombre = esp['assigneduser'] ?? esp['nombre'];
      bool online = esp['estado'] == true;

      devices[id] = Device(
        id: id,
        mac: mac,
        alias: nombre,
        status: online ? "online" : "offline",
        lastSeen: DateTime.now(),
      );
    }
  });
}


  @override
  Widget build(BuildContext context) {
    // LÓGICA DE DISEÑO: Si es Windows 5 columnas, si es móvil 2.
    int columnas = Platform.isWindows ? 5 : 2;
    double padding = Platform.isWindows ? 10.0 : 16.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text("StepGuard Admin Panel"),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20),
          child: Text(connectionStatus, style: const TextStyle(color: Colors.blue, fontSize: 11)),
        ),
      ),
      body: devices.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : GridView.builder(
              padding: EdgeInsets.all(padding),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columnas, // Dinámico: 5 o 2
                crossAxisSpacing: padding,
                mainAxisSpacing: padding,
                childAspectRatio: 1.0, // Cuadrados perfectos
              ),
              itemCount: devices.length,
              itemBuilder: (ctx, i) {
                final id = devices.keys.elementAt(i);
                return DeviceCard(
                  device: devices[id]!,
                  onTap: () {}, // Desactivamos rename para el panel admin si quieres
                );
              },
            ),
    );
  }

  @override
  void dispose() {
    pollingTimer?.cancel();
    super.dispose();
  }
}