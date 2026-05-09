# Especificación de Reglas: The Big Polla (Mundial 2026)

## Reglas de Puntuación
El sistema calculará los puntos para cada partido basándose en el pronóstico del usuario y el resultado real.

### Puntos por Partido

| Criterio | Ronda (Fase Grupos) | Fase Eliminación |
| :--- | :---: | :---: |
| **Acierto de Resultado (Ganador/Empate)** | 5 pts | 10 pts |
| **Acierto de Goles (Por equipo)** | 2 pts | 4 pts |
| **Acierto de Diferencia de Goles** | 1 pt | 2 pts |

### Bonos y Reglas Especiales
- **Racha de Aciertos:** Por cada 3 aciertos consecutivos (de cualquier tipo), el usuario recibe +5 puntos extra.
- **Bloqueo de Predicciones:** Las predicciones NO pueden ser creadas ni modificadas una vez iniciado el partido (status pasa a `EN_VIVO`).
- **Transparencia:** Cada `Score` debe tener un desglose (trazabilidad) que explique cómo se sumaron los puntos (puntos por resultado, goles, diferencia y bonos).

---

## Modelo de Datos (Prisma)

### Entidades Principales
- **User:** Auth data, perfil, nombre.
- **League:** Grupos de usuarios (id, nombre, ownerId).
- **Match:** Datos traídos de la API externa.
- **Prediction:** Pronóstico del usuario por partido (incluye estado de bloqueo).
- **Score:** Acumulado del usuario en una liga.
- **ScoreLog:** Registro detallado de cada punto sumado para transparencia.

---

## Flujo del Motor de Puntuación
1. Se detecta el fin de un partido.
2. El sistema valida el `Match.status`. Si no es `FINALIZADO`, se ignora.
3. Se calculan los puntos de cada predicción y se guardan en `Prediction.points`.
4. Se generan registros en `ScoreLog` para cada criterio de puntuación obtenido.
5. Se recalcula el `Score` acumulado de la liga y se verifica si hubo bono por racha.
