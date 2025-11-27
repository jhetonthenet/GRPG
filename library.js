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
    description: "Marks a record as a Race.",
  },
  "type:class": {
    category: "type",
    description: "Marks a record as a Class.",
  },
    "type:circle": {
    category: "type",
    description: "Marks a record as a Circle.",
  },
  "type:origin": {
    category: "type",
    description: "Marks a record as an Origin.",
  },
  "type:trait": {
    category: "type",
    description: "Marks a record as an Attribute or an Adventuring Trait (passives).",
  },
  "type:ability": {
    category: "type",
    description: "Marks a record as a Combat or Adventuring Ability.",
  },
  "type:item": {
    category: "type",
    description: "Marks a record as an item (weapon, armor, gear, etc.).",
  },
  "type:profession": {
    category: "type",
    description: "Marks a record as a Profession / non-combat role.",
  },
    "type:condition": {
    category: "type",
    description: "Marks a record as a Status Condition.",
  }
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
  tags: { ... },
  races: { ... },
  classes: { ... },
  origins: { ... },
  circles: { ... },
  traits: { ... },
  abilities: { ... },
  items: { ... },
  professions: { ... },
  conditions: { ... },
  // future categories: monsters, encounters, locations, etc.
}

CONVENTIONS (GLOBAL)
--------------------
1. FIXED VALUES
   - Standard keys (e.g., strength, agility, fireResistance) represent fixed,
     always-applied bonuses or data.

2. VIRTUAL / FLOATING VALUES
   - Certain keys inside mechanic blocks (commonly inside attributeMods) act as
     *tokens* that the character builder must interpret rather than directly apply.
   - Examples:
       anyAttribute: 3          → +3 to any attribute chosen by the player.
       anotherAttribute: 1      → +1 to a different attribute than the one chosen
                                 for "anyAttribute".
       anyOffenseOrDefense_A: 5 → +5% to any offense/defense stat, but part of a
                                 mutually exclusive choice group (see below).

3. MUTUALLY EXCLUSIVE CHOICE GROUPS
   - Keys ending with suffixes like "_A", "_B", "_C", etc. belong to choice groups.
   - All keys sharing the same suffix letter represent a single "choose one of:"
     selection made during character creation.
   - Example:
       anyOffenseOrDefense_A: 5
       coldResistance_A: 15
     These form a group A → player chooses exactly one.

   - Additional groups can be defined:
       *_A → first choice group
       *_B → second choice group
       *_C → third choice group
     (Used only when a race/class/etc. contains multiple independent choice sets.)

4. DATA MODEL RESPONSIBILITIES
   - The library stores these virtual/choice keys as-is, without computing results.
   - The library viewer may translate virtual keys to readable text, but does not
     make choices for the player.
   - The character builder interprets virtual keys and group suffixes to:
       • present choice dialogs to the player,
       • enforce constraints (e.g., “anotherAttribute” must differ from “anyAttribute”),
       • resolve selected bonuses into final applied stats.

These conventions allow the game data to stay compact and stable, while giving
the character builder enough structure to implement flexible or branching bonuses.
*/

