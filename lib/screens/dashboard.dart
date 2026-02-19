import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';
import '../models/device_model.dart';
import '../widgets/device_card.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<int, Device> devices = {};
  String connectionStatus = "Conectando a MQTT...";
  MqttServerClient? client;
  
  // 1. VARIABLE PARA EL TIMER
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _initMqtt();

    // 2. INICIAR EL REFRESCO CADA 5 SEGUNDOS
    _refreshTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _autoRefreshStatus();
    });
  }

  // 3. FUNCIÓN QUE SE EJECUTA CADA 5 SEGUNDOS
  void _autoRefreshStatus() {
    if (!mounted) return;
    
    setState(() {
      // Esta lógica marca como offline a los que llevan más de 20 segundos sin hablar
      devices.forEach((id, device) {
        final segundosCallado = DateTime.now().difference(device.lastSeen).inSeconds;
        if (segundosCallado > 2) {
          device.status = "offline";
        }
      });
    });
    print(">>> [APP] Refresco automático de 5 seg realizado");
  }

  Future<void> _initMqtt() async {
    final String server = dotenv.get('MQTT_SERVER').trim();
    final int port = int.parse(dotenv.get('MQTT_PORT').trim());
    final String user = dotenv.get('MQTT_USER').trim();
    final String pass = dotenv.get('MQTT_PASS').trim();
    final String clientId = 'stepguard_admin_${DateTime.now().millisecondsSinceEpoch}';

    client = MqttServerClient.withPort(server, clientId, port);
    client!.secure = true;
    client!.onBadCertificate = (dynamic cert) => true;
    client!.logging(on: false); 
    client!.keepAlivePeriod = 20;

    final connMessage = MqttConnectMessage()
        .withClientIdentifier(clientId)
        .withProtocolName('MQTT')
        .withProtocolVersion(4)
        .startClean();

    client!.connectionMessage = connMessage;

    try {
      print('>>> [MQTT] Intentando conectar...');
      setState(() => connectionStatus = "Conectando...");

      await client!.connect(user, pass);

      if (client!.connectionStatus!.state == MqttConnectionState.connected) {
        print('>>> [MQTT] ¡CONECTADO EXITOSAMENTE!');
        setState(() => connectionStatus = "Online");

        client!.subscribe("stepguard/#", MqttQos.atLeastOnce);

        client!.updates!.listen((List<MqttReceivedMessage<MqttMessage>> c) {
          final MqttPublishMessage recMess = c[0].payload as MqttPublishMessage;
          final String payload = MqttPublishPayload.bytesToStringAsString(recMess.payload.message);
          final String topic = c[0].topic;

          print(">>> [MQTT] Recibido: $payload en tema: $topic");
          _processDeviceMessage(topic, payload);
        });
      }
    } catch (e) {
      print('>>> [MQTT] Error: $e');
      client!.disconnect();
      if (mounted) setState(() => connectionStatus = "Error de conexión");
    }
  }

  void _processDeviceMessage(String topic, String payload) {
    try {
      List<String> parts = topic.split('/');
      if (parts.length < 3) return; 
      
      String mac = parts[2]; 
      String statusText = payload.trim().toLowerCase();
      bool isOnline = (statusText == "online");

      setState(() {
        int id = mac.hashCode;
        devices[id] = Device(
          id: id,
          mac: mac,
          alias: "ESP32 ($mac)",
          status: isOnline ? "online" : "offline",
          lastSeen: DateTime.now(), // Se actualiza la hora de último contacto
        );
      });
    } catch (e) {
      print(">>> [ERROR] Fallo al procesar mensaje: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    int columnas = Platform.isWindows ? 5 : 2;

    return Scaffold(
      appBar: AppBar(
        title: const Text("StepGuard Admin Panel"),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(30),
          child: Column(
            children: [
              Text(
                connectionStatus,
                style: TextStyle(
                  color: connectionStatus == "Online" ? Colors.green : Colors.orange, 
                  fontSize: 12
                ),
              ),
              const SizedBox(height: 5),
            ],
          ),
        ),
      ),
      body: devices.isEmpty
          ? const Center(child: Text("Esperando mensajes de dispositivos..."))
          : GridView.builder(
              padding: const EdgeInsets.all(10),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columnas,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: devices.length,
              itemBuilder: (ctx, i) {
                final id = devices.keys.elementAt(i);
                return DeviceCard(device: devices[id]!, onTap: () {});
              },
            ),
    );
  }

  @override
  void dispose() {
    // 4. LIMPIAR EL TIMER AL CERRAR LA APP
    _refreshTimer?.cancel(); 
    client?.disconnect();
    super.dispose();
  }
}