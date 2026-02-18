# --- Configuración MQTT ---
MQTT_SERVER = "a54daced88d04e29b3ea4910a02d45ba.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "stepguard"
MQTT_PASS = "Stepguard123"

# --- Tópico para escuchar ---
HEARTBEAT_TOPIC = "stepguard/status/#"
NAMES_FILE = "device_names.json"

# --- UI Layout ---
WATCHDOG_TIMEOUT = 15
COLUMNS_MAX = 3
CARD_SIZE = 200

# --- Colores ---
COLOR_ONLINE = "#2ECC71"
COLOR_OFFLINE = "#E74C3C"
COLOR_BG_CARD = "#2B2B2B"