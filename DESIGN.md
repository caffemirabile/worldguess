# Design Brief

## Direction

WorldGuess — a multiplayer geography guessing game set in a dark, immersive ocean-night map world where players identify randomly selected places by typing their names.

## Tone

Adventurous and playful with a premium map-game edge: deep blue-black surfaces, a vivid map-pin coral accent, and a bold geometric display face that feels like a world-traveler's atlas.

## Differentiation

The signature is a "map-pin coral" primary on cool ocean-night neutrals with a subtle topographic texture behind the play area — the guess field and map card read as the hero, not a generic dark dashboard.

## Color Palette

| Token      | OKLCH          | Role                            |
| ---------- | -------------- | ------------------------------- |
| background | 0.13 0.02 258  | deep ocean-night base           |
| foreground | 0.95 0.012 258 | primary text                    |
| card       | 0.17 0.022 258 | surfaces / map card             |
| primary    | 0.66 0.2 25    | map-pin coral accent / CTA      |
| accent     | 0.72 0.13 190  | travel teal secondary           |
| muted      | 0.22 0.03 258  | subtle fills / footers           |
| success    | 0.65 0.16 150  | correct-guess feedback          |
| destructive| 0.58 0.21 25   | wrong-guess / leave room        |

## Typography

- Display: Space Grotesk — headings, hero, game title, scores
- Body: DM Sans — paragraphs, labels, inputs, buttons
- Mono: Geist Mono — room codes, timers, numeric scores
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered surfaces with a soft elevated shadow hierarchy (`shadow-subtle` → `shadow-card`); the map play area sits on the highest card surface above the textured background.

## Structural Zones

| Zone    | Background        | Border   | Notes                                  |
| ------- | ----------------- | -------- | -------------------------------------- |
| Header  | card              | border-b | sticky, brand + profile + score        |
| Content | background+texture| —        | login / lobby / play area alternate bg |
| Footer  | muted/40          | border-t | credits, room code hint                |

## Spacing & Rhythm

Generous section gaps (`gap-8`/`gap-12`) with tight micro-spacing inside cards (`gap-3`); the play area is the largest, most padded surface on screen.

## Component Patterns

- Buttons: rounded-full pills; primary = map-pin coral, secondary = muted, destructive = coral-red; hover raises elevation
- Cards: `rounded-2xl`, card background, `shadow-card`, `border-border`
- Badges: rounded-full pills; success green for correct, destructive red for wrong, accent teal for room status

## Motion

- Entrance: `fade-up` 0.5s on cards and play area
- Reveal: `pin-drop` 0.5s spring for the answer pin reveal after a guess
- Hover: `transition-smooth` 0.3s lift + shadow change on interactive elements
- Decorative: `pulse-soft` 2s on "waiting for players" status dot

## Constraints

- Dark-only immersive theme; maintain AA+ contrast for game text and scores
- Game play area and guess input must stay prominent and legible at all sizes
- No pin-drop guessing on an interactive world map; no timed rounds/countdown
- Token-only styling — no raw color literals in components

## Signature Detail

The map-pin coral primary paired with a subtle topographic backdrop makes the guess field feel like dropping a pin on a live atlas — instantly readable and unmistakably a travel game.
