import { send } from './client'
import { factory } from './factory'

export const api = factory(send)
export type { IApproach, ICategory, IExercise, IExerciseWithApproaches, ITraining, ITrainingDetail } from './factory'
