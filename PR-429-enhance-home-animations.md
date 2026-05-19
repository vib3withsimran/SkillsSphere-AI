Title: Enhance Home Page Animations & Visual Experience (#429)

Related issue: #429 - Enhance Home Page Animations & Visual Experience

Summary
- Improve the home/landing hero visual polish with subtle motion and staggered heading animation while respecting users' `prefers-reduced-motion` setting.

What I changed
- `client/src/modules/landing/components/Hero.jsx`:
  - Added subtle floating animation for the background gradient orbs (`orb-float`).
  - Implemented a staggered, fade-in animation for heading characters (`animate-heading-char`).
  - Added a `prefers-reduced-motion` media query to disable non-essential animations for accessibility.
  - Kept existing visual assets, gradients and layout intact; changes are minimal and additive.

Accessibility
- Animations are disabled when `prefers-reduced-motion: reduce` is set.
- All decorative elements remain `aria-hidden`.

Testing & QA
- Verify landing page loads without visual regressions in light and dark modes.
- Confirm orbs animate subtly on supported browsers (modern Chrome/Firefox/Safari).
- Test with OS-level "Reduce Motion" enabled — animations should be disabled.

How to apply locally
1. Create a feature branch and apply changes:

```bash
# from repo root
git checkout -b feat/429-enhance-home-animations
# stage changes
git add client/src/modules/landing/components/Hero.jsx PR-429-enhance-home-animations.md
git commit -m "feat(landing): enhance home animations and reduced-motion support (#429)"
```

2. Push branch and open PR:

```bash
git push -u origin feat/429-enhance-home-animations
# then open a PR on GitHub and reference issue #429
```

Notes / follow-ups
- If you want more advanced motion (e.g., Framer Motion usage, Lottie interactions, or intersection-driven entrance triggers), I can extend this work.
- I intentionally kept changes small to reduce regression risk; further visual tuning can be done in follow-ups.
