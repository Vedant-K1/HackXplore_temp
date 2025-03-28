interface Question {
    soft_skill: string;
    question: string;
    options: string[];
}

export const questions: Question[] = [
    {
        "soft_skill": "Problem-Solving",
        "question": "During a high-stakes project, two critical components fail due to an unforeseen dependency issue. The deadline is just 24 hours away, and any delay could cost the company millions in penalties and lost business opportunities. You also have limited access to critical resources, as some team members are unavailable due to other commitments. While addressing this issue, you must balance short-term fixes with long-term project integrity. How do you proceed?",
        "options": [
            "Focus on fixing the most visible issue, hoping it resolves the dependency problem quickly, without delving into underlying causes.",
            "Break the problem into smaller tasks, delegate responsibilities among available team members, and prioritize addressing the root cause systematically.",
            "Pause the entire project to gather more comprehensive information and ensure that your eventual solution is foolproof, even if it risks missing the deadline.",
            "Immediately inform stakeholders about the issue, request an extension on the deadline, and begin investigating the problem further."
        ]
    },
    {
        "soft_skill": "Time Management",
        "question": "You are managing several overlapping projects, each with tight deadlines and high expectations from stakeholders. Halfway through, your manager assigns a new critical task that requires immediate attention. However, this new task conflicts with your current schedule and resources. Abandoning or delaying any of the tasks could harm your team’s reputation and impact client satisfaction. Additionally, you are already working extended hours, leaving little room for flexibility. What steps do you take to manage this situation?",
        "options": [
            "Communicate with your manager to reprioritize the tasks and adjust timelines, clearly explaining the trade-offs and potential impacts.",
            "Push yourself to work overtime and tackle all tasks single-handedly to avoid impacting team or client expectations.",
            "Delegate less critical tasks to trusted team members, while you focus on the most urgent and high-priority activities.",
            "Devote your attention to the newly assigned task, assuming that your team can handle the existing workload without your direct involvement."
        ]
    },
    {
        "soft_skill": "Teamwork",
        "question": "In a cross-functional team meeting, disagreements arise over conflicting priorities between short-term deliverables and long-term strategic goals. Tensions escalate, with some team members arguing for immediate results to satisfy clients, while others push for sustainable solutions that align with the company's vision. As the debate becomes heated, progress stalls, and morale starts to decline. How do you approach resolving this conflict?",
        "options": [
            "Side with the long-term strategy, emphasizing its alignment with the company’s overarching goals, even if it means delaying short-term deliverables.",
            "Propose splitting team resources to address both priorities simultaneously, acknowledging the increased strain this might place on the team.",
            "Encourage the team to refocus on shared goals by facilitating a collaborative discussion that aims to find a middle ground acceptable to everyone.",
            "Allow the debate to continue, assuming that the team will eventually reach a natural consensus without your direct intervention."
        ]
    },
    {
        "soft_skill": "Adaptability",
        "question": "A long-standing client unexpectedly changes their project requirements, demanding a new feature that significantly impacts your existing roadmap. Resources are already stretched thin, and implementing this change will require reallocating efforts from other important tasks. At the same time, rejecting the client’s request might jeopardize a crucial business relationship. How do you navigate this situation?",
        "options": [
            "Reallocate resources from lower-priority tasks, ensuring the client’s demands are met within their timeline, even if it disrupts other plans.",
            "Negotiate with the client for a phased rollout of the new feature, balancing their requirements with your team’s capacity and existing commitments.",
            "Stick to the original roadmap, providing a detailed explanation to the client about why the changes are unfeasible at this stage.",
            "Escalate the issue to senior management, seeking their guidance on whether to prioritize the client’s request over the existing roadmap."
        ]
    },
    {
        "soft_skill": "Leadership",
        "question": "Your team is struggling to adapt to a recently introduced company policy that significantly alters their workflows. Productivity is slipping, and morale is noticeably low, with several team members expressing frustration. Some employees openly question the policy's relevance, while others quietly comply but appear disengaged. As the team leader, you need to address these challenges without undermining the policy. What is your approach?",
        "options": [
            "Host an open forum where team members can express their concerns, while simultaneously communicating the potential benefits of the policy and aligning them with broader company objectives.",
            "Enforce the policy strictly, emphasizing the importance of compliance over addressing individual concerns, to ensure uniformity across the team.",
            "Allow team members to find personalized ways to adapt to the policy, giving them autonomy to adjust while maintaining overall compliance.",
            "Request senior management to reconsider or revise the policy, based on the team’s feedback and its impact on productivity and morale."
        ]
    },
    {
        "soft_skill": "Conflict Resolution",
        "question": "Two senior team members strongly disagree over the technical approach to a critical project. One approach offers faster implementation but poses potential risks, while the other is more robust but time-intensive. Their disagreement is creating tension within the team, and the project’s tight timeline leaves little room for prolonged debate. As the team leader, how do you handle this situation?",
        "options": [
            "Choose the approach that has been successful in similar past projects, prioritizing tried-and-tested methods.",
            "Facilitate a structured discussion where both members present the pros and cons of their approaches, and work collaboratively to determine the best compromise.",
            "Make an independent decision as the leader, selecting the approach that ensures the fastest progress, even if it risks alienating one team member.",
            "Permit both approaches to be tested simultaneously, doubling the workload and effort required, but ensuring an optimal solution is eventually identified."
        ]
    },
    {
        "soft_skill": "Communication",
        "question": "You need to pitch a complex technical idea to a group of investors with limited technical knowledge. Simplifying the idea too much risks losing critical nuances, while an overly technical explanation could alienate your audience. Additionally, the stakes are high, as securing investment depends on their understanding and enthusiasm for the project. What strategy do you use to effectively communicate your idea?",
        "options": [
            "Present a high-level overview using supporting visuals and analogies, ensuring the main idea is accessible while hinting at deeper complexities.",
            "Deliver a detailed technical explanation to demonstrate your expertise, even if it means some concepts might go over their heads.",
            "Focus on the business impact and potential returns of the idea, leaving the technical details for follow-up discussions or supplementary materials.",
            "Prepare a comprehensive document outlining all aspects of the idea, and provide it to the investors in advance to minimize the need for a detailed verbal presentation."
        ]
    },
    {
        "soft_skill": "Emotional Intelligence",
        "question": "During a team meeting, one of your team members openly criticizes a decision you made, derailing the discussion and creating a tense atmosphere. The rest of the team appears uncomfortable, and productivity drops as a result. It is critical to maintain both team harmony and your authority in this situation. How do you respond?",
        "options": [
            "Acknowledge the team member’s concerns, steer the discussion back to productive solutions, and address the criticism privately after the meeting.",
            "Defend your decision assertively to reestablish authority and swiftly move on with the meeting’s agenda.",
            "Ignore the criticism entirely and proceed with the meeting as planned, assuming the issue will resolve itself over time.",
            "End the meeting prematurely to prevent further conflict, and address the criticism with the entire team at a later time."
        ]
    },
    {
        "soft_skill": "Critical Thinking",
        "question": "Your team has proposed a solution to a recurring issue that has been affecting operations. Initial testing reveals scalability problems that could limit its effectiveness as the business grows. However, abandoning the solution now might demoralize the team, who have invested significant effort into its development. How do you approach this challenge?",
        "options": [
            "Proceed with implementing the solution for the time being, with a plan to revisit scalability issues later when resources allow.",
            "Conduct a thorough risk assessment and involve the team in refining the solution collaboratively, ensuring that scalability concerns are addressed.",
            "Abandon the solution altogether, emphasizing the importance of scalability and encouraging the team to start over with new ideas.",
            "Approve the solution but implement additional safeguards and contingencies to mitigate potential scalability risks in the future."
        ]
    },
    {
        "soft_skill": "Decision-Making",
        "question": "You are presented with two distinct career opportunities: one in a cutting-edge field offering exciting challenges and rapid innovation, but with uncertain growth prospects, and another in a stable, well-established field with a clear path for career progression but limited excitement. Both roles align with your skills and interests, but the decision will significantly shape your career trajectory. How do you decide?",
        "options": [
            "Choose the stable role for its security and predictable growth, ensuring a steady career progression.",
            "Opt for the cutting-edge role to push your boundaries and explore new opportunities, embracing the potential risks involved.",
            "Seek advice from trusted peers or mentors who have experience in both fields, and base your decision on their insights.",
            "Decline both roles for now, choosing to wait for a more suitable opportunity that better aligns with your long-term goals."
        ]
    },
]  