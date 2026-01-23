export enum DifficultyEnum {
  VERY_EASY = 0,
  EASY = 1,
  MEDIUM = 2,
  HARD = 3
}

export const DifficultySettings = {
  [DifficultyEnum.VERY_EASY]: {
    acceptableErrorSemitones: 1.0
  },
  [DifficultyEnum.EASY]: {
    acceptableErrorSemitones: 0.75
  },
  [DifficultyEnum.MEDIUM]: {
    acceptableErrorSemitones: 0.5
  },
  [DifficultyEnum.HARD]: {
    acceptableErrorSemitones: 0.25
  }
}
