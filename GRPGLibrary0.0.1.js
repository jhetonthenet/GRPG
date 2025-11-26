/* ========================================================================== */
/* G RPG LIBRARY - CORE DATA STRUCTURE                                        */
/* ========================================================================== */
/*
This file defines the *shape* of the G RPG data library that all future apps
will read from.

GOALS:
- Single source of truth for all G RPG data (races, classes, abilities, etc.)
- Stable IDs and schemas so we can safely reference things across apps
- Tagging system that makes filtering/searching easy in apps
- Very clear comment blocks so future-you knows exactly what each part is

CONVENTIONS:
- All IDs are lowercase-with-dashes and never change once published.
- All references between records use IDs, never display names.
- "tags" is always an array of strings for filtering and grouping.
- All rules text lives in "rules" / "effects" fields, NEVER in comments.
*/

/* ========================================================================== */
/* TAG DEFINITIONS                                                            */
/* ========================================================================== */
/*
TAG SYSTEM OVERVIEW
-------------------
All content may have tags in a flat string array, for example:

  tags: ["type:race", "faction:wardens", "realm:surface", "role:martial"]

Tags should generally look like:
  "<category>:<value>"

This lets us filter consistently, e.g.:
- All Wardens stuff ⇒ tag includes "faction:wardens"
- All underground content ⇒ tag includes "realm:underground"
- All races ⇒ tag includes "type:race"

Below is a central dictionary describing what each tag *means*.
This is documentation; apps don’t have to load it at runtime, but it’s useful
for tools and for humans.
*/

const TAG_DEFINITIONS = {
  /* ----- Type tags: what KIND of thing is this? ----- */
  "type:race": {
    category: "type",
    description: "Marks a record as a Race (e.g., Tettari, Feyrdrin, Wildeman).",
  },
  "type:class": {
    category: "type",
    description: "Marks a record as a Class (e.g., Ranger, Warden, Arcanist).",
  },
  "type:origin": {
    category: "type",
    description: "Marks a record as an Origin / background-style record.",
  },
  "type:circle": {
    category: "type",
    description: "Marks a record as a Circle (GRPG magic / specialty groups).",
  },
  "type:trait": {
    category: "type",
    description: "Marks a record as an Adventuring Trait (passive bonuses).",
  },
  "type:ability": {
    category: "type",
    description: "Marks a record as an Adventuring Ability (active moves).",
  },
  "type:item": {
    category: "type",
    description: "Marks a record as an item (weapon, armor, gear, etc.).",
  },
  "type:profession": {
    category: "type",
    description: "Marks a record as a Profession / non-combat role.",
  },

  /* ----- Faction / alignment tags ----- */
  "faction:wardens": {
    category: "faction",
    description: "Belongs to or is strongly associated with the Wardens.",
  },
  "faction:underground": {
    category: "faction",
    description: "Tied to underground-focused groups, cultures, or powers.",
  },
  "faction:neutral": {
    category: "faction",
    description: "Deliberately neutral / unaffiliated with major factions.",
  },

  /* ----- Realm / environment tags ----- */
  "realm:surface": {
    category: "realm",
    description: "Primarily associated with surface regions of Daelinar.",
  },
  "realm:underground": {
    category: "realm",
    description: "Primarily associated with subterranean regions.",
  },
  "realm:astral": {
    category: "realm",
    description: "Associated with astral / Weave / fleet contexts.",
  },

  /* ----- Role / gameplay function tags ----- */
  "role:martial": {
    category: "role",
    description: "Focuses on physical combat, weapons, toughness.",
  },
  "role:skirmisher": {
    category: "role",
    description: "Mobile, hit-and-run, often ranged or agile melee.",
  },
  "role:caster": {
    category: "role",
    description: "Primarily interacts with the Weave / magic systems.",
  },
  "role:support": {
    category: "role",
    description: "Buffs allies, debuffs enemies, or controls the field.",
  },
  "role:utility": {
    category: "role",
    description: "Primarily provides exploration, social, or non-combat tools.",
  },

  /* ----- Power / rarity / progression tags ----- */
  "tier:basic": {
    category: "tier",
    description: "Starting-level content, safe for new characters.",
  },
  "tier:advanced": {
    category: "tier",
    description: "Mid-level power, requires some character progression.",
  },
  "tier:elite": {
    category: "tier",
    description: "High-level / rare content; powerful or campaign-defining.",
  },
  "status:core": {
    category: "status",
    description: "Core rulebook content; stable and part of the main game.",
  },
  "status:playtest": {
    category: "status",
    description: "Experimental content; subject to change or removal.",
  },

  /* ----- Source / metadata tags (optional helpers) ----- */
  "source:core-rulebook": {
    category: "source",
    description: "Published in the main GRPG Core Rulebook.",
  },
  "source:supplement:wardens": {
    category: "source",
    description: "From a Wardens-focused supplement or expansion.",
  },
};

