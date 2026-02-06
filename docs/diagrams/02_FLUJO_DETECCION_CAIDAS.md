# Diagrama de Flujo: Detección de Caídas

## Flujo Principal de Detección

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESP32 - LOOP PRINCIPAL                       │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │   Inicialización     │
    │ ├─ MPU6050 setup()   │
    │ ├─ WiFi connect()    │
    │ ├─ NTP sync time     │
    │ └─ Display boot OK   │
    └──────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │   Loop Infinito      │
    │ (cada 10ms ~ 100Hz)  │
    └──────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │  1. Leer Acelerómetro (MPU6050)      │
    │  ├─ ax, ay, az (3 ejes)              │
    │  ├─ gx, gy, gz (velocidad angular)   │
    │  └─ temp (temperatura)               │
    └──────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │  2. Aplicar Filtro (Low-Pass)        │
    │  ├─ α = 0.05                         │
    │  ├─ a_filtrado[i] = a_prev[i]*0.95   │
    │  │                + a_actual[i]*0.05 │
    │  └─ Reduce ruido                     │
    └──────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │  3. Calcular Magnitud                │
    │  ├─ aceleracion_total = √(ax²+ay²+az²)
    │  ├─ rango: 0.5g a 20g típicamente   │
    │  └─ Caída: pico >2g + depresión      │
    └──────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │  4. Detectar Pico (Impacto)          │
    │  ├─ aceleracion > UMBRAL_CAIDA?      │
    │  │  (ej: 3.5g)                       │
    │  │                                   │
    │  ├─ SÍ → Ir a Paso 5                 │
    │  └─ NO → Volver a Loop (fin)         │
    └──────────────────────────────────────┘
             │
             ▼ (SÍ: Detectado pico)
    ┌──────────────────────────────────────┐
    │  5. Iniciar Temporizador (500ms)     │
    │  ├─ start_time = millis()            │
    │  ├─ flag_posible_caida = true        │
    │  └─ Comienza fase de verificación    │
    └──────────────────────────────────────┘
             │
      ┌──────┴────────┐
      │ Durante 500ms │
      ▼               ▼
    (SÍ)            (NO - timeout)
      │               │
      ▼               ▼
┌──────────────────────────┐
│ 6. Verificar Patrón      │ (Si no)
│    (Post-Impacto)        │  → Flag = false
│ ├─ aceleracion baja?     │  → Fin detección
│ │  (< 1.5g)              │  → Volver a Loop
│ └─ Persona está quieta?  │
│    SÍ → Caída confirmada │
│    NO → Falsa alarma     │
└──────────────────────────┘
      │
      ├─ SÍ (Caída)      └─ NO (Falsa alarma)
      │                      │
      ▼                      ▼
┌──────────────────────────┐ ┌──────────────────┐
│  7. CAÍDA DETECTADA      │ │ Reset y continúa │
│ ├─ vibrador.on(300ms)    │ │ monitoreando      │
│ ├─ LED rojo              │ │                  │
│ ├─ Display "¡CAÍDA!"     │ │ (Volver a Loop)  │
│ └─ timestamp = now()     │ └──────────────────┘
└──────────────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│  8. Enviar Alerta al Backend         │
│                                      │
│  HTTP POST /api/alertas              │
│  Body: {                             │
│    "dispositivo_id": 1,              │
│    "tipo": "CAIDA",                  │
│    "severidad": "CRITICA",           │
│    "timestamp": "2026-02-05T10:...", │
│    "ubicacion": "Sala",              │
│    "temperatura": 28.5               │
│  }                                   │
└──────────────────────────────────────┘
      │
      ▼ (Response)
┌──────────────────────────────────────┐
│  9. Backend recibe POST               │
│ ├─ Valida dispositivo_id              │
│ ├─ Busca usuario asociado             │
│ ├─ Crea registro en tabla alertas      │
│ ├─ Envía email al cuidador            │
│ └─ Emite WebSocket a Frontend         │
└──────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│  10. Frontend recibe alerta           │
│  ├─ Dashboard actualiza               │
│  ├─ Cambio de color (rojo)            │
│  ├─ Toast/notificación sonora         │
│  ├─ Banner prominente                 │
│  └─ Timestamp en BD: 0-2 segundos     │
└──────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│  11. Usuario responde                │
│  ├─ "Atender" → elimina alerta        │
│  ├─ "Rechazar" → marcar falsa alarma  │
│  ├─ "Llamar ambulancia" → contacto    │
│  └─ Si no responde → escalar           │
└──────────────────────────────────────┘
      │
      ▼
│  Fin del ciclo
└─ Volver a Loop (Paso 1)
```

## Máquina de Estados (Dispositivo)

```
                    ┌─────────────┐
                    │   BOOT      │
                    └──────┬──────┘
                           │ (Setup ok)
                           ▼
                    ┌─────────────┐
                ┌──>│  ESPERANDO  │◄──┐
                │   │  (Normal)   │   │
                │   └──────┬──────┘   │
                │          │          │
                │ (Timeout)│ (Pico)   │
                │          ▼          │
                │   ┌────────────┐    │
                │   │ DETECTANDO │    │ (No caída)
                │   │  (Verif.)  │    │
                │   └──────┬─────┘    │
                │          │          │
                │    (SÍ caída)│      │
                │          │  │       │
                │          ▼  └───────┘
                │   ┌────────────┐
                │   │   ALERTA   │
                │   │  (Enviando)│
                │   └──────┬─────┘
                │          │ (Backend ack)
                │          ▼
                │   ┌────────────┐
                │   │  CONFIRMADA│
                │   │ (En BD)    │
                └───┤ (T: 3s)    │
                    └────────────┘
```

## Umbrales de Detección

| Parámetro | Valor | Rango | Notas |
|-----------|-------|-------|-------|
| Aceleración (pico) | 3.5g | 2.5-4.5g | Detecta impacto |
| Aceleración (post) | < 1.5g | 0.5-2.0g | Verifica reposo |
| Ventana temporal | 500ms | 300-800ms | Tiempo de verificación |
| Gravedad (referencia) | 9.81 m/s² | - | 1g = aceleración estándar |
| Filtro (α) | 0.05 | 0.01-0.10 | Reduce ruido |
| Timeout entre alertas | 10s | 5-30s | Evita spam |

## Casos de Prueba

### Caso 1: Caída Real
```
1. Persona de pie → a_total ≈ 1g
2. Caída → a_total pico = 4.5g (impacto)
3. Persona en suelo → a_total = 1g (reposo)
   ├─ 0-100ms: pico detectado
   ├─ 100-500ms: verificación
   ├─ 500ms: caída confirmada
   └─ ~1s: alerta en Backend
     └─ ~2s: alerta en Frontend
```

### Caso 2: Falsa Alarma (Salto)
```
1. Persona salta → a_total = 1.5g (despegue)
2. Aire → a_total = 1g (caída libre aparente)
3. Aterrizaje → a_total = 2.5g (menor que caída)
   ├─ 0-100ms: pico no alcanza umbral
   └─ NO se genera alerta (correcto)
```

### Caso 3: Acostarse Lento
```
1. Persona acostada de pie
2. Se acuesta lentamente → a_total gradual < 3.5g
   ├─ No hay pico
   └─ NO se genera alerta (correcto)
```

