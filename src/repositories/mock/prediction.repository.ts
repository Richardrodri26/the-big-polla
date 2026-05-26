import type { IPredictionRepository } from '@/repositories/interfaces'
import type { Prediction } from '@/types/domain'

export class MockPredictionRepository implements IPredictionRepository {
  async getPredictions(_userId: string): Promise<Prediction[]> {
    // In the mock phase, userPrediction is embedded in each Match.
    // This method exists for interface compliance — the real implementation
    // will return the user's predictions from the backend.
    return []
  }

  async savePrediction(_matchId: string, _score: [number, number]): Promise<void> {
    // In the mock phase, saves go directly to predictionStore (Zustand + localStorage).
    // The real implementation will POST to the backend API.
  }
}
