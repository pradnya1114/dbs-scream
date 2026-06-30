/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GamePage {
  WELCOME = 'welcome',
  RULES = 'rules',
  GAME = 'game',
  RESULT = 'result',
}

export interface Participant {
  id: string;
  name: string;
  date: string;
  time: string;
  peakDb: number;
  avgDb: number;
  score: number;
  achievement: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  peakDb: number;
  score: number;
  date: string;
}

export enum Achievement {
  CADET = 'Cadet',
  PILOT = 'Pilot',
  COMMANDER = 'Commander',
  ASTRONAUT = 'Astronaut',
  GALAXY_MASTER = 'Galaxy Master',
}

export function getAchievement(score: number): Achievement {
  if (score >= 900) return Achievement.GALAXY_MASTER;
  if (score >= 700) return Achievement.ASTRONAUT;
  if (score >= 500) return Achievement.COMMANDER;
  if (score >= 300) return Achievement.PILOT;
  return Achievement.CADET;
}
