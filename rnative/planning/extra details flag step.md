# Question 1 — Estranged child

If YES, immediately branch into two separate follow-ups because these are legally distinct situations:

Flow

```mermaid
flowchart TD
    A{"A. Have you listed your estranged<br/>child(ren) in the app already?"}
    B["B. Please select which<br/>child(ren) are estranged below"]
    C["C. Please add your estranged child(ren).<br/>Also capture whether they are over or under 18,<br/>and if under, the estimated DOB."]

    A -- Yes --> B
    A -- No --> C

    C -- "Conditions met" --> n2
    B -- "Conditions met" --> n2

    n2{"Is a minor involved?"}

    n3["A court will almost certainly<br/> make financial provision for a child<br/> under 18 if your will is challenged.<br/> The court's primary concern is the child's welfare<br/> and maintenance — your reasons for the current<br/> allocation will be considered but are unlikely<br/> to override this.<br/><br/>Would you like to change your allocations?"]

    n4["To challenge your will an adult<br/> would need to demonstrate financial need<br/> or dependency. A court will consider<br/> their circumstances, your reasons for the<br/> current allocation, and the size<br/> of your estate.<br/><br/>The strength of any challenge depends<br/> heavily on the individual's situation. A<br/> letter of wishes explaining your reasoning<br/> is your most important protection here.<br/><br/>Here are your children and their current shares:<br/><em>[bar chart / percentage list]</em><br/><br/>Would you like to review any of these allocations?"]

    n2 -- Yes --> n3
    n2 -- No --> n4

    E(("Answer recorded - Task in planning section<br/> for user to address<br/> changing allocations. Side letter<br/> task there to explain<br/> intentions."))
    F(("Answer recorded and task in<br/> planning for side letter<br/> to be created explaining intentions."))

    n3 -- Yes --> E
    n3 -- No --> F
    n4 -- Yes --> E
    n4 -- No --> F

```


# Question 2 — Promise contradiction

If YES, two follow-ups:

```mermaid
flowchart TD
  A["If the Promisee has relied on that promise, they may be able to challenge your will. Select your preferred option: \n \n A: Alter the will, keep the promise \n\n B: Roll back on the promise \n\n C: Risk there will be no challenge"]
  A -- Selects A --> B[Task added to alter your bequethal]
  B --> C["When they hit the tassk, they a popup saying, \n'Please alter your bequethal to uphold the promise', and \nare then rediurected to the estate dashboard"]
  A --Selects B --> D[Rolling back on a promise is sometimes the only realistic option, but it carries legal risk. However, If the promisee took any action in reliance on this promise, rolling it back may not be legally effective and they could still succeed in court.\n\n If you confirm this as a desired route we will reach out to discuss the situation. Buttons:\nReach out please!\nBack]
  D --If Continue --> F[BIG TICK ICON \nWe will be in touch!]
  A -- Selects C --> E["This is a route taken by some, please note that defending a claim can be expensive with costs falling on the estate. \n\n Are you sure you're happy to take the risk?\n\n Buttons:\nYes - Continue\nPlease contact me for support! \nBack "]
  E -- Contact Support -->G((TODO in code for admin \nside to contact user)) --> H[We'll be in touch!]

```

# Question 3 — Family conflict

If YES → no sub-questions needed. This is a severity amplifier, not a standalone data collector.
--> BUT need to add a task int he planning section of user's interface for side letter - for now TODO - "add planning letter to planning section"

All executors are beneficiaries → already detected from your data model → conflict flag makes this critical rather than advisory

The one genuinely useful optional follow-up is:

# Questions 4 & 5 — Disabled / vulnerable beneficiary

4b. For each identified person: "Is [name] currently receiving means-tested benefits?" (Yes / No / Not sure)

- YES or Not sure, flag for manual review.

This is the critical trigger. An outright inheritance above ~£16,000 disqualifies them from Universal Credit and similar benefits
Data needed: Person.means_tested_benefits (boolean)
Why it matters for the trigger: Person.is_disabled = TRUE AND Person.means_tested_benefits = TRUE THEN: Flag for manual review and let user know we'll be in touch

<style>#mermaid-1772551073799{font-family:"trebuchet ms",verdana,arial;font-size:16px;fill:#ccc;}#mermaid-1772551073799 .error-icon{fill:#a44141;}#mermaid-1772551073799 .error-text{fill:#ddd;stroke:#ddd;}#mermaid-1772551073799 .edge-thickness-normal{stroke-width:2px;}#mermaid-1772551073799 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-1772551073799 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-1772551073799 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-1772551073799 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-1772551073799 .marker{fill:lightgrey;}#mermaid-1772551073799 .marker.cross{stroke:lightgrey;}#mermaid-1772551073799 svg{font-family:"trebuchet ms",verdana,arial;font-size:16px;}#mermaid-1772551073799 .label{font-family:"trebuchet ms",verdana,arial;color:#ccc;}#mermaid-1772551073799 .label text{fill:#ccc;}#mermaid-1772551073799 .node rect,#mermaid-1772551073799 .node circle,#mermaid-1772551073799 .node ellipse,#mermaid-1772551073799 .node polygon,#mermaid-1772551073799 .node path{fill:#1f2020;stroke:#81B1DB;stroke-width:1px;}#mermaid-1772551073799 .node .label{text-align:center;}#mermaid-1772551073799 .node.clickable{cursor:pointer;}#mermaid-1772551073799 .arrowheadPath{fill:lightgrey;}#mermaid-1772551073799 .edgePath .path{stroke:lightgrey;stroke-width:1.5px;}#mermaid-1772551073799 .flowchart-link{stroke:lightgrey;fill:none;}#mermaid-1772551073799 .edgeLabel{background-color:hsl(0,0%,34.4117647059%);text-align:center;}#mermaid-1772551073799 .edgeLabel rect{opacity:0.5;background-color:hsl(0,0%,34.4117647059%);fill:hsl(0,0%,34.4117647059%);}#mermaid-1772551073799 .cluster rect{fill:hsl(180,1.5873015873%,28.3529411765%);stroke:rgba(255,255,255,0.25);stroke-width:1px;}#mermaid-1772551073799 .cluster text{fill:#F9FFFE;}#mermaid-1772551073799 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial;font-size:12px;background:hsl(20,1.5873015873%,12.3529411765%);border:1px solid rgba(255,255,255,0.25);border-radius:2px;pointer-events:none;z-index:100;}#mermaid-1772551073799:root{--mermaid-font-family:sans-serif;}#mermaid-1772551073799:root{--mermaid-alt-font-family:sans-serif;}#mermaid-1772551073799 flowchart{fill:apa;}</style>
