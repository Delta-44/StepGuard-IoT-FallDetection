import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart'; // 1. Importa la librería
import 'screens/dashboard.dart';

Future<void> main() async {
  // 2. Asegura que Flutter esté listo para cargar assets antes de correr la app
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // 3. Carga el archivo .env
    await dotenv.load(fileName: ".env");
    print(">>> .env cargado correctamente");
  } catch (e) {
    print(">>> Error cargando .env: $e");
  }

  runApp(const StepGuardApp());
}

class StepGuardApp extends StatelessWidget {
  const StepGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'StepGuard Monitor',
      theme: ThemeData.dark(useMaterial3: true),
      home: const DashboardScreen(),
    );
  }
}