# Timeline (Week 4 → Week 10)

## Week 4 — 3D Dice Prototype (read top faces)

**Goal:** Six physics dice roll on a 3D table; after settling, the game reliably knows each top value.
**Done when:**

* 6 dice spawn on a table with walls; Roll button tumbles them.
* Settle detection works (no jitter loops); top face read ≥95% accurate across 30 trials.
* Auto re-roll any ambiguous die after 2s.
  **Team split:**
  Gameplay (roll/settle), Systems (face-reading logic & thresholds), UX (basic UI & camera rig), PM/QA (test matrix & acceptance list).

## Week 5 — Scoring Engine Spec + Test Data

**Goal:** Formalize all scoring rules and test cases; integrate with UI readouts.
**Done when:**

* Written spec of rules (1s/5s, 3-kind, 1–6 straight, three pairs), plus edge-case notes.
* Table-driven **test dataset** (inputs/expected outputs) prepared (no code).
* UI shows current roll values and “Farkle” flag based on can-score logic.

## Week 6 — Full Turn Loop (Hot-Seat) + Keep/Bank

**Goal:** Play a complete round: roll → keep scorers → bank/roll again → next player.
**Done when:**

* Dice can be marked kept/unkept (visual state).
* Reroll only unkept dice.
* Bank adds to player’s round/total; Farkle loses round points; target score ends game.
* Two players can finish a game without soft locks.

## Week 7 — UX Pass + Tutorial Overlay

**Goal:** Self-explanatory flow for a first-time player.
**Done when:**

* Status banners for each state (Roll / Select / Bank or Roll Again / FARKLE).
* 3–4 step tutorial overlay (dismissible).
* Basic SFX hooked (roll, select, bank, farkle).

## Week 8 — Modifier System (foundation) + 2 Modifiers

**Goal:** Data-driven mutators that hook into roll/score.
**Done when:**

* Hooks defined: on_round_start, pre_roll(dice), post_roll(dice), pre_score(values)->values.
* Presets selectable (Classic, Party).
* Big Dice and Low Gravity change play clearly.

## Week 9 — Reach 5+ Modifiers + Edge-Case QA

**Goal:** Variety with stability.
**Done when:**

* Add: Missing Die, Double Ones, Same-Face Swarm (or similar).
* QA plays 3 full games across presets; scoring remains correct; no crashes.

## Week 10 — Ship

**Goal:** Exportable, stable build with minimal save and docs.
**Done when:**

* Saves basic options/preset/last winner.
* Performance sweep (CCD on dice, ang-vel caps, pooled arrays).
* Exports (Win/macOS/Linux) + README (controls, rules, presets).
  *(Week 11 optional: skins, confetti polish, simple AI.)*

---

# File & Folder Structure (no code)

```
/project_root
  /addons/                    # empty for now; room for helpers if needed
  /assets/
    /audio/                   # roll.wav, select.wav, bank.wav, farkle.wav
    /fonts/                   # UI font(s)
    /materials/               # PhysicsMaterials, StandardMaterials
    /models/
      dice.glb                # simple die mesh (unit cube with correct UV)
      table.glb               # table + rails (or use primitive geometry)
    /textures/
      dice_albedo.png
      ui_icons.png
  /docs/
    DESIGN_OVERVIEW.md        # goals, rules, modifier spec, hooks
    SCORING_SPEC.md           # written rules, examples, edge-cases
    TEST_CASES_SCORING.csv    # inputs → expected outputs
    MODIFIER_CATALOG.md       # each modifier: purpose, hooks used, conflicts
    QA_CHECKLIST.md           # per-week acceptance criteria
    RELEASE_NOTES.md
  /export/
    presets.cfg               # export presets configured in Godot
  /scenes/
    Game.tscn                 # root level; loads others
    /core/
      Table3D.tscn            # StaticBody3D floor + 4 walls
      Dice3D.tscn             # RigidBody3D with FaceAnchors (6 markers)
      CameraRig.tscn          # orbit/pan/zoom rig (SpringArm3D + Camera3D)
    /ui/
      HUD.tscn                # CanvasLayer: labels, buttons (Roll/Bank)
      TutorialOverlay.tscn    # intro steps
      ModifiersPanel.tscn     # preset dropdown, toggles (dev-only at first)
    /effects/
      ScreenShake.tscn        # optional
      Confetti.tscn           # optional
  /scripts/
    GameManager.gd            # state machine: lobby/turn/roll/score/end
    DiceController.gd         # spawning, pooling, bulk roll commands
    Dice3D.gd                 # roll/settle/read top; kept state
    Table3D.gd                # (optional) helper for bounds & cleanup
    CameraRig.gd              # orbit/pan/zoom
    ScoringEngine.gd          # pure logic (rules)
    FarkleRules.gd            # rule config (target score, variants)
    ModifierSystem.gd         # hook runner: register, activate, call hooks
    /modifiers/
      Mod_BigDice.gd
      Mod_LowGravity.gd
      Mod_MissingDie.gd
      Mod_DoubleOnes.gd
      Mod_SameFaceSwarm.gd
    /ui/
      HUD.gd
      TutorialOverlay.gd
      ModifiersPanel.gd
    /util/
      SaveConfig.gd           # ConfigFile wrapper (options/preset)
      RNG.gd                  # seeded RNG helpers
      Pools.gd                # pooled arrays, temp vectors (perf)
  /tests/                     # data + manual test notes (no code required)
    MANUAL_ROLL_LOG.md        # Week 4 accuracy runs
    PERFORMANCE_NOTES.md
  project.godot
  README.md
```

