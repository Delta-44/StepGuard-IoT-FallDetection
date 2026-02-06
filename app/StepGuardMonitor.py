import customtkinter as ctk
import paho.mqtt.client as mqtt
import time
from threading import Thread

# --- CONFIGURACIÓN MQTT ---
MQTT_SERVER = "a54daced88d04e29b3ea4910a02d45ba.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "stepguard"
MQTT_PASS = "Stepguard123"


class StepGuardApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("StepGuard - Panel de Control")
        self.geometry("600x400")
        ctk.set_appearance_mode("dark")

        # {mac: {"status": "online", "last_seen": ts, "label": widget}}
        self.dispositivos = {}

        # UI: Título
        self.label_titulo = ctk.CTkLabel(
            self,
            text="Dispositivos StepGuard Conectados",
            font=("Roboto", 20)
        )
        self.label_titulo.pack(pady=20)

        # UI: Contenedor de lista
        self.scroll_frame = ctk.CTkScrollableFrame(self, width=550, height=300)
        self.scroll_frame.pack(pady=10, padx=10)

        # Hilo de chequeo de desconexión
        self.check_thread = Thread(target=self.watchdog_logic, daemon=True)
        self.check_thread.start()

        self.start_mqtt()

    def start_mqtt(self):
        self.client = mqtt.Client(
            client_id="WindowsMonitor",
            transport="tcp"
        )
        self.client.username_pw_set(MQTT_USER, MQTT_PASS)
        self.client.tls_set()

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.client.connect(MQTT_SERVER, MQTT_PORT, 60)
        self.client.loop_start()

    def on_connect(self, client, userdata, flags, rc):
        print("Conectado al Broker")
        self.client.subscribe("stepguard/status/#")

    def on_message(self, client, userdata, msg):
        try:
            mac = msg.topic.split("/")[-1]
            payload = msg.payload.decode()

            if payload == "online":
                self.actualizar_dispositivo(mac)
        except Exception as e:
            print(f"Error: {e}")

    def actualizar_dispositivo(self, mac):
        ahora = time.time()

        if mac not in self.dispositivos:
            frame = ctk.CTkFrame(self.scroll_frame)
            frame.pack(fill="x", pady=5)

            lbl_mac = ctk.CTkLabel(frame, text=mac, width=200, anchor="w")
            lbl_mac.pack(side="left", padx=10)

            lbl_status = ctk.CTkLabel(
                frame,
                text="ONLINE",
                text_color="green",
                font=("Roboto", 12, "bold")
            )
            lbl_status.pack(side="right", padx=20)

            self.dispositivos[mac] = {
                "last_seen": ahora,
                "status": "online",
                "label_widget": lbl_status
            }
        else:
            self.dispositivos[mac]["last_seen"] = ahora
            if self.dispositivos[mac]["status"] == "offline":
                self.dispositivos[mac]["status"] = "online"
                self.dispositivos[mac]["label_widget"].configure(
                    text="ONLINE",
                    text_color="green"
                )

    def marcar_offline_ui(self, label):
        """ Función para actualizar la UI desde el hilo principal """
        label.configure(text="OFFLINE", text_color="red")

    def watchdog_logic(self):
        """ Revisa cada segundo si hay desconexiones """
        while True:
            ahora = time.time()
            for mac, info in self.dispositivos.items():
                # Si han pasado más de 15 segundos
                if ahora - info["last_seen"] > 15:
                    if info["status"] == "online":
                        info["status"] = "offline"
                        # Extraemos el widget a una variable para acortar
                        target_label = info["label_widget"]
                        self.after(0, self.marcar_offline_ui, target_label)
            time.sleep(1)


if __name__ == "__main__":
    app = StepGuardApp()
    app.mainloop()