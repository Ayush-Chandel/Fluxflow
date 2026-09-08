# FluxFlow Landing Page — Motion & Animation Guidelines

This file is the source of truth for all landing-page motion work.
Whenever you build, modify, or debug an animation/section, read and follow
these rules before writing code.

---

## 1. Core Product / Motion Philosophy

FluxFlow is a workflow/productivity product. Motion should communicate:

**thought → organization → execution → automation → completion**

The website is allowed to be visually impressive, but it must still feel like
a product marketing site rather than a collection of unrelated animation demos.

Every animation must have a reason to exist.

Ask:

1. What product idea does this movement communicate?
2. What is the user's visual focus?
3. What is moving because of time, scroll, or pointer?
4. What should remain still so the animation has contrast?

Prefer **fewer strong moments** over many small effects.

---

## 2. Motion Hierarchy

FluxFlow has exactly three major motion systems.

### A. Time-driven / Continuous Motion

Used for things that should feel alive without user interaction.

Examples:
- keyboard key activity
- lightning/electricity
- ambient glow
- subtle product-system activity
- command palette cycling

These use CSS keyframes, SVG animation, or a controlled animation loop.

**Important:** Continuous scenes must NOT depend on the user scrolling into them
to repeatedly trigger their animation. Once mounted/visible, the visual should
remain alive and loop naturally.

### B. Scroll-driven Motion

Used when the visitor's scroll position represents progress through a story.

Examples:
- vertical → horizontal card movement
- pinned/parallax sections
- card expansion
- testimonial pile → grid
- text reveals
- image/card center-scale effects

These should be driven by a normalized scroll progress / MotionValue whenever
possible.

Do not use timers to fake scroll-driven movement.

### C. Pointer / Interaction Motion

Used when the visitor actively interacts.

Examples:
- metallic card tilt
- custom cursor
- magnetic CTA/link behavior
- hover state transitions

Pointer motion should be restrained and physical, not noisy.

---

## 3. Continuous Animation Rule — Especially Keyboard + Lightning

The keyboard/lightning section is a **continuously running animation**, NOT a
microanimation.

Do not implement:

> scroll → animation starts → animation ends → static state

Implement:

> section becomes visible → living animation starts/continues → animation loops
> continuously while the section is active

The scene should contain multiple independent layers:

```text
KeyboardScene
├── Keyboard base
├── Key activity
├── Lightning / energy paths
├── Ambient glow
├── Command palette
└── Scroll-controlled camera/composition
```

Time controls the activity inside the scene.

Scroll controls the composition around the scene.

For example:

```text
TIME
keyboard pulses ────────────────►
lightning moves ────────────────►
ambient glow ───────────────────►
command changes ────────────────►

SCROLL
scene position ───────►
scene scale ───────────►
text position ─────────►
palette prominence ────►
```

Never stop the continuous animation just because the visitor scrolls.

Avoid perfectly synchronized loops. Stagger keys/lightning events so the scene
feels like a living system.

---

## 4. Motion Should Have Hierarchy

At any moment, decide what is:

### Primary
The element the user should look at.

### Secondary
Supporting movement that reinforces the primary element.

### Tertiary
Ambient motion that adds life but should not demand attention.

Never let five elements simultaneously behave as primary motion.

Example:

```text
Primary:      command palette
Secondary:    keyboard activity
Tertiary:     ambient lightning/glow
```

---

## 5. The Page Must Breathe

Do not animate every section at maximum intensity.

Recommended rhythm:

```text
HIGH        Hero reveal
MEDIUM      Metallic card
HIGH        Horizontal flow
VERY HIGH   Keyboard + lightning
VERY HIGH   Pinned cinematic section
HIGH        Capability expansion
MEDIUM      Testimonials
LOW         Final statement
MEDIUM      CTA
LOW         Footer
```

Quiet sections are intentional. They create contrast for the major moments.

---

## 6. FluxFlow's Visual Motion Language

Prefer these movement types:

### Reveals
- translateY
- clip/overflow reveal
- opacity
- slight scale

