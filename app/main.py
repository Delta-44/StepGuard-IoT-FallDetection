import customtkinter as ctk
import time
import json
import os
from threading import Thread
import config
from mqtt_manager import MQTTManager
from ui_components import DeviceCard


class StepGuardApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("StepGuard Monitor")
        self.geometry("800x650")

        self.nombres_pc = self.cargar_nombres()
        self.dispositivos = {}

        self.header = ctk.CTkLabel(
            self, text="Panel StepGuard", font=("Roboto", 26, "bold")
        )
        self.header.pack(pady=25)

        self.container = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.container.pack(fill="both", expand=True, padx=20, pady=10)

        for i in range(config.COLUMNS_MAX):
            self.container.grid_columnconfigure(i, weight=1)

        self.mqtt = MQTTManager(self.procesar_mensaje)
        self.mqtt.start()
        Thread(target=self.watchdog_worker, daemon=True).start()

    def cargar_nombres(self):
        if os.path.exists(config.NAMES_FILE):
            with open(config.NAMES_FILE, "r") as f:
                return json.load(f)
        return {}

    def guardar_nombres(self):
        with open(config.NAMES_FILE, "w") as f:
            json.dump(self.nombres_pc, f)

    def solicitar_renombre(self, mac):
        dialog = ctk.CTkInputDialog(
            text=f"Nombre para {mac}:",
            title="Renombrar"
        )
        nuevo_nombre = dialog.get_input()
        if nuevo_nombre:
            self.nombres_pc[mac] = nuevo_nombre
            self.guardar_nombres()
            if mac in self.dispositivos:
                self.dispositivos[mac]["card"].update_name(nuevo_nombre)

    def procesar_mensaje(self, mac, payload):
        if payload == "online":
            self.after(0, self.actualizar_ui_dispositivo, mac)

    def actualizar_ui_dispositivo(self, mac):
        ahora = time.time()
        if mac not in self.dispositivos:
            idx = len(self.dispositivos)
            alias = self.nombres_pc.get(mac, None)

            # Dividimos los argumentos en varias líneas (PEP 8)
            card = DeviceCard(
                self.container,
                mac,
                alias,
                self.solicitar_renombre
            )

            r_idx = idx // config.COLUMNS_MAX
            c_idx = idx % config.COLUMNS_MAX
            card.grid(row=r_idx, column=c_idx, padx=15, pady=15)

            self.dispositivos[mac] = {
                "card": card,
                "last_seen": ahora,
                "status": "online"
            }
        else:
            self.dispositivos[mac]["last_seen"] = ahora
            if self.dispositivos[mac]["status"] == "offline":
                self.dispositivos[mac]["status"] = "online"
                self.dispositivos[mac]["card"].set_online()

    def watchdog_worker(self):
        while True:
            ahora = time.time()
            for mac, info in self.dispositivos.items():
                timeout = config.WATCHDOG_TIMEOUT
                if ahora - info["last_seen"] > timeout:
                    if info["status"] == "online":
                        info["status"] = "offline"
                        self.after(0, info["card"].set_offline)
            time.sleep(1)


if __name__ == "__main__":
    app = StepGuardApp()
    app.mainloop()