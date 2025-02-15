"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren } from "react";
import { IPersonality } from "@/app/types";

type PersonalityContextValue = {
  personality: IPersonality;
  setPersonality: (personality: IPersonality) => void;
};

const PersonalityContext = createContext<PersonalityContextValue | undefined>(undefined);

export const PersonalityProvider: FC<PropsWithChildren> = ({ children }) => {
  const [personality, setPersonality] = useState<IPersonality | null>(null);

  return (
    <PersonalityContext.Provider
      value={{ personality: personality as IPersonality, setPersonality }}
    >
      personality: {personality?.name}
    </PersonalityContext.Provider>
  );
};

export function usePersonality() {
  const context = useContext(PersonalityContext);
  if (!context) {
    throw new Error("usePersonality must be used within an PersonalityProvider");
  }
  return context;
}