### Depth
- small rotateX / rotateY
- parallax
- center-based scale

### Flow
- horizontal translation
- continuous movement
- path-based SVG motion

### Transformation
- compact → expanded
- scattered → organized
- dark → light
- small → large

Avoid excessive:
- bouncing
- elastic overshoot
- random rotation
- giant cursor effects
- constant shaking
- arbitrary 3D rotations

Motion should feel engineered, not playful by default.

---

## 7. Animation Timing

Use a small timing vocabulary.

### Fast
~200–350ms
For:
- hover
- button states
- cursor state changes

### Normal
~450–700ms
For:
- ordinary reveals
- card transitions
- UI transitions

### Slow
~800–1200ms
For:
- major section reveals
- large transformations

### Cinematic
~1200–2200ms
For:
- hero
- major product transitions
- large reveal sequences

Do not make every animation 1–2 seconds. Timing must reflect importance.

Continuous loops should usually be several seconds long rather than frantic.

---

## 8. Easing

Default:

```text
cubic-bezier(0.22, 1, 0.36, 1)
```

Use spring-like motion for pointer-following objects and magnetic interactions.

Use linear/progress-based motion when something literally represents a path,
scroll progress, or continuous travel.

Avoid using a different easing curve for every element.

Consistency matters more than novelty.

---

## 9. Scroll Animation Rules

For scroll-driven sections:

1. Establish the section's total scroll distance first.
2. Normalize progress from 0 → 1.
3. Decide which element owns the progress.
4. Map progress to transforms.
5. Add secondary effects only after the primary movement works.

Prefer:

```text
scrollYProgress
    ↓
useTransform(...)
    ↓
transform / opacity / clip-path
```

Do not build a large sequence of unrelated `onScroll` state updates.

Avoid causing React re-renders on every scroll frame.

Use MotionValues, transforms, CSS transforms, or other compositor-friendly
properties wherever possible.

---

## 10. Sticky / Pinned Sections

For cinematic sections:

```text
outer section = tall scroll region
inner section = sticky viewport
```

The content inside the sticky scene should transition according to scroll
progress.

Do not pin large portions of the page unless the pin creates a clear story.

One major pinned cinematic section is preferable to several.

---

## 11. Horizontal Scroll Rule

Use vertical scrolling to drive one horizontal story.

The section should make conceptual sense:

```text
Planning → Execution → Automation → Intelligence
```

Do not use horizontal scrolling merely because it looks cool.

The visitor must always understand what is progressing.

When cards approach the center, subtle scale/opacity can emphasize them.

Do not make the center-scale effect too strong.

---

## 12. Card Transformation Rule

For compact → expanded cards:

```text
compact
  ↓
focus
  ↓
expand
  ↓
detail
  ↓
collapse
  ↓
next card
```

Only one card should normally be the dominant expanded object at a time.

The transition should feel like one object transforming rather than one card
disappearing and another unrelated card appearing.

---

## 13. Testimonial Pile Rule

Start messy:

```text
rotated
overlapping
offset
```

End organized:

```text
aligned
separated
grid
```

The animation should communicate:

**many voices → organized system**

Keep rotations small.

Do not make cards spin.

---

## 14. Cursor System

The cursor is global infrastructure.

Default:

```text
small dot
```

Interactive:

```text
larger circular/magnetic indicator
```

The cursor should help identify interaction, not become the main attraction.

Use the same cursor language across:
- links
- logos
- projects
- CTA buttons

Don't create unique cursor behavior for every section.

---

## 15. Text Reveal System

Default text reveal:

```text
overflow: hidden
child:
  transform: translateY(100%)
  opacity: optional
```

Then:

```text
translateY(100%) → 0
```

Use the same reveal pattern across headings and footer links.

This should become a reusable component, not copied animation code in every
section.

---

## 16. CTA Animation

For the black/white flowing CTA:

Use two layers.

```text
Button
├── base
└── hover fill
```

The hover layer starts outside the button and travels upward:

```text
translateY(100%)
       ↓
translateY(0)
```

Do not simply switch `background-color` if the desired visual is a flowing
fill.

Text should remain aligned so the transition feels like the button is being
filled rather than replaced.

---

## 17. Performance Rules

Prefer GPU/compositor-friendly properties:

- transform
- opacity
- filter where necessary

Avoid animating layout-heavy properties continuously:

- width
- height
- top/left
- margin
- padding

For expensive visual effects:
- use pseudo-elements
- use CSS gradients
- use SVG paths
- use `will-change` sparingly
- avoid large numbers of simultaneously animated DOM nodes

For large scenes, keep the DOM structure simple.

Do not add a library just because an effect can technically be built with it.

---

## 18. Responsive Rules

Desktop is the reference experience.

On tablet/mobile:

- reduce 3D rotation
- reduce large movement distances
- simplify lightning paths
- reduce number of simultaneously active animated elements
- shorten horizontal-scroll content if necessary
- convert extremely wide horizontal interactions into vertical storytelling
- never allow animation to break layout

A mobile version can be a simplified version of the desktop animation. It does
not have to reproduce every detail.

---

## 19. Reduced Motion

Support:

```css
@media (prefers-reduced-motion: reduce)
```

When enabled:
- remove continuous decorative animation
- remove large rotations
- minimize transforms
- disable cursor trails
- preserve content and essential state changes
- keep transitions short and understandable

Accessibility is part of the implementation, not a later patch.

---

## 20. Component Architecture

Build animation sections as isolated components.

Suggested structure:

```text
components/
└── landing/
    ├── HeroReveal/
    ├── MetallicProductCard/
    ├── HorizontalFlow/
    ├── KeyboardScene/
    │   ├── Keyboard.tsx
    │   ├── KeyPulse.tsx
    │   ├── Lightning.tsx
    │   └── CommandPalette.tsx
    ├── ImmersiveParallax/
    ├── CapabilityStack/
    ├── TestimonialPile/
    ├── FinalStatement/
    ├── FlowingCTA/
    └── GlobalCursor/
```

Do not put all landing-page animation logic into one page component.

---

## 21. Implementation Order

Always build in this order:

```text
1. Static layout
2. Primary animation
3. Scroll/pointer interaction
4. Secondary motion
5. Ambient motion
6. Performance optimization
7. Responsive behavior
8. Reduced-motion behavior
```

Never start with decorative effects.

---

## 22. Animation Completion Criteria

Do not consider a section finished because the animation technically works.

It is finished only when:

- it looks correct at normal scrolling speed
- it looks correct when the user scrolls quickly
- entering from the middle of the section still works
- exiting the section does not leave weird state behind
- resizing the viewport does not break it
- refresh/direct-load works
- mobile remains usable
- reduced motion works
- no excessive layout shift occurs
- the animation still supports the product message

---

# SECTION-SPECIFIC BUILD BRIEFS

Use the following prompts one at a time with an AI coding agent.
For every prompt, the agent should first inspect the existing codebase and
reuse existing components/styles rather than creating duplicate systems.

---

# 01 — HERO / SLOW 3D LOGO REVEAL

## Goal

Build the FluxFlow hero entrance as a cinematic, slow 3D product/brand reveal.

## Required behavior

- Plays on initial page load.
- 3D object/logo starts slightly below and/or behind its final position.
- Slowly rotates upward into its final orientation.
- Use an occlusion/shadow/curtain-like layer to create the reveal.
- The reveal should feel like the object is emerging from an invisible surface.
- Object settles smoothly.
- Headline then reveals from below using an overflow-hidden text reveal.
- Supporting text and CTA enter afterward.
- Do not add unnecessary bouncing.

## Timing

Approximate sequence:

```text
0.0s   background settles
0.2s   object begins
0.8s   reveal develops
1.4s   object settles
1.5s   headline
1.8s   supporting text
2.0s   CTA
```

## Implementation

