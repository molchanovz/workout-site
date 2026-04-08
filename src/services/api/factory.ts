/* Code generated from jsonrpc schema by rpcgen v2.4.4; DO NOT EDIT. */
/* eslint-disable */
export interface IApproach {
  id: number,
  exerciseId?: number,
  reps?: number,
  weight?: number,
  duration?: number,
  createdAt?: string,
  statusId: number
}

export interface ICategory {
  id: number,
  parentCategoryId?: number,
  title: string,
  siteUserId?: number,
  statusId: number
}

export interface IExercise {
  id: number,
  title: string,
  categoryId: number,
  siteUserId?: number,
  typeId: number,
  statusId: number
}

export interface IExerciseAddCategoryParams {
  title: string,
  parentCategoryId?: number
}

export interface IExerciseAddParams {
  title: string,
  categoryId: number,
  typeId: number
}

export interface IExerciseCategoryListParams {
  parentId?: number
}

export interface IExerciseListParams {
  categoryId: number
}

export interface IExerciseSearchParams {
  title: string
}

export interface IExerciseWithApproaches {
  exercise: IExercise,
  approaches: Array<IApproach>
}

export interface ITraining {
  id: number,
  siteUserId: number,
  approachIds: Array<number>,
  startedAt: string,
  endedAt?: string,
  statusId: number,
  date: string,
  exerciseCount: number,
  name?: string
}

export interface ITrainingAddApproachParams {
  trainingId: number,
  exerciseId: number,
  reps: number,
  weight: number
}

export interface ITrainingAddTimedApproachParams {
  trainingId: number,
  exerciseId: number,
  duration: number
}

export interface ITrainingApproachListParams {
  trainingId: number,
  exerciseId: number
}

export interface ITrainingDeleteApproachParams {
  trainingId: number,
  approachId: number
}

export interface ITrainingDeleteParams {
  id: number
}

export interface ITrainingDetail {
  id: number,
  siteUserId: number,
  approachIds: Array<number>,
  startedAt: string,
  endedAt?: string,
  statusId: number,
  date: string,
  exerciseCount: number,
  name?: string,
  exercises: Array<IExerciseWithApproaches>
}

export interface ITrainingExerciseListParams {
  trainingId: number
}

export interface ITrainingGetParams {
  id: number
}

export interface ITrainingListParams {
  date?: string,
  from?: string,
  to?: string
}

export interface ITrainingNewParams {
  date: string
}

export interface ITrainingUpdateApproachParams {
  approachId: number,
  reps: number,
  weight: number
}

export interface ITrainingUpdateTimedApproachParams {
  approachId: number,
  duration: number
}

export interface IStatsPREntry {
  exerciseId: number,
  exerciseTitle: string,
  maxWeight: number,
  reps: number,
  est1rm: number,
  achievedAt: string
}

export interface IStatsWeekVolume {
  week: string,
  volume: number
}

export interface IStatsStreakStats {
  currentStreak: number,
  monthCount: number,
  yearCount: number
}

export interface IStatsWeeklyVolumeParams {
  weeks: number
}

export const factory = (send: any) => ({
  exercise: {
    add(params: IExerciseAddParams): Promise<number> {
      return send('exercise.Add', params)
    },
    addCategory(params: IExerciseAddCategoryParams): Promise<number> {
      return send('exercise.AddCategory', params)
    },
    categoryList(params: IExerciseCategoryListParams): Promise<Array<ICategory>> {
      return send('exercise.CategoryList', params)
    },
    list(params: IExerciseListParams): Promise<Array<IExercise>> {
      return send('exercise.List', params)
    },
    search(params: IExerciseSearchParams): Promise<Array<IExercise>> {
      return send('exercise.Search', params)
    }
  },
  training: {
    addApproach(params: ITrainingAddApproachParams): Promise<number> {
      return send('training.AddApproach', params)
    },
    addTimedApproach(params: ITrainingAddTimedApproachParams): Promise<number> {
      return send('training.AddTimedApproach', params)
    },
    approachList(params: ITrainingApproachListParams): Promise<Array<IApproach>> {
      return send('training.ApproachList', params)
    },
    delete(params: ITrainingDeleteParams): Promise<boolean> {
      return send('training.Delete', params)
    },
    deleteApproach(params: ITrainingDeleteApproachParams): Promise<boolean> {
      return send('training.DeleteApproach', params)
    },
    exerciseList(params: ITrainingExerciseListParams): Promise<Array<IExercise>> {
      return send('training.ExerciseList', params)
    },
    get(params: ITrainingGetParams): Promise<ITrainingDetail> {
      return send('training.Get', params)
    },
    list(params: ITrainingListParams): Promise<Array<ITraining>> {
      return send('training.List', params)
    },
    new(params: ITrainingNewParams): Promise<ITraining> {
      return send('training.New', params)
    },
    updateApproach(params: ITrainingUpdateApproachParams): Promise<boolean> {
      return send('training.UpdateApproach', params)
    },
    updateTimedApproach(params: ITrainingUpdateTimedApproachParams): Promise<boolean> {
      return send('training.UpdateTimedApproach', params)
    }
  },
  stats: {
    personalRecords(): Promise<Array<IStatsPREntry>> {
      return send('stats.PersonalRecords', {})
    },
    weeklyVolume(params: IStatsWeeklyVolumeParams): Promise<Array<IStatsWeekVolume>> {
      return send('stats.WeeklyVolume', params)
    },
    streak(): Promise<IStatsStreakStats> {
      return send('stats.Streak', {})
    }
  }
})