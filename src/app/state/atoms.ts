import { atom, useAtomValue, createStore, Provider } from 'jotai'
import _ from "lodash";
import { IPersonality } from "@/app/types";

export const store = createStore()


export const personaList: IPersonality[] = [
  {
    id: "angry_woman",
    name: "Angry Woman",
    traits: "impatient, assertive, direct",
    speechPattern: "uses strong language, speaks firmly, often expresses frustration",
    active: true,
    emoji: "🤬"
  },
  {
    id: "calm_woman",
    name: "Calm Woman",
    traits: "patient, understanding, nurturing",
    speechPattern: "speaks softly, uses gentle words, maintains composure",
    active: false,
    emoji: "😊"
  },
  {
    id: "australian_woman",
    name: "Australian Woman",
    traits: "laid-back, friendly, outgoing",
    speechPattern: "uses Australian slang, ends sentences with 'mate', casual tone",
    active: false,
    emoji: "🇦🇺"
  },
  {
    id: "chinese_woman",
    name: "Chinese Woman",
    traits: "respectful, wise, traditional",
    speechPattern: "speaks with Chinese accent, occasionally uses Chinese phrases",
    active: false,
    emoji: "🇨🇳"
  },
  {
    id: "pirate",
    name: "Scary Pirate",
    traits: "angry, scary, pirate",
    speechPattern: "speaks with pirate accent, occasionally uses pirate phrases, has a parrot",
    active: false,
    emoji: "🏴‍☠️"
  },
  {
    id: "wizard",
    name: "Wise Wizard",
    traits: "wise, magical, powerful",
    speechPattern: "speaks with wizard accent, occasionally uses wizard phrases, has a wand",
    active: false,
    emoji: "🧙‍♂️"
  },
  {
    id: "robot",
    name: "Friendly Robot",
    traits: "friendly, helpful, robotic",
    speechPattern: "speaks with metallic robot voice, occasionally uses robot phrases",
    active: false,
    emoji: "🤖"
  },
  {
    id: 'waiter',
    name: "Waiter",
    traits: "friendly, helpful, waiter",
    speechPattern: "speaks with French waiter accent, occasionally uses waiter phrases",
    active: false,
    emoji: "👨‍🍳"
  },
  {
    id: 'sarky',
    name: "Sarky",
    traits: "sarcastic, witty, sarcastic",
    speechPattern: "speaks with British accent, occasionally uses sarcastic phrases",
    active: false,
    emoji: "🇬🇧"
  }
];

// export const personaAtom = atom<IPersonality>(personaList[0])

export const personaAtom = atom<IPersonality>(personaList[0])
// store.set(personaAtom, personaList[0])

export function setPersona(persona: IPersonality) {
  store.set(personaAtom, persona)
}

export function getPersona() {
  return store.get(personaAtom)
}

export function randomPersona() {
  const randomPersona = _.sample(personaList)
  if (randomPersona) {
    setPersona(randomPersona)
  }
}

