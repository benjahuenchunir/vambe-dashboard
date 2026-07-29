@AGENTS.md

# UI Design System Guidelines

When writing HTML or UI components, adhere strictly to the following design system rules:

## 1. Technical Stack
- Tailwind CSS v4 with custom CSS variables (`bg-background`, `text-foreground`, `bg-primary`, etc.).
- Icons: Use Iconify Lucide icons (`<iconify-icon icon="lucide:name"></iconify-icon>`).
- Typography: Inter for Sans/Heading, JetBrains Mono for Code.

## 2. Color Palette & Semantic Classes
- Primary Accent: `bg-primary` (`#006bff`), `text-primary-foreground` (`#ffffff`)
- Backgrounds: `bg-background` (`#ffffff`), `bg-card` (`#ffffff`), `bg-muted` (`#f1f1f2`)
- Text: `text-foreground` (`#1c1d1f`), `text-muted-foreground` (`#828384`), `text-tertiary` (`#686f79`)
- Borders & Inputs: `border-border` (`#e1e6ee`), `bg-input`
- Status: `bg-destructive` (`#ef4444`)

## 3. Core Component Structures

### Steps / Timeline Lists
- Container: Flex row with `gap-4 md:gap-8 max-w-3xl`.
- Circle Badge: `size-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium tabular-nums`.
- Connector Line: `absolute top-9 bottom-2 left-3.5 w-px bg-primary/30`.

### Headers & Search Bar
- Header Height: `h-16` or `h-[109px]` for dual-row navigation.
- Search Input Container: `flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm`.
- Keyboard Shortcuts: `<kbd class="rounded border border-border bg-background px-1.5 py-0.5 text-xs">Ctrl</kbd>`.

### Navigation Buttons & Links
- Standard Button: `inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground shadow-sm`.
- Secondary Button: `inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground shadow-sm`.
- Step Cards (Next/Prev): `group flex flex-1 items-center gap-4 rounded-sm border border-border p-4 hover:border-primary`.

## 4. Layout Constraints
- Content Max-Width: `max-w-3xl` for reading articles/documentation; `max-w-screen-2xl` for top headers.
- Corner Radii: Use `rounded-xl` for interactive elements (inputs, buttons) and `rounded-sm` for imagery/cards.