---

# Scene Graphs (high-level)

## Game.tscn

```
Game (Node)
 ├─ Table3D (StaticBody3D)
 ├─ DiceRoot (Node3D)
 │   └─ Dice3D x6
 ├─ CameraRig (Node3D)
 └─ UI (CanvasLayer)
     ├─ HUD (Control)
     └─ TutorialOverlay (Control, hidden by default)
```

## Dice3D.tscn

```
Dice3D (RigidBody3D)
 ├─ MeshInstance3D (die mesh)
 ├─ CollisionShape3D
 └─ FaceAnchors (Node3D)
     ├─ Face1 (Marker3D)  # each centered on a face, outward axis consistent
     ├─ Face2
     ├─ Face3
     ├─ Face4
     ├─ Face5
     └─ Face6
```

## HUD.tscn

```
HUD (Control)
 ├─ StatusLabel
 ├─ ValuesLabel
 ├─ Buttons
 │   ├─ RollButton
 │   ├─ BankButton
 │   └─ EndTurnButton
 └─ ModifiersPanel (dev-only toggle until Week 8)
```

---

# Naming & Conventions

* **Scenes:** PascalCase (`Game.tscn`, `Dice3D.tscn`)
* **Scripts:** PascalCase matching scene or system (`GameManager.gd`)
* **Nodes:** PascalCase; variables `snake_case`
* **Signals:** past-tense events (`roll_started`, `dice_settled`)
* **Folders:** lower_snake (`/assets/models`, `/scripts/modifiers`)
* **Modifiers:** `Mod_*` prefix, one hook section per file with short docstring.

---

# Roles & Standing Cadence

* **PM/QA:** Maintains QA_CHECKLIST.md, runs acceptance at end of each week, assembles short risk report.
* **Gameplay:** Dice physics, settle/read, keep states, reroll flow.
* **Systems:** Scoring spec, turn state machine, modifiers framework, save.
* **UX:** HUD, tutorial, status copy, audio, accessibility.

**Weekly rhythm**

* Mon: planning (pick 6–10 small tickets; each ≤1 day).
* Wed: midpoint demo; adjust scope.
* Fri: acceptance pass; tag weekly release.

---

# Acceptance Checklists (per milestone)

**Week 4 (Dice prototype)**

* [ ] 6 dice spawn, roll, and remain on table.
* [ ] Settle detection halts UI until complete.
* [ ] Top face read ≥95% across 30 trials; ambiguous die re-rolls automatically.
* [ ] Camera orbit/pan/zoom usable with mouse + trackpad.

**Week 6 (Turn loop)**

* [ ] Keep/unkeep visible and persistent across rolls.
* [ ] Reroll only unkept dice.
* [ ] Farkle loses round points; bank adds; next player rotates correctly.
* [ ] Full 2-player game completed without manual intervention.

**Week 8 (Modifiers foundation)**

* [ ] Preset selection persists into a round.
* [ ] Big Dice visibly larger and adjusts impulse; Low Gravity visibly floaty.
* [ ] Modifier banner lists active modifiers at round start.

**Week 10 (Ship)**

* [ ] Options saved/loaded; defaults sensible.
* [ ] Exports created; README includes controls, rules, presets, credits.
* [ ] 10 consecutive games without a crash; frame time stable.

---

# Modifier Backlog (prioritized, simple first)

1. **Big Dice** — scale up dice; impulse scaled accordingly.
2. **Low Gravity** — per-die gravity scale reduced during round.
3. **Missing Die** — spawn 5 instead of 6 dice this round.
4. **Double Ones** — scoring hook maps 1s from 100 to 200.
5. **Same-Face Swarm** — after settle, 20% chance all dice snap/reroll to the mode.
6. **Sticky Edges** — dice near rails auto-mark kept.
7. **Exploding Sixes** — each 6 grants a bonus die (spawn temp 7th this roll).
8. **Heavy Fives** — 5s worth 75; 1s worth 50 (tradeoff variant).
9. **Reverse Straight** — 2–6 straight counts; 1 is neutral.

*(Aim for 5 by Week 9; cap total at 6–8.)*

---

# Risks & Pre-agreed Scope Cuts

* If Week 4 read accuracy <95% → add re-roll-on-ambiguous and advance; don’t chase perfect physics.
* If Week 6 slips → freeze scoring set; defer rare combos.
* If Week 8 slips → ship 2–3 modifiers total; keep presets minimal.
* If Week 10 slips → skip confetti/skins; ship stable core.

---

# Non-art Asset Minimum

* 1 die mesh + collision, 1 table with rails, 4 SFX, 1 readable UI font.
* Simple UI icons (text OK until final week).

---

# Task Board (sample tickets this week)

* Create `Table3D.tscn` with walls; assign PhysicsMaterials (friction/bounce).
* Create `Dice3D.tscn` with 6 FaceAnchors placed/normalized consistently.
* Implement roll inputs (impulse presets list).
* Settle criteria & timeout; ambiguous detection plan.
* CameraRig orbit/pan/zoom with limits.
* HUD: Roll button, Values label, simple status text.
* QA: 30-roll log sheet, tally accuracy, note failure cases.