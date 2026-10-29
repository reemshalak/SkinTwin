import { FEATURED } from "./cohort";
import { personById, portraitPath } from "./people";
import type { Scores } from "./types";

// Sample faces for judges without a camera: four of the featured people.
// A sample scan uses that person's demo scores and excludes them from their own twins.
export interface SampleFace {
  id: string;
  name: string;
  note: string;
  image: string;
  tone: string;
  scores: Scores;
}

const NOTES: Record<string, string> = {
  amara: "Oily, breakout-prone",
  lena: "Dry & sensitive",
  mei: "Combination",
  rosa: "Mature, dullness",
};

export const SAMPLE_FACES: SampleFace[] = Object.keys(NOTES).map((id) => {
  const person = personById(id)!;
  return {
    id,
    name: person.name,
    note: NOTES[id],
    image: portraitPath(id),
    tone: person.tone,
    scores: FEATURED.find((m) => m.personId === id)!.scores,
  };
});

export const sampleById = (id: string) => SAMPLE_FACES.find((s) => s.id === id);
