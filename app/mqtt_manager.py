import paho.mqtt.client as mqtt
import config


class MQTTManager:
    def __init__(self, on_message_callback):
        # Compatibilidad Paho v2.0
        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            client_id="WindowsMonitor"
        )
        self.client.username_pw_set(config.MQTT_USER, config.MQTT_PASS)
        self.client.tls_set()

        self.on_message_callback = on_message_callback
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.client.subscribe(config.HEARTBEAT_TOPIC)

    def on_message(self, client, userdata, msg):
        try:
            mac = msg.topic.split("/")[-1]
            payload = msg.payload.decode()
            self.on_message_callback(mac, payload)
        except Exception as e:
            print(f"Error: {e}")

    def start(self):
        self.client.connect(config.MQTT_SERVER, config.MQTT_PORT, 60)
        self.client.loop_start()