const GRPG_LIBRARY = {

  /* ------------------------------------------------------------------------ */
  /* TAGS                                                                     */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - A mirror or subset of TAG_DEFINITIONS that can be shipped with apps if
    needed. You can keep this in sync with TAG_DEFINITIONS, or leave this
    empty in production and only use TAG_DEFINITIONS for docs.

  SHAPE:
  {
    [tagName: string]: {
      category: string;
      description: string;
    }
  }
  */
  tags: TAG_DEFINITIONS,

  /* ------------------------------------------------------------------------ */
  /* RACES                                                                    */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Playable species in G RPG (e.g., Tettari, Feyrdrin, Wildeman).

  SHAPE:
  races: {
    [raceId: string]: {
      id:          string;
      type:        "race";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];

      // GAME MECHANICS
      mechanics: {
        attributeMods?: { [attributeId: string]: number };  // e.g. { agility: +2, willpower: +2, dodge: +3 }
        baseSpeedFeet?: number;                             // e.g. 40
        innateTraits?: string[];                            // trait IDs
        innateAbilities?: string[];                         // ability IDs granted by the race
      };
    }
  }
  */
  races: {
    "race-tettari": {
      id: "race-tettari",
      type: "race",
      name: "Tettari",
      summary: "Short, quick, and warm-hearted humanoids known for hospitality and nimble reflexes.",
      description:
        "Tettari are a shorter race of quick and nimble humanoids, typically standing between 4 and 5 feet tall. Their complexion ranges from light blue, to dark blue, to light purple. They have large, flat noses often tinged with pink and usually wear their hair long and thick. Many male Tettari have wild hair that runs directly into their beards, but their facial hair notably does not include mustaches, further emphasizing their noses. Tettari tend to be warm, joyous, and passionate about people. They are known for their hospitality and welcoming communities, often living in communal homes and shared spaces.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { agility: 2, willpower: 2, dodgeChance: 5 },
        baseSpeedFeet: 40,
        innateTraits: [],
        innateAbilities: ["ability-tettari-blink", "ability-tettari-stew"],
      },
    },

    "race-bartusa": {
      id: "race-bartusa",
      type: "race",
      name: "Bartusa",
      summary: "Large, powerful warriors with deep honor traditions and reinforced cranial ridges.",
      description:
        "Bartusa are large and powerful. They stand between 6 and 7 feet tall. Bartusa have broad shoulders that often make their heads look hunched over. Their skin ranges from deep purple to a dark brown color. Bartusa have reinforced cranial ridges on their foreheads, which often can extend into horn-like structures. Many people see Bartusa as a warrior race, however they see themselves as much more. The Bartusa have a strict sense of honor. Their society honors their warriors in highest regard, but still value all other aspects of their society, viewing them as necessary supporting functions to the warrior class. Bartusa and Tettari have become close allies as they compliment each other well in a society, Tettari caring for the town and enabling the honored warrior class of Bartusa to protect the community.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { strength: 3, fortitude: 1, parryChance: 5 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-unstoppable-charge", "ability-word-of-honor"],
      },
    },
    "race-astrellidari": {
      id: "race-astrellidari",
      type: "race",
      name: "Astrellidari",
      summary: "Cosmic-featured humanoids with deep arcane intuition and stellar origins.",
      description:
        "Astrellidari are a mystical race of humanoids, said to originate from amongst the cosmos. Standing between 5 and 6 feet tall, these sleek fine featured individuals have a dark blue skin, with small beads of light across their skin both of which are reminiscent of the night’s sky. Their hair is a shiny platinum white, and their eyes usually burn with a single color, often yellow, white, or purple. Astrellidari are an intellectual race of people, who value reason and logic, and tend to show interest in matters of Arcane as they seem to have a connection to the Arcane elements. Astrellidari often see themselves as superior to other creatures, seeing themselves as descendants of the great cosmos itself.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { willpower: 3, agility: 1, arcaneResistance: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-touch-of-the-cosmos", "ability-arcane-intuition"],
      },
    },
    "race-wulkaran": {
      id: "race-wulkaran",
      type: "race",
      name: "Wulkaran",
      summary: "Large, fur-covered mountain dwellers known for battle rage and unusual rituals.",
      description:
        "The Wulkaran are large hairy humanoids. They stand between 6 and 7 feet tall, and are covered head to toe in long thick hair. While Wulkaran are strong and can be fierce warriors and are known for their rage in battle, however they often have a contemplative side to them. They tend to be superstitious and have unusual traditions or rituals in their culture that outsiders don't fully understand. Their thick fur has enabled them to comfortably live in frigid and mountainous regions. Some Wulkaran are nomadic and travel in tribes, while others will build isolated strongholds.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { strength: 2, fortitude: 2, coldResistance: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-wulkaran-rage", "ability-wulkaran-senses"],
      },
    },

    "race-ignium": {
      id: "race-ignium",
      type: "race",
      name: "Ignium",
      summary: "Rock-skinned humanoids fueled by inner fire and passionate tempers.",
      description:
        "The Ignium people tend to be normal humanoid size and shape with an elemental power within them. They have patches of rocky skin across their bodies, some even have their entire body covered in this rocky flesh. Deep from within them is a fiery light that burns and begins to show through cracks in their rocky skin. These people stand between 5 and 6 feet tall, and often live near deserts or towards the warmer climates. Ignium can lead normal lives and are often a passionate race of people. Many Ignium towns are coastal, fueled by sailing and fishing, others are desert oases. Ignimum are often feared by other races, due to their association with fire, and short tempers to match.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { fortitude: 2, willpower: 2, fireResistance: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-ignis-unleashed", "ability-fire-in-their-eye"],
      },
    },

    "race-animation": {
      id: "race-animation",
      type: "race",
      name: "Animation",
      summary: "Living constructs animated by various Circles, diverse in form and function.",
      description:
        "Animations are a varied people, that have a common origin, but varied traits based on their physical make-up. Through various means, constructs have been brought to life through different Circles, and collectively people refer to them as Animations.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { fortitude: 2, strength: 1, agility: 1, bodilyFortification: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-living-touch", "ability-spark-of-life"],
      },
    },

    "race-endari": {
      id: "race-endari",
      type: "race",
      name: "Endari",
      summary: "Tall, tentacled hunters from dense forests with deadly agility.",
      description:
        "Endari are a slim tall race that stands around 6 feet tall. Endari notably have thin tentacles in place of their hair which enhance their senses. Endari typically live in thick forests or jungles. Endari are known for being incredibly agile hunters. Endari culture tends to be harsh and tend towards “every man for themselves” mentality.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { agility: 3, willpower: 1, criticalChance: 5 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-aggressive-surge", "ability-endari-tentacles"],
      },
    },

    "race-feyrdrin": {
      id: "race-feyrdrin",
      type: "race",
      name: "Feyrdrin",
      summary: "Plant-skinned folk of petals and antennae who revere nature as kin.",
      description:
        "A people of fairytales and bedtime stories, the Feyrdrin were considered a myth until they emerged into the public eye a few decades ago. These folk can be identified easily by their plant-like skin, sprout-like antennae, and drooped ears. Where one might expect hair, Feyrdrin instead sprout brightly colored petals like those of a flower. Most Feyrdrin revere nature above all else, believing that plants are Feyrdrin that have not yet come to be.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { willpower: 2, agility: 1, fortitude: 1, natureResistance: 15 },
        baseSpeedFeet: 40,
        innateTraits: [],
        innateAbilities: ["ability-barkskin", "ability-feyrdrin-footing"],
      },
    },

    "race-geodran": {
      id: "race-geodran",
      type: "race",
      name: "Geodran",
      summary: "Stone- and crystal-skinned giants, peaceful and deeply attuned to earth.",
      description:
        "Geodran are large humanoids who have either stone or crystalline skin. These fearsome people tend to be peaceful and slow to violence. Geodran tend to speak and think slowly and intentionally. Geodran are naturally attuned to the earth, and often roam highlands and mountains in herds.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { fortitude: 2, strength: 1, willpower: 1, armor: 5 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-earth-tremor", "ability-sensing-tremor"],
      },
    },

    "race-omr": {
      id: "race-omr",
      type: "race",
      name: "Omr",
      summary: "Blue-skinned, white-eyed cave dwellers steeped in shadow and rigid order.",
      description:
        "Omr are a strange race of humanoids that live deep below the surface of the earth, usually in caves or caverns. They have blue skin and completely white eyes that aid in their ability to see and live in the darkness of underground. They have adapted abilities and affinities for shadow from their time in the darkness. Omr culture tends to be cold and strict, veiled in layers of tradition and order.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { willpower: 2, agility: 1, strength: 1, shadowResistance: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-creeping-darkness", "ability-omr-sight"],
      },
    },

    "race-wildeman": {
      id: "race-wildeman",
      type: "race",
      name: "Wildeman",
      summary: "Broad, animal-featured folk with wildly varied origins and forms.",
      description:
        "Wildeman are a broad categorized race of humanoid people with animalistic features. Being a people of such diverse origins and features, they are prevalent in all sorts of biomes or kingdoms.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { anyAttribute: 3, anotherAttribute: 1, anyOffenseOrDefense_A: 5, coldResistance_A: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-primal-roar-novice", "ability-wild-form"],
      },
    },

    "race-thulhan": {
      id: "race-thulhan",
      type: "race",
      name: "Thulhan",
      summary: "Tentacled, psychic-leaning outcasts descended from a fallen starborn power.",
      description:
        "Thulhan are slim humanoids, with an elongated cranial ridge, and tentacles over their mouth. Rumored to have descended from a great monstrosity from the stars, Thulan are often misunderstood, distrusted, and treated as outsiders in society. Historically Thulan rivaled Astrellidari as a great race of intelligent and innovative people. This rivalry sparked many disputes between the races until finally the Thulan fell from power and were scattered. Thulhan's great Intelligence can even manifest in spurts of Psychic abilities.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { willpower: 3, fortitude: 1, wardChance: 5 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-seed-of-paranoia", "ability-thul-speech"],
      },
    },

    "race-jackal": {
      id: "race-jackal",
      type: "race",
      name: "Jackal",
      summary: "Tall, lightly furred tricksters tied to sun, death, and superstition.",
      description:
        "Jackal are tall slender humanoids, who are lightly furred and have narrow dog-like faces. Jackal often are superstitious and will draw inspiration from the sun, moon, or other natural elements. They are also renowned tricksters, and are said to be descended from a god of death and the god of the sun.",
      tags: ["type:race"],
      mechanics: {
        attributeMods: { willpower: 2, agility: 1, strength: 1, lightResistance: 15 },
        baseSpeedFeet: 30,
        innateTraits: [],
        innateAbilities: ["ability-sun-ray", "ability-deaths-guise"],
      },
    },
  },

  /* ------------------------------------------------------------------------ */
  /* CLASSES                                                                  */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Character archetypes / roles (e.g., Warden, Ranger, Arcanist).

  SHAPE:
  classes: {
    [classId: string]: {
      id:          string;
      type:        "class";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];

      // RULES HOOKS

    }
  }
  */
  classes: {},

  /* ------------------------------------------------------------------------ */
  /* ORIGINS                                                                  */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Background-style pieces that define where a character comes from.

  SHAPE:
  origins: {
    [originId: string]: {
      id:          string;
      type:        "origin";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];

      mechanics: {
        startingTrait?: string;       // trait ID
        startingAbility?: string;     // ability ID
        skillBonuses?: { [skillId: string]: number };
      };
    }
  }
  */
  origins: {},

  /* ------------------------------------------------------------------------ */
  /* CIRCLES                                                                  */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Magical / specialty circles in GRPG, often connected to the Weave.

  SHAPE:
  circles: {
    [circleId: string]: {
      id:          string;
      type:        "circle";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];
      source:      { book: string; page?: number; };
      version:     { major: number; minor: number; };
      createdAt:   string;
      updatedAt:   string;

      mechanics: {
        focusStat?: string;           // e.g. "willpower"
        signatureAbilities?: string[];// ability IDs
      };
    }
  }
  */
  circles: {},

  /* ------------------------------------------------------------------------ */
  /* TRAITS (Adventuring Traits / Passives)                                   */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Passive effects / always-on bonuses.

  SHAPE:
  traits: {
    [traitId: string]: {
      id:          string;
      type:        "trait";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];
      source:      { book: string; page?: number; };
      version:     { major: number; minor: number; };
      createdAt:   string;
      updatedAt:   string;

      mechanics: {
        // Free-form, but try to use consistent wording and structure so
        // apps can eventually parse some of it if needed.
        rulesText: string;
      };
    }
  }
  */
  traits: {},

