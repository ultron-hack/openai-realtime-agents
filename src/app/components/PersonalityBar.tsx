import React from "react";
import { IPersonality } from "@/app/types";

export function PersonalityBar(opts: { who: IPersonality }) {
  return (
    <div>
      <span className="agent-name">{opts.who.name}</span>
      <span className="p-2 agent-profile">{opts.who.traits}</span>
    </div>
  );
}

