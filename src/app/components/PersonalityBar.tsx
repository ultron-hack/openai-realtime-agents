import React from "react";
import { getPersona } from '../state/atoms';

export function PersonalityBar() {
  const persona = getPersona();

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {persona.imageUrl ? (
        <img src={persona.imageUrl} alt={persona.name} className="w-32 h-32" />
      ) : (
        <div className="agent-emoji text-6xl">{persona.emoji}</div>
      )}
    </div>
  );
}
