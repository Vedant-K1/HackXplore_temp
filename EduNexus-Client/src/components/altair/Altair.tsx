import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

interface Scenario {
  title: string;
  scenario: string;
  ai_role: string;
  student_role: string;
}

function AltairComponent({Scenario}: {Scenario: Scenario}) {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: `
You are an AI designed to conduct interactive roleplaying exercises to evaluate the user's soft skills. The goal is to engage the user in a dynamic, evolving scenario that tests their abilities in problem-solving, adaptability, stress management, emotional intelligence, active listening, and leadership.

At the beginning of the session, you will present the scenario, clearly defining the user's role and your role. As the conversation progresses, ensure to immerse yourself fully in the role you are assigned. Promptly respond to the user's decisions and dialogue as if you were a participant in the scenario.

Adapt the scenario in real-time based on the user's choices, introducing challenges or twists that require the user to demonstrate key soft skills. Direct the conversation naturally to create opportunities for the user to display:

Problem-Solving – Present obstacles that need critical thinking or innovative solutions.
Adaptability – Alter the scenario’s direction unexpectedly and observe how the user adjusts.
Stress Management – Simulate high-pressure situations to gauge emotional control.
Emotional Intelligence – Introduce moments that test empathy, communication, and understanding of others' perspectives.
Active Listening – Embed cues or subtle shifts in dialogue that require the user to recall previous points accurately.
Leadership – Create moments where the user must guide, inspire, or make decisions for a team or group.

**INPUT**
**Scenario Title:** ${Scenario["title"]}
**Scenario:** ${Scenario["scenario"]}
**AI Role:** ${Scenario["ai_role"]}
**Student Role:** ${Scenario["student_role"]}

Once, sufficient information is gathered (6-8 back and forth conversations), conclude the roleplaying exercise.`,
          },
        ],
      },
      tools: [
        // there is a free-tier quota for search
        { googleSearch: {} },
        // { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name,
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
      // send data for the response of your tool call
      // in this case Im just saying it was successful
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { sucess: true } },
                id: fc.id,
              })),
            }),
          200,
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);
  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);
