import React from "react";
import { IPersonality } from "@/app/types";
import { personalities } from "../agentConfigs/ultronAgent/Personality";

export function PersonalityBar() {
  const who = personalities[0]
  return (
    <div>
      <span className="agent-name">{who.name}</span>
      <span className="p-2 agent-profile">{who.traits}</span>
    </div>
  );
}

