---
name: react-component-structure
description: Restructure a React component file to this project's folder/ordering convention - one folder per component with an index.ts barrel, sub-components split into their own files, a fixed statement order inside each component (destructured props, then hooks, then effects, then named JSX consts, then a single return), and heavy hook logic (any useMemo/useCallback, or more than 5 hooks) pulled out into a custom hook in src/hooks/. Use whenever creating a new component or asked to "fix"/"clean up" a component file.
---

# React component structure

This project does not put a component's JSX directly in one big file. Every
component gets its own folder, and the body of each component function
follows a fixed statement order. Apply this whenever you create a new
component, or when asked to restructure/clean up an existing one.

Reference implementation in this repo: `src/components/StoryCard/` (the
richest example, several sub-components) and `src/components/CategoryPage/`
(a component with local state/effects that delegates a piece of its JSX to
a child component).

## 1. One folder per component

Instead of `ComponentName.tsx`, create `ComponentName/`:

```
ComponentName/
  index.ts            <- barrel: exports only what other folders need
  ComponentName.tsx    <- the component itself
  SomePiece.tsx         <- a sub-component used only inside this folder
  AnotherPiece.tsx
  utils.ts              <- plain (non-component) helper functions, if any
```

- `index.ts` re-exports the public surface, e.g.:
  ```ts
  export { default } from './ComponentName'
  ```
  or, for a folder with multiple public exports (see `StoryCard/index.ts`):
  ```ts
  export { default as FeaturedStory } from './FeaturedStory'
  export { default as StoryTile } from './StoryTile'
  export { formatDate } from './utils'
  ```
- Sub-components that exist only to build the parent's JSX (e.g. `SourceFilter`
  inside `CategoryPage/`, `CategorySection` inside `HomePage/`, or
  `StoryImage`/`Lightbox`/`SourceLinks`/`SourceGroupPill` inside `StoryCard/`)
  are **not** re-exported from `index.ts` - they're internal.
- Importers outside the folder always import from the folder path
  (`from '@components/StoryCard'`), never reach into a specific file inside
  it. Because `index.ts` exists, this import path is unchanged whether the
  component is one file or backed by ten.
- **Never use relative paths that climb out of the current folder**
  (`../`, `../../`). This project has path aliases configured in both
  `vite.config.ts` and `tsconfig.app.json`:
  - `@/*` -> `src/*` (e.g. `@/types`)
  - `@components/*` -> `src/components/*`
  - `@hooks/*` -> `src/hooks/*`
  - `@utils/*` -> `src/utils/*`

  Use these for any cross-folder import. Relative imports (`./Sibling`,
  `./utils`) are still correct - and preferred - for files inside the same
  component folder.
- Split out a sub-component when a chunk of JSX has its own meaningfully
  separate rendering logic (its own map/loop, its own conditional branches,
  its own local state) - not just because a block is long. A three-line
  wrapper `<div>` doesn't need its own file.

## 2. Statement order inside a component function

Do **not** destructure props in the function signature. The function takes
one `props` parameter; the first line of the body destructures it. Order
after that:

1. Destructure props (first line, in the body - not in the signature)
2. Hooks, each destructured (`useState`, `useRef`, etc.)
3. `useEffect` calls
4. Any plain derived values/helper functions needed before rendering
5. JSX pieces, each assigned to a `const` named for what it renders
6. A single `return` at the end, composed from those consts

Avoid early `return`s for conditional rendering - fold the condition into a
const instead (`const thing = condition ? (<jsx/>) : null`, or
`condition && (<jsx/>)`), and reference it in the one final `return`.

### Minimal example (no hooks) - `Footer.tsx`

```tsx
function Footer() {
  const logo = <img src="..." alt="..." className="..." />
  const title = <span className="...">...</span>

  return (
    <footer className="...">
      {logo}
      {title}
    </footer>
  )
}

export default Footer
```

### Example with props, state, and an effect - shape only

```tsx
interface ThingProps {
  value: string
  onChange: (v: string) => void
}

function Thing(props: ThingProps) {
  const { value, onChange } = props           // 1. destructure props
  const [open, setOpen] = useState(false)      // 2. hooks, destructured

  useEffect(() => {                             // 3. effects
    if (!open) return
    // ...
  }, [open])

  const isValid = value.length > 0              // 4. derived values

  const toggleButton = (                        // 5. JSX consts
    <button onClick={() => setOpen((o) => !o)}>{open ? 'close' : 'open'}</button>
  )
  const panel = open && <div className="...">{/* ... */}</div>

  return (                                       // 6. single return
    <div>
      {toggleButton}
      {panel}
    </div>
  )
}

export default Thing
```

## 3. When to extract a custom hook

If a component directly calls `useMemo` or `useCallback` **at all**, or uses
**more than 5 hooks** total (counting every `useState`/`useRef`/`useEffect`/
custom-hook call), pull that logic out into a custom hook in `src/hooks/`
instead of leaving it in the component body.

- The hook owns its own state/refs/memoization/effects and returns only what
  the component needs to render - plain values and booleans, not raw
  intermediate data the component would have to re-derive.
  See `useCategoryStories` (returns `hasCategoryStories`/`hasFilteredStories`
  booleans, not the story arrays themselves) and `useHomeSections`,
  `useLastUpdated`, `useNewsStories`, `useRouteSeo` for the shape.
- This applies recursively to what's *left* in the component after
  extraction, not to the hook itself - a custom hook is expected to contain
  several hooks/`useMemo` calls internally; that's the point of moving them
  there. Don't split a hook further just because it's hook-heavy internally.
- One hook per concern. Don't merge unrelated logic into a single mega-hook
  just to get the component's hook count down - `App.tsx` uses five small
  hooks (`useDarkMode`, `useHashRoute`, `useNewsStories`, `useLastUpdated`,
  `useRouteSeo`) rather than one that does everything.
- Hook parameters are plain positional arguments (`useCategoryStories(stories,
  categorySlug)`), not a destructured `props` object - the props-destructure
  rule in section 2 is for components, not hooks.

## Checklist when applying this skill

- [ ] Component has its own folder with `index.ts` exporting only its public
      surface.
- [ ] Distinct, logically separate JSX chunks are pulled into their own
      sub-component files inside the folder (not exported unless another
      folder needs them).
- [ ] Plain (non-component) helper functions used by the folder live in a
      `utils.ts` in that folder, not scattered inline.
- [ ] No `../` or `../../` imports - cross-folder imports use `@/`,
      `@components/`, `@hooks/`, or `@utils/`.
- [ ] Every component function destructures `props` as its first statement,
      never in the signature.
- [ ] Order inside the function is: props destructure -> hooks -> effects ->
      derived values -> named JSX consts -> one final return.
- [ ] No early returns for conditional rendering.
- [ ] No component directly calls `useMemo`/`useCallback`, and no component
      uses more than 5 hooks - that logic lives in a custom hook in
      `src/hooks/` instead.
- [ ] After the refactor, run `npx tsc --noEmit -p .` and `npm run build` to
      confirm nothing broke - import paths pointing at the old folder should
      still resolve via the new `index.ts`.