/* ------------------------------------------------------------------------ */
/* ABILITIES (Adventuring Abilities / Active Moves)                         */
/* ------------------------------------------------------------------------ */
/*
DESCRIBES:
- Active moves players choose and trigger (combat, exploration, social, etc.).
- Includes racial abilities, class abilities, circle abilities, and other moves.

SHAPE:
abilities: {
  [abilityId: string]: {
    id:          string;
    type:        "ability";
    name:        string;
    summary:     string;     // short 1–2 line explanation of what the move does
    description: string;     // optional flavor text / narrative description
    tags:        string[];   // e.g. ["type:ability", "category:combat", "source:race-tettari"]

    // SINGLE SOURCE OF THIS ABILITY (race, class, circle, origin, etc.)
    grantedBy?: {
      type: "race" | "class" | "circle" | "origin" | "trait" | "item";
      id:   string;          // e.g. "race-tettari"
    };

    mechanics: {
      category?: "combat" | "adventuring" | "social" | "exploration" | "other";

      // ACTION ECONOMY & COST
      cost?:        string;  // e.g. "No Cost", "1 Stamina", "2 Focus"
      actionType?:  string;  // e.g. "Action", "Minor Action", "Reaction", "Passive"
      range?:       string;  // e.g. "Self", "Melee", "30 feet", "20 ft Cone"
      target?:      string;  // e.g. "one creature", "all creatures in a 20 ft radius"
      duration?:    string;  // e.g. "Instant", "Until the start of your next turn", "3 Turns"
      cooldown?:    string;  // e.g. "6 Turns", "Once per day"

      // RULES TEXT
      rulesText:    string;  // full rules explanation as written on the card / rulebook
    };
  }
}
*/

  abilities: {

/* |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*          R A C E S                                                 */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */



    /* ------------------------------------------------------------------ */
    /* TETTARI                                                            */
    /* ------------------------------------------------------------------ */

    "ability-tettari-blink": {
      id: "ability-tettari-blink",
      type: "ability",
      name: "Tettari Blink",
      summary: "Teleport yourself to a new location within 30 feet.",
      description: `Your perceived speed may be partially due to your limited ability to teleport. You can bend space to teleport to a new location within 30 feet.`,
      tags: ["type:ability", "category:combat", "source:race-tettari"],
      grantedBy: {
        type: "race",
        id: "race-tettari",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        rulesText: `Your perceived speed may be partially due to your limited ability to teleport. You can bend space to teleport to a new location within 30 feet.`,
      },
    },

    "ability-tettari-stew": {
      id: "ability-tettari-stew",
      type: "ability",
      name: "Tettari Stew",
      summary: "Prepare a stew that grants each ally an additional Bend Fate roll after rest.",
      description: `You have a skilled palette and sense for what could make for a good hearty stew, no matter where you seem to be. If you are able to find some provisions, you can turn them into a tasty stew, calming your allies and making them feel at home. Each ally who partakes can add an additional Bend Fate roll tomorrow after completing their rest,`,
      tags: ["type:ability", "category:adventuring", "source:race-tettari"],
      grantedBy: {
        type: "race",
        id: "race-tettari",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `You have a skilled palette and sense for what could make for a good hearty stew, no matter where you seem to be. If you are able to find some provisions, you can turn them into a tasty stew, calming your allies and making them feel at home. Each ally who partakes can add an additional Bend Fate roll tomorrow after completing their rest,`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* BARTUSA                                                            */
    /* ------------------------------------------------------------------ */

    "ability-unstoppable-charge": {
      id: "ability-unstoppable-charge",
      type: "ability",
      name: "Unstoppable Charge",
      summary: "Break free from hindering conditions and dash up to 15 feet.",
      description: `Your great force of will allows you to break from any Slow, Snare, or Restraint conditions, and dash up to 15 feet.`,
      tags: ["type:ability", "category:combat", "source:race-bartusa"],
      grantedBy: {
        type: "race",
        id: "race-bartusa",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Minor action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        rulesText: `Your great force of will allows you to break from any Slow, Snare, or Restraint conditions, and dash up to 15 feet.`,
      },
    },

    "ability-word-of-honor": {
      id: "ability-word-of-honor",
      type: "ability",
      name: "Word of Honor",
      summary: "Gain 1d6 when persuading after pledging your word.",
      description: `A Bartusa pledge is one acknowledged by all races, for their word is stone. Bartusa will only pledge their word if they are willing to die to back up their word. Breaking their word once pledged is seen as an ultimate disgrace to other Bartusa, resulting in their exile. Gain 1d6 to your adventuring pool when pledging your word in an attempt to persuade.`,
      tags: ["type:ability", "category:adventuring", "source:race-bartusa"],
      grantedBy: {
        type: "race",
        id: "race-bartusa",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `A Bartusa pledge is one acknowledged by all races, for their word is stone. Bartusa will only pledge their word if they are willing to die to back up their word. Breaking their word once pledged is seen as an ultimate disgrace to other Bartusa, resulting in their exile. Gain 1d6 to your adventuring pool when pledging your word in an attempt to persuade.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* ASTRELLIDARI                                                       */
    /* ------------------------------------------------------------------ */

    "ability-touch-of-the-cosmos": {
      id: "ability-touch-of-the-cosmos",
      type: "ability",
      name: "Touch of the Cosmos",
      summary: "Put a creature to sleep until your next turn as their mind wanders the stars.",
      description: `You touch a creature, unleashing your cosmic brilliance against their mind. They fall Asleep (MF) until the start of your next turn, as their mind wanders the stars. Resisted by Mental Fortification.`,
      tags: ["type:ability", "category:combat", "source:race-astrellidari"],
      grantedBy: {
        type: "race",
        id: "race-astrellidari",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Melee",
        cooldown: "6 Turn Cooldown",
        rulesText: `You touch a creature, unleashing your cosmic brilliance against their mind. They fall Asleep (MF) until the start of your next turn, as their mind wanders the stars. Resisted by Mental Fortification.`,
      },
    },

    "ability-arcane-intuition": {
      id: "ability-arcane-intuition",
      type: "ability",
      name: "Arcane Intuition",
      summary: "Gain 1d6 when identifying or interacting with Arcane-based magic.",
      description: `Astrellidari have an unusual connection to the Arcane. They often understand it far quicker than others. As such when encountering unknown arcane effects, they can often discover qualities about its origin or effects. Gain 1d6 in any attempt made to identify or interact with Arcane based magic.`,
      tags: ["type:ability", "category:adventuring", "source:race-astrellidari"],
      grantedBy: {
        type: "race",
        id: "race-astrellidari",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `Astrellidari have an unusual connection to the Arcane. They often understand it far quicker than others. As such when encountering unknown arcane effects, they can often discover qualities about its origin or effects. Gain 1d6 in any attempt made to identify or interact with Arcane based magic.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* WULKARAN                                                           */
    /* ------------------------------------------------------------------ */

    "ability-wulkaran-rage": {
      id: "ability-wulkaran-rage",
      type: "ability",
      name: "Wulkaran Rage",
      summary: "Enter a rage to gain an additional action used offensively.",
      description: `You burst into a rage, gaining an additional action on your turn that you must use to make an attack or use an offensive ability.`,
      tags: ["type:ability", "category:combat", "source:race-wulkaran"],
      grantedBy: {
        type: "race",
        id: "race-wulkaran",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Minor Action",
        range: "Melee",
        cooldown: "6 Turn Cooldown",
        rulesText: `You burst into a rage, gaining an additional action on your turn that you must use to make an attack or use an offensive ability.`,
      },
    },

    "ability-wulkaran-senses": {
      id: "ability-wulkaran-senses",
      type: "ability",
      name: "Wulkaran Senses",
      summary: "Gain 1d6 to Observation checks using hearing or smell.",
      description: `A Wulkaran has an enhanced sense of both hearing and smell. Observation checks that use either sense gains an additional 1d6.`,
      tags: ["type:ability", "category:adventuring", "source:race-wulkaran"],
      grantedBy: {
        type: "race",
        id: "race-wulkaran",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `A Wulkaran has an enhanced sense of both hearing and smell. Observation checks that use either sense gains an additional 1d6.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* IGNIUM                                                             */
    /* ------------------------------------------------------------------ */

    "ability-ignis-unleashed": {
      id: "ability-ignis-unleashed",
      type: "ability",
      name: "Ignis Unleashed",
      summary: "Deal Fire Damage equal to your Willpower pool to all enemies in a 20 ft cone.",
      description: `You unleash the fire deep within your core, dealing Willpower pool of Fire Damage to all enemies within a 20ft Cone.`,
      tags: ["type:ability", "category:combat", "source:race-ignium"],
      grantedBy: {
        type: "race",
        id: "race-ignium",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        rulesText: `You unleash the fire deep within your core, dealing Willpower pool of Fire Damage to all enemies within a 20ft Cone.`,
      },
    },

    "ability-fire-in-their-eye": {
      id: "ability-fire-in-their-eye",
      type: "ability",
      name: "Fire in Their Eye",
      summary: "Gain 1d6 to your Intuition pool when reading someone’s truthfulness or motives.",
      description: `The Ignium are exceptional at sensing the character of others. By looking deep into the eyes of an individual you have an enhanced sense to determine if they are telling the truth or hiding their motives. Gain 1d6 to your Intuition pool in relevant checks`,
      tags: ["type:ability", "category:adventuring", "source:race-ignium"],
      grantedBy: {
        type: "race",
        id: "race-ignium",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `The Ignium are exceptional at sensing the character of others. By looking deep into the eyes of an individual you have an enhanced sense to determine if they are telling the truth or hiding their motives. Gain 1d6 to your Intuition pool in relevant checks`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* ANIMATION                                                          */
    /* ------------------------------------------------------------------ */

    "ability-internal-spark": {
      id: "ability-internal-spark",
      type: "ability",
      name: "Living Touch",
      summary: "Restore your health by activating the life force within you.",
      description: `Activate the life force within you to restore your physical form. Regain 5+Fortitude pool of Health.`,
      tags: ["type:ability", "category:combat", "source:race-animation"],
      grantedBy: {
        type: "race",
        id: "race-animation",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        rulesText: `Activate the life force within you to restore your physical form. Regain 5+Fortitude pool of Health.`,
      },
    },

    "ability-spark-of-life": {
      id: "ability-spark-of-life",
      type: "ability",
      name: "Spark of Life",
      summary: "Animate an object for 10 minutes and see through its eyes.",
      description: `Once per day, you can transfer a spark of your life force into an inanimate object. For the next 10 minutes the object gains a walking speed equal to your own, and you can see though it's as though it was your own eyes.`,
      tags: ["type:ability", "category:adventuring", "source:race-animation"],
      grantedBy: {
        type: "race",
        id: "race-animation",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `Once per day, you can transfer a spark of your life force into an inanimate object. For the next 10 minutes the object gains a walking speed equal to your own, and you can see though it's as though it was your own eyes.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* ENDARI                                                             */
    /* ------------------------------------------------------------------ */

    "ability-aggressive-surge": {
      id: "ability-aggressive-surge",
      type: "ability",
      name: "Aggressive Surge",
      summary: "Reroll your next Offensive roll.",
      description: `With an aggressive surge of instinctive prowess as you strike to kill. Your next attack or ability can reroll your Offenses roll.`,
      tags: ["type:ability", "category:combat", "source:race-endari"],
      grantedBy: {
        type: "race",
        id: "race-endari",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Minor Action",
        range: "Self",
        cooldown: "3 Turn Cooldown",
        rulesText: `With an aggressive surge of instinctive prowess as you strike to kill. Your next attack or ability can reroll your Offenses roll.`,
      },
    },

    "ability-endari-tentacles": {
      id: "ability-endari-tentacles",
      type: "ability",
      name: "Endari Tentacles",
      summary: "Sense any movement within 30 feet, including invisible or hidden creatures.",
      description: `Your tentacles allow you to sense the environment around you. You can sense any movement within 30 feet of you, allowing you to sense invisible or hidden creatures.`,
      tags: ["type:ability", "category:adventuring", "source:race-endari"],
      grantedBy: {
        type: "race",
        id: "race-endari",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `Your tentacles allow you to sense the environment around you. You can sense any movement within 30 feet of you, allowing you to sense invisible or hidden creatures.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* FEYRDRIN                                                           */
    /* ------------------------------------------------------------------ */

    "ability-barkskin": {
      id: "ability-barkskin",
      type: "ability",
      name: "Barkskin",
      summary: "Grow protective bark and flora, granting 1d12 to your Armor pool for three turns.",
      description: `You can grow a thick layer of bark and flora around your armor, protecting you for the next three turns, granting 1d12 to your Armor pool.`,
      tags: ["type:ability", "category:combat", "source:race-feyrdrin"],
      grantedBy: {
        type: "race",
        id: "race-feyrdrin",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Minor Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        duration: "the next three turns",
        rulesText: `You can grow a thick layer of bark and flora around your armor, protecting you for the next three turns, granting 1d12 to your Armor pool.`,
      },
    },

    "ability-feyrdrin-footing": {
      id: "ability-feyrdrin-footing",
      type: "ability",
      name: "Feyrdrin Footing",
      summary: "Leave no trace when traveling and ignore natural difficult terrain.",
      description: `Your people’s reverence of nature is expressed in a gentle touch toward the earth. When you travel, you leave no trace of your footsteps behind you, and stepping on fragile grass or other plant life does not break or disturb them in any way. This is often seen by others as almost floating across surfaces. Additionally when traveling through nature, the environment twists and lightens the journey. You and your party are not impeded by natural difficult terrains.`,
      tags: ["type:ability", "category:adventuring", "source:race-feyrdrin"],
      grantedBy: {
        type: "race",
        id: "race-feyrdrin",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `Your people’s reverence of nature is expressed in a gentle touch toward the earth. When you travel, you leave no trace of your footsteps behind you, and stepping on fragile grass or other plant life does not break or disturb them in any way. This is often seen by others as almost floating across surfaces. Additionally when traveling through nature, the environment twists and lightens the journey. You and your party are not impeded by natural difficult terrains.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* GEODRAN                                                            */
    /* ------------------------------------------------------------------ */

    "ability-earth-tremor": {
      id: "ability-earth-tremor",
      type: "ability",
      name: "Earth Tremor",
      summary: "Knock all targets within 30 feet prone and slow their movement until your next turn.",
      description: `Shake the ground beneath your feet, causing all targets within 30 feet of you to be knocked Prone (PF). Additionally creatures have their movement speed slowed by half when moving through the area until the start of your next turn.`,
      tags: ["type:ability", "category:combat", "source:race-geodran"],
      grantedBy: {
        type: "race",
        id: "race-geodran",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        rulesText: `Shake the ground beneath your feet, causing all targets within 30 feet of you to be knocked Prone (PF). Additionally creatures have their movement speed slowed by half when moving through the area until the start of your next turn.`,
      },
    },

    "ability-sensing-tremor": {
      id: "ability-sensing-tremor",
      type: "ability",
      name: "Sensing Tremor",
      summary: "Sense what creatures are within 1000 feet of you by channeling through the earth.",
      description: `You can spend a minute channeling your natural connection with the earth to send out a tremor that tells you what creatures are within 1000 feet of you`,
      tags: ["type:ability", "category:adventuring", "source:race-geodran"],
      grantedBy: {
        type: "race",
        id: "race-geodran",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `You can spend a minute channeling your natural connection with the earth to send out a tremor that tells you what creatures are within 1000 feet of you`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* OMR                                                                */
    /* ------------------------------------------------------------------ */

    "ability-creeping-darkness": {
      id: "ability-creeping-darkness",
      type: "ability",
      name: "Creeping Darkness",
      summary: "Fill a 20-foot radius sphere with darkness that blinds creatures for 2 turns.",
      description: `Fill a 20 foot radius sphere with a cloud of darkness. Creatures within the darkness become Blinded unless they can see through darkness. The darkness cloud lasts for 2 turns.`,
      tags: ["type:ability", "category:combat", "source:race-omr"],
      grantedBy: {
        type: "race",
        id: "race-omr",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        duration: "2 turns",
        rulesText: `Fill a 20 foot radius sphere with a cloud of darkness. Creatures within the darkness become Blinded unless they can see through darkness. The darkness cloud lasts for 2 turns.`,
      },
    },

    "ability-omr-sight": {
      id: "ability-omr-sight",
      type: "ability",
      name: "Omr Sight",
      summary: "See in the dark as normal light, but suffer -1 Fatigue from prolonged sunlight.",
      description: `Your eyes have adapted to the darkness of night or caves. You are able to see in the dark as though it were normal light. Spending days and fighting in direct sunlight throughout the day causes -1 to Fatigue.`,
      tags: ["type:ability", "category:adventuring", "source:race-omr"],
      grantedBy: {
        type: "race",
        id: "race-omr",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `Your eyes have adapted to the darkness of night or caves. You are able to see in the dark as though it were normal light. Spending days and fighting in direct sunlight throughout the day causes -1 to Fatigue.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* WILDEMAN                                                           */
    /* ------------------------------------------------------------------ */

    "ability-primal-roar-novice": {
      id: "ability-primal-roar-novice",
      type: "ability",
      name: "Primal Roar",
      summary: "Frighten a target within 30 feet for 3 turns.",
      description: `Let out an intense roar at a target within 30 feet. The creature becomes Frightened (MF) for the next 3 turns.`,
      tags: ["type:ability", "category:combat", "source:race-wildeman"],
      grantedBy: {
        type: "race",
        id: "race-wildeman",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "30 feet",
        cooldown: "3 Turn Cooldown",
        rulesText: `Let out an intense roar at a target within 30 feet. The creature becomes Frightened (MF) for the next 3 turns.`,
      },
    },

    "ability-wild-form": {
      id: "ability-wild-form",
      type: "ability",
      name: "Wild Form",
      summary: "Spend Bend Luck to gain a chosen wild trait until you rest or change form.",
      description: `Use your ability of twisting the Fates to physically shift your form to exhibit wild traits. Use an instance of Bend Luck to gain the benefit until you rest or use another Bend Fate to change your form:
Climbing Appendages - Gain a Climb Speed equal to your Speed
Wild Leap - Gain ability to leap up to 20 feet
Swimming Appendages - Gain a Swim Speed equal to your Speed and gain the ability to breathe underwater
Wild Movement - Add 15 feet to your Speed
Beast of Burden - Double carrying capacity
Echolocation - gain blindsight up to 30 feet
Keen Hearing - Add 1d6 to Observation checks involving hearing
Keen Smell - Add 1d6 to Observation checks involving smell
Keen Sight - Add 1d6 to Observation checks involving sight`,
      tags: ["type:ability", "category:adventuring", "source:race-wildeman"],
      grantedBy: {
        type: "race",
        id: "race-wildeman",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `Use your ability of twisting the Fates to physically shift your form to exhibit wild traits. Use an instance of Bend Luck to gain the benefit until you rest or use another Bend Fate to change your form:
Climbing Appendages - Gain a Climb Speed equal to your Speed
Wild Leap - Gain ability to leap up to 20 feet
Swimming Appendages - Gain a Swim Speed equal to your Speed and gain the ability to breathe underwater
Wild Movement - Add 15 feet to your Speed
Beast of Burden - Double carrying capacity
Echolocation - gain blindsight up to 30 feet
Keen Hearing - Add 1d6 to Observation checks involving hearing
Keen Smell - Add 1d6 to Observation checks involving smell
Keen Sight - Add 1d6 to Observation checks involving sight`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* THULHAN                                                            */
    /* ------------------------------------------------------------------ */

    "ability-seed-of-paranoia": {
      id: "ability-seed-of-paranoia",
      type: "ability",
      name: "Seed of Paranoia",
      summary: "Deal Shadow Damage and make a target Paranoid.",
      description: `Connect minds with a target within range, and psychically leave a seed of impending doom deep within the target’s psyche. The target takes 3+Willpower Shadow Damage and becomes Paranoid.`,
      tags: ["type:ability", "category:combat", "source:race-thulhan"],
      grantedBy: {
        type: "race",
        id: "race-thulhan",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "30 feet",
        cooldown: "6 Turn Cooldown",
        rulesText: `Connect minds with a target within range, and psychically leave a seed of impending doom deep within the target’s psyche. The target takes 3+Willpower Shadow Damage and becomes Paranoid.`,
      },
    },

    "ability-thul-speech": {
      id: "ability-thul-speech",
      type: "ability",
      name: "Thul Speech",
      summary: "Telepathically communicate with a willing creature within 30 feet.",
      description: `You can reach out with your mind to a target within 30 feet of you. You are able to telepathically communicate with the creature back and forth if the creature opens their mind to yours and is willing to communicate. The creature must remain within 30 feet of you, and must be able to speak a language.`,
      tags: ["type:ability", "category:adventuring", "source:race-thulhan"],
      grantedBy: {
        type: "race",
        id: "race-thulhan",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `You can reach out with your mind to a target within 30 feet of you. You are able to telepathically communicate with the creature back and forth if the creature opens their mind to yours and is willing to communicate. The creature must remain within 30 feet of you, and must be able to speak a language.`,
      },
    },

    /* ------------------------------------------------------------------ */
    /* JACKAL                                                             */
    /* ------------------------------------------------------------------ */

    "ability-sun-ray": {
      id: "ability-sun-ray",
      type: "ability",
      name: "Sun Ray",
      summary: "Fire a 30-foot line of sunlight that deals Light Damage and blinds targets.",
      description: `Release a 30 foot long, 5 foot wide line of powerful sunlight. Creatures hit by this line take 5+Willpower Light Damage and become Blinded (BF) until the start of your next turn.`,
      tags: ["type:ability", "category:combat", "source:race-jackal"],
      grantedBy: {
        type: "race",
        id: "race-jackal",
      },
      mechanics: {
        category: "combat",
        cost: "No Cost",
        actionType: "1 Action",
        range: "Self",
        cooldown: "6 Turn Cooldown",
        rulesText: `Release a 30 foot long, 5 foot wide line of powerful sunlight. Creatures hit by this line take 5+Willpower Light Damage and become Blinded (BF) until the start of your next turn.`,
      },
    },

    "ability-deaths-guise": {
      id: "ability-deaths-guise",
      type: "ability",
      name: "Death’s Guise",
      summary: "Gain an illusionary disguise and memories of a dead humanoid you touch.",
      description: `You gain the ability to touch a dead humanoid, you then gain the target’s voice, a few memories. You can then wrap yourself in an illusionary disguise that matches that of the dead target. This disguise is convincing, but under scrutiny can be fallible. If contested, Deception versus Intuition. You can use the illusion portion of this ability a number of times equal to your Deception Rank per day. You retain the guises gathered in this manner for as long as you desire.`,
      tags: ["type:ability", "category:adventuring", "source:race-jackal"],
      grantedBy: {
        type: "race",
        id: "race-jackal",
      },
      mechanics: {
        category: "adventuring",
        rulesText: `You gain the ability to touch a dead humanoid, you then gain the target’s voice, a few memories. You can then wrap yourself in an illusionary disguise that matches that of the dead target. This disguise is convincing, but under scrutiny can be fallible. If contested, Deception versus Intuition. You can use the illusion portion of this ability a number of times equal to your Deception Rank per day. You retain the guises gathered in this manner for as long as you desire.`,
      },
    },


/* |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*          C I R C L E S                                             */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */






  },


  /* ------------------------------------------------------------------------ */
  /* ITEMS                                                                    */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Weapons, armor, gear, consumables, etc.

  SHAPE:
  items: {
    [itemId: string]: {
      id:          string;
      type:        "item";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];
      source:      { book: string; page?: number; };
      version:     { major: number; minor: number; };
      createdAt:   string;
      updatedAt:   string;

      mechanics: {
        itemType:  string;        // e.g. "weapon", "armor", "gear"
        rarity?:   string;        // e.g. "common", "rare", "unique"
        // generic slots for actual rules; we can refine later:
        properties?: string[];    // e.g. ["two-handed", "precise"]
        rulesText?: string;
      };
    }
  }
  */
  items: {},

  /* ------------------------------------------------------------------------ */
  /* PROFESSIONS                                                              */
  /* ------------------------------------------------------------------------ */
  /*
  DESCRIBES:
  - Non-combat roles or secondary expertise (blacksmith, scholar, etc.).

  SHAPE:
  professions: {
    [professionId: string]: {
      id:          string;
      type:        "profession";
      name:        string;
      summary:     string;
      description: string;
      tags:        string[];
      source:      { book: string; page?: number; };
      version:     { major: number; minor: number; };
      createdAt:   string;
      updatedAt:   string;

      mechanics: {
        skillBonuses?: { [skillId: string]: number };
        incomeNotes?: string;
        downtimeOptions?: string;
      };
    }
  }
  */
  professions: {},
};

// ---------------------------------------------------------------------------
// Make the data visible to simple <script> tags.
// After this, index.html can just use window.GRPG_LIBRARY directly.
// ---------------------------------------------------------------------------
if (typeof window !== "undefined") {
  window.TAG_DEFINITIONS = TAG_DEFINITIONS;
  window.GRPG_LIBRARY = GRPG_LIBRARY;
}
