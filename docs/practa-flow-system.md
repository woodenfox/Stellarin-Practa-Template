# Practa / Flow System — Requirements & Data Model

## 1. Conceptual Overview

The app is evolving into a **composable system of wellbeing building blocks**.
Users engage with small atomic actions (**Practa**) that can be chained together into **Flows**, which are then scheduled into parts of their day using **Schedule Groups**.

The system supports **context-aware chaining**, where later Practa can personalize themselves based on outputs from earlier Practa, typically using GPT-based processing.

---

## 2. Core Primitives (Authoritative Definitions)

### 2.1 Practa (Atomic Unit)

A **Practa** is the smallest executable unit in the system.

A Practa:

* Represents a single guided action or experience
* May collect **user input**
* May generate **AI output**
* May consume **context** from a previous Practa
* Does **not** know about the entire Flow, only its immediate context

Examples:

* Inkblot Practa
* Journal Practa
* Meditation Practa
* Reading Practa
* AI Dialogue Practa

---

### 2.2 Flow (Ordered Chain of Practa)

A **Flow** is an ordered sequence of Practa.

A Flow:

* Defines execution order
* Manages passing context between Practa
* May contain **1 or more Practa**
* Treats a single Practa as a valid Flow of length 1

Flows are the primary unit of meaning and personalization.

Examples:

* Morning Flow
* Evening Winddown Flow
* Learn & Integrate Flow
* Quick Reset Flow (1 Practa)

---

### 2.3 Schedule Group (Time-Based Container)

A **Schedule Group** represents a time-based grouping of Flows.

A Schedule Group:

* Answers *"when does this happen?"*
* Contains one or more Flows
* Does **not** pass context between Flows
* Resets personalization boundaries

Examples:

* My Morning
* Midday Reset
* My Evening

---

## 3. Execution Rules & Constraints

### Rule 1: Practa Are Context-Local

* Practa receive context only from the **immediately previous Practa**
* Practa do not access global history or future Practa

### Rule 2: Flows Handle Context Passing

* Context passing is a responsibility of the Flow engine
* Practa do not communicate directly with each other

### Rule 3: Schedule Groups Reset Context

* Context does **not** pass between Flows
* Each Flow starts with a clean context state

---

## 4. Practa Context Passing (Core Engine)

Flows pass a structured **PractaContext** object from one Practa to the next.

This enables:

* Personalization
* Reflection
* Transformation
* AI-generated adaptations

---

## 5. PractaContext Schema (Proposed)

### 5.1 Base Schema

```ts
PractaContext {
  flowId: string
  practaIndex: number
  previous?: PreviousPractaContext
}
```

---

### 5.2 Previous Practa Context

```ts
PreviousPractaContext {
  practaId: string
  practaType: string
  content?: PractaContent
  metadata?: Record<string, any>
}
```

---

### 5.3 Practa Content

```ts
PractaContent {
  type: "text" | "image"
  value: string  // text content or image URI/base64
}
```

---

## 6. Field Definitions & Intent

### `flowId`

* Unique identifier for the current Flow execution
* Used for logging, analytics, and debugging

---

### `practaIndex`

* Zero-based index of the current Practa within the Flow
* Enables ordering, replay, and step-aware UI

---

### `previous` (optional)

Present only if this is **not** the first Practa in the Flow.

Represents the *immediate* prior Practa's output.

---

### `previous.practaId`

* Unique identifier of the previous Practa instance

---

### `previous.practaType`

* Type discriminator (e.g. `"journal"`, `"meditation"`, `"inkblot"`)
* Used by downstream Practa to decide how to interpret input

---

### `previous.content` (optional)

* Flexible content from the previous Practa
* Can be text or image, with type discriminator
* Examples:

  * `{ type: "text", value: "Two shapes pulling apart" }`
  * `{ type: "text", value: "I feel tension between..." }` (journal entry)
  * `{ type: "image", value: "data:image/png;base64,..." }` (generated visual)

---

### `previous.metadata` (optional)

* Flexible structured data for machine-readable outputs
* Examples:

  * `{ themes: ["uncertainty", "pressure"] }`
  * `{ duration: 420 }`
  * `{ emotionTags: ["calm", "open"] }`
  * `{ source: "user" | "ai" | "system" }` (origin tracking if needed)

---

## 7. Practa Behavior Patterns

Each Practa may choose to:

1. **Ignore context**

   * Fixed meditation
   * Static reading

2. **Reflect context**

   * "Based on what you just wrote…"

3. **Transform context**

   * Journal → theme extraction
   * Inkblot → symbolic language

4. **Personalize from context**

   * Journal → custom meditation
   * Reading → tailored reflection prompt

GPT is typically used to:

* Translate raw user input into structured metadata
* Generate personalized content based on prior Practa outputs

---

## 8. Example Flow Execution

### Example: Inkblot → Journal → Meditation

**Practa 1: Inkblot**

```ts
{
  content: { type: "text", value: "Two shapes pulling apart" },
  metadata: { symbols: ["separation", "tension"] }
}
```

**Practa 2: Journal**

* Receives previous context
* GPT generates a custom prompt using symbols
* Outputs journal text

**Practa 3: Meditation**

* Receives journal content
* GPT generates a personalized meditation script

---

## 9. Design Principles (Non-Negotiable)

* Practa are **reusable**
* Flows are **composable**
* Context passing is **explicit**
* AI is a **translator**, not a controller
* Personalization is **local, not global**

---

## 10. Future Extensions (Not Required for v1)

These are explicitly out of scope for now but supported by the model:

* Practa capability declarations (`produces`, `consumes`)
* Smart Flow suggestions
* Cross-Flow memory (opt-in only)
* Flow analytics & insights

---

## 11. Summary

* **Practa** = atomic actions
* **Flows** = ordered meaning + personalization
* **Schedule Groups** = time-based organization
* **PractaContext** = the personalization engine

This architecture is intentionally simple at the edges and powerful at the center.