/* ========================================================================== */
/* SHARED CORE SHAPES (DOCUMENTATION-ONLY)                                    */
/* ========================================================================== */
/*
These are *documentation comments* describing the shared shape of records.

BASE RECORD FIELDS (common to almost everything)
------------------------------------------------
- id:          string  | Permanent, machine-readable ID (e.g., "race-tettari").
- name:        string  | Human-readable name (e.g., "Tettari").
- type:        string  | High-level type (e.g., "race", "class", "ability").
- summary:     string  | 1–2 sentence quick description.
- description: string  | Longer lore text or detailed explanation.
- tags:        string[]| Filtering tags (see TAG_DEFINITIONS).
- source: {
    book:      string  | "Core Rulebook", "Wardens Supplement", etc.
    page?:     number  | Optional page number in that source.
  }
- version: {
    major:     number  | Major changes that might break backwards compatibility.
    minor:     number  | Small tweaks, balance changes, clarifications.
  }
- createdAt:   string  | ISO date string of first creation.
- updatedAt:   string  | ISO date string of last update.

Each category then extends this with category-specific fields.
We don’t enforce this in code here, but we FOLLOW it when creating entries.
*/

/* ========================================================================== */
/* LIBRARY ROOT OBJECT                                                        */
/* ========================================================================== */
/*
GRPG_LIBRARY is the single exported object that contains all structured data.

Top-level shape:
{
  meta: { ... },
  tags: { ... },
  races: { ... },
  classes: { ... },
  origins: { ... },
  circles: { ... },
  traits: { ... },
  abilities: { ... },
  items: { ... },
  professions: { ... },
  // future categories: monsters, encounters, locations, etc.
}
*/

window.GRPG_LIBRARY = {
  /* ------------------------------------------------------------------------ */
  /* META                                                                     */
  /* ------------------------------------------------------------------------ */
  meta: {
    schemaVersion: "1.0.0",
    dataVersion: "0.1.0",
    lastUpdated: "2025-11-24",
    notes: "Initial skeleton for the G RPG Library. Fill categories gradually.",
  },

  /* ------------------------------------------------------------------------ */
  /* TAGS                                                                     */
  /* ------------------------------------------------------------------------ */
  tags: TAG_DEFINITIONS,

  /* ------------------------------------------------------------------------ */
  /* RACES                                                                    */
  /* ------------------------------------------------------------------------ */
  races: {
    "race-tettari": {
      id: "race-tettari",
      type: "race",
      name: "Tettari",
      summary: "Small, resilient survivors attuned to the broken ley-beasts.",
      description:
        "The Tettari are nimble survivors shaped by the chaos of ruptured ley-lines. Their sharp eyes and steady hands make them exceptional archers.",
      tags: ["type:race", "realm:surface", "role:skirmisher", "status:core"],
      source: { book: "Core Rulebook", page: 42 },
      version: { major: 1, minor: 0 },
      createdAt: "2025-11-24",
      updatedAt: "2025-11-24",
      mechanics: {
        attributeMods: { agility: 2, willpower: 1 },
        baseSpeed: 6,
        senses: ["low-light vision"],
        innateTraits: ["trait-tettari-survivor"],
        innateAbilities: [],
      },
      lore: {
        homeland: "Shattered Wilds of Daelinar",
        cultureNotes:
          "Tettari communities prize agility, marksmanship, and clever trickery. Many are drawn into the Wardens as scouts.",
        appearanceNotes:
          "Short and lean, with bright eyes that seem to track motion before it happens.",
      },
    },
  },

  /* ------------------------------------------------------------------------ */
  /* CLASSES                                                                  */
  /* ------------------------------------------------------------------------ */
  classes: {
    "class-warden": {
      id: "class-warden",
      type: "class",
      name: "Warden",
      summary: "Guardian of the broken wilds, balancing steel, instinct, and Weave.",
      description:
        "Wardens patrol the fractures of Daelinar, hunting warped beasts and safeguarding settlements. They blend martial prowess with attunement to the land and the Weave.",
      tags: ["type:class", "faction:wardens", "role:martial", "role:utility", "status:core"],
      source: { book: "Core Rulebook", page: 80 },
      version: { major: 1, minor: 0 },
      createdAt: "2025-11-24",
      updatedAt: "2025-11-24",
      mechanics: {
        primaryRoles: ["role:martial", "role:utility"],
        hitDie: "d10",
        resourceModel: "vigilance",
        startingTraits: ["trait-hunter-sense"],
        startingAbilities: ["ability-mark-prey"],
        progressionNotes:
          "Wardens gain new ways to control terrain, hunt ley-twisted creatures, and protect allies as they advance.",
      },
    },
  },

  /* ------------------------------------------------------------------------ */
  /* ORIGINS                                                                  */
  /* ------------------------------------------------------------------------ */
  origins: {},

  /* ------------------------------------------------------------------------ */
  /* CIRCLES                                                                  */
  /* ------------------------------------------------------------------------ */
  circles: {},

  /* ------------------------------------------------------------------------ */
  /* TRAITS (Adventuring Traits / Passives)                                   */
  /* ------------------------------------------------------------------------ */
  traits: {
    "trait-tettari-survivor": {
      id: "trait-tettari-survivor",
      type: "trait",
      name: "Tettari Survivor",
      summary: "You’re hard to kill and harder to corner.",
      description:
        "You’ve learned to read danger and slip away before it closes its jaws. Tettari often survive what would annihilate others.",
      tags: ["type:trait", "tier:basic", "realm:surface", "status:core"],
      source: { book: "Core Rulebook", page: 43 },
      version: { major: 1, minor: 0 },
      createdAt: "2025-11-24",
      updatedAt: "2025-11-24",
      mechanics: {
        rulesText:
          "When you would be reduced to 0 vitality by a single hit, you may instead drop to 1 vitality once per rest. In addition, you gain advantage on checks to notice ambushes or environmental hazards.",
      },
    },
  },

  /* ------------------------------------------------------------------------ */
  /* ABILITIES (Adventuring Abilities / Active Moves)                         */
  /* ------------------------------------------------------------------------ */
  abilities: {
    "ability-mark-prey": {
      id: "ability-mark-prey",
      type: "ability",
      name: "Mark Prey",
      summary: "Single out a target and hunt them relentlessly.",
      description:
        "You fix your attention on a single foe, reading their tells and exploiting every misstep.",
      tags: [
        "type:ability",
        "role:skirmisher",
        "role:martial",
        "tier:basic",
        "status:core",
      ],
      source: { book: "Core Rulebook", page: 81 },
      version: { major: 1, minor: 0 },
      createdAt: "2025-11-24",
      updatedAt: "2025-11-24",
      mechanics: {
        actionType: "action",
        range: "line of sight",
        duration: "scene",
        target: "one creature you can see",
        rulesText:
          "Choose a creature you can see and mark it as your prey. While the mark lasts, you gain a bonus to checks and attacks made to track, pursue, or harm that creature. If you mark a new target, the old mark ends.",
      },
    },
  },

  /* ------------------------------------------------------------------------ */
  /* ITEMS                                                                    */
  /* ------------------------------------------------------------------------ */
  items: {},

  /* ------------------------------------------------------------------------ */
  /* PROFESSIONS                                                              */
  /* ------------------------------------------------------------------------ */
  professions: {},
};
