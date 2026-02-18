class Device {
  final int id; // <--- Nuevo campo ID de la DB
  String mac;
  String status;
  DateTime lastSeen;
  String? alias;

  Device({
    required this.id,
    required this.mac,
    required this.status,
    required this.lastSeen,
    this.alias,
  });

  Map<String, dynamic> toJson() => {'id': id, 'mac': mac, 'alias': alias};

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'],
      mac: json['mac'] ?? "Sin MAC",
      alias: json['alias'],
      status: "offline",
      lastSeen: DateTime.now().subtract(const Duration(days: 1)),
    );
  }
}