Use:
- Framer Motion/Motion for entrance choreography
- transform/opacity
- overflow-hidden text wrapper
- pseudo-element or separate layer for the curtain/shadow

The hero animation should finish in a stable state and must not keep replaying
because of ordinary scrolling.

---

# 02 — METALLIC PRODUCT CARD

## Goal

Build a premium interactive metallic product card directly after the hero.

## Required behavior

The card should:
- react to pointer position
- tilt subtly on X/Y
- have a moving highlight/specular gradient
- have very slight scale response
- return smoothly to neutral when pointer leaves

Suggested maximum movement:

```text
rotateX: ±4deg
rotateY: ±7deg
scale: up to 1.015
```

Do not make it rotate dramatically.

## Implementation

Use pointer coordinates normalized to the card bounds.

Use Motion spring values for:
- rotateX
- rotateY
- scale
- light position

The visual should feel like a physical object responding to the user.

---

# 03 — VERTICAL → HORIZONTAL PRODUCT FLOW

## Goal

Convert a vertical scroll segment into a horizontal product journey.

## Content

Use conceptually related cards such as:

```text
01 Planning
02 Execution
03 Automations
04 Intelligence
05 Reports
```

## Required behavior

- Outer section is tall.
- Inner viewport is sticky.
- Vertical scroll maps to horizontal card translation.
- Cards progress naturally from left to right.
- Cards near the viewport center become slightly larger/brighter.
- Cards farther away become slightly smaller/subtler.

## Do not

- create a separate horizontal scrollbar
- use wheel-event hacks
- hijack the browser's vertical scrolling
- over-scale cards

## Implementation

Use scroll progress + MotionValues.

Prefer:

```text
useScroll
→ scrollYProgress
→ useTransform
→ translateX
```

Use center-distance calculations for subtle scale/opacity.

---

# 04 — CONTINUOUS KEYBOARD + LIGHTNING + COMMAND SCENE

## Goal

Create one of the primary FluxFlow signature animations.

This is a **continuous living scene**, not a triggered microinteraction.

## Composition

```text
headline
subheading

        keyboard
   ┌─────────────────┐
   │ Q W E R T ...   │
   │ A S D F ...     │
   │ Z X C V ...     │
   └─────────────────┘

      lightning/energy

    command palette
```

## Keyboard behavior

The keyboard:
- remains alive continuously
- contains staggered key pulses
- never activates every key at once
- has subtle brightness/depth changes
- feels like an active software environment

Use deterministic staggered timing.

## Lightning behavior

Lightning:
- continuously cycles
- travels across/around the keyboard
- uses SVG paths where practical
- includes subtle glow
- occasionally produces a stronger short flash
- never completely disappears for so long that the scene feels dead

Use several paths with different phases/durations.

Approximate cycle:
3–7 seconds.

## Command palette

The command palette:
- remains part of the living scene
- cycles through representative commands
- highlights different rows
- can briefly show a completed action
- returns to the command state
- loops

## Most important constraint

Do NOT implement:

```text
scroll → keyboard animation → lightning → command → stop
```

Implement:

```text
section visible
    ↓
continuous keyboard activity
    ↓
continuous lightning activity
    ↓
continuous command activity
    ↓
scroll changes the composition/camera
```

Scroll may:
- move the scene
- scale the scene
- change its vertical position
- change which part of the composition is dominant

Scroll must NOT stop the time-based animation.

---

# 05 — APPLE-STYLE PINNED PARALLAX STORY

## Goal

Create one immersive, full-screen storytelling section.

## Structure

```text
outer section: ~300–400vh
inner scene: sticky, 100vh
```

## Behavior

Background/product visual remains relatively fixed.

Text travels through the scene:

```text
statement 1
    ↓
statement 2
    ↓
statement 3
```

Each statement:
- enters from below
- becomes clear
- reaches focus
- exits upward/subtly fades

Toward the end:
- dark background transitions toward light
- text switches from light to dark
- next section begins seamlessly

## Important

The movement must feel cinematic and slow.

Do not make text fly around the screen.

---

# 06 — COMPACT CARD → FULL PRODUCT DETAIL

## Goal

Turn a simple strip of capability labels into detailed product panels.

## Initial state

```text
01 Planning
02 Automations
03 AI
```

Cards are compact.

## Scroll progression

```text
compact
 ↓
selected card expands
 ↓
full detail/product visual
 ↓
card contracts
 ↓
next card expands
```

Only one card should dominate at a time.

## Visual transformation

Animate:
- size
- position
- border/background treatment
- content visibility
- product visual scale
- text opacity

Do not simply crossfade between unrelated cards.

---

# 07 — TESTIMONIAL PILE → GRID

## Goal

Start testimonials as an irregular stacked composition and reorganize them
into a clean grid while scrolling.

## Initial state

Cards have:
- slight rotation
- overlap
- offsets
- different depth ordering

Keep rotation restrained.

## Scroll

```text
pile
 ↓
separate
 ↓
straighten
 ↓
grid
```

The transition should feel physically plausible.

Use transform rather than layout mutation wherever possible.

---

# 08 — GLOBAL CURSOR

## Goal

Create one reusable cursor system for the entire marketing page.

## Default

Small dot with slight pointer-follow lag.

## Interactive state

Over:
- links
- logos
- projects
- CTA

expand into a larger circular indicator.

Example:

```text
   ↗
 OPEN
```

or similar concise label.

The cursor should:
- animate in/out smoothly
- follow with spring/lerp
- never block clicks
- remain hidden/tolerant on touch devices

Do not create separate cursor implementations per section.

---

# 09 — TEXT REVEAL SYSTEM

## Goal

Create one reusable text reveal component.

## Default behavior

```text
wrapper:
overflow: hidden

text:
translateY(100%)
opacity: optional
```

Animate to:

```text
translateY(0)
opacity: 1
```

Support:
- initial-load mode
- viewport-entry mode
- staggered line/word mode where useful

Use the same component for:
- hero headings
- section headings
- final statement
- footer link replacement

---

# 10 — FLOWING CTA

## Goal

Build the black/white CTA where a new color layer flows upward into the button.

## Structure

```text
button
├── base layer
├── hover-fill layer
└── text
```

Hover-fill begins below:

```text
translateY(100%)
```

and travels to:

```text
translateY(0)
```

The final state is:

```text
black background
white text
```

The transition should feel like the button is being filled.

Avoid simply toggling background-color.

---

# 11 — FOOTER LINK TEXT REPLACEMENT

## Goal

On hover, replace footer-link text by sliding the old text out upward and
bringing the new text in from below.

Example:

```text
Projects
   ↓ hover
View projects
```

Use the same overflow-hidden reveal component as the rest of the site.

Keep this subtle because the page is ending.

---

# 12. Final Integration Prompt

After individual sections are complete, use this prompt:

> Review the complete FluxFlow landing page as one motion system, not as isolated animations.
>
> Check that:
> - the sections have clear motion hierarchy
> - the page alternates between high and low motion intensity
> - continuous animations remain continuous
> - keyboard/lightning are time-driven and never become scroll-triggered microanimations
> - scroll-driven sections respond smoothly to fast and slow scrolling
> - no section fights for visual attention with another
> - transitions between sections feel intentional
> - all animations use shared easing/timing conventions
> - there are no unnecessary duplicate animation utilities
> - pointer interactions use the global cursor system
> - performance remains acceptable
> - mobile and reduced-motion behavior are implemented
>
> Do not add new animation concepts. Refine the existing motion language and
> remove effects that are visually redundant.

---

# Golden Rule

Before adding any animation, classify it:

```text
Is it driven by TIME?
        ↓
continuous living animation

Is it driven by SCROLL?
        ↓
story/progression animation

Is it driven by POINTER?
        ↓
interactive feedback
```

If an animation cannot clearly answer which category it belongs to, redesign it
before implementing it.

The goal is not:

> "Make the website animated."

The goal is:

> **"Make FluxFlow feel like a system that is always moving."**
