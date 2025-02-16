import React from "react";
import { personaAtom, personaList, getPersona, randomPersona } from '../state/atoms'
import { useAtom } from "jotai";
import _ from "lodash";


export function PersonalityBar() {
  const persona = getPersona()

  return (
    <div className="flex items-center gap-2 personality-bar">
      <div className="agent-emoji">{persona.emoji}</div>
      <div className="agent-name">{persona.name}</div>
    </div>
  );
}

// in case we want to show the list
export function PersonaList() {
  return (
    <span className='agent-profile'>
      {personaList.map((a) => (
        <div key={a.id}>
          <span>{a.name}</span>
        </div>
      ))}
    </span>
  )
}
