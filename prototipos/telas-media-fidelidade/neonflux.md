---
name: Neon Flux
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#b9cbbc'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#849587'
  outline-variant: '#3b4a3f'
  surface-tint: '#00e38b'
  primary: '#f4fff3'
  on-primary: '#00391f'
  primary-container: '#00ff9d'
  on-primary-container: '#007143'
  inverse-primary: '#006d40'
  secondary: '#a6e6ff'
  on-secondary: '#003543'
  secondary-container: '#14d1ff'
  on-secondary-container: '#00566b'
  tertiary: '#fffaff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e7d9ff'
  on-tertiary-container: '#7623ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#56ffa8'
  primary-fixed-dim: '#00e38b'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#00522f'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  headline-lg:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style

This design system is built on a high-octane, digital-first aesthetic that merges **Retro-Futurism** with **Modern Minimalism**. It is designed for high-energy mobile PWAs, targeting tech-savvy users who appreciate a "Dark Mode" native experience. 

The visual narrative is defined by:
- **Luminosity:** Elements should appear to emit light, using vibrant gradients and soft glows to contrast against deep backgrounds.
- **Precision:** While the colors are loud, the layout is disciplined and structured to ensure the interface remains professional and functional.
- **Motion:** The system implies movement through directional gradients and sharp, clean transitions.

## Colors

The palette centers on a high-contrast relationship between deep obsidian neutrals and electric neon accents.

- **Primary Gradient:** A linear 135° transition from `#00FF9D` (Electric Green) to `#00D1FF` (Cyan). This is used for high-intent actions and primary brand moments.
- **Background Strategy:** Use `#0A0C10` as the base canvas. Secondary surfaces use `#161B22` to create subtle depth without losing the "true dark" feel.
- **Accent:** A deep violet (`#7000FF`) is used sparingly for data visualization or secondary interactive states to provide a "Cyberpunk" depth.
- **Functional Colors:** Success states utilize the primary green; destructive actions use a high-vibrancy coral (`#FF2E63`) to cut through the cool-toned palette.

## Typography

The typography system uses a tiered approach to balance character with utility:
- **Display & Headlines:** **Sora** provides a geometric, futuristic weight that anchors the screen. Its wide stance handles short, punchy titles effectively.
- **Body:** **Geist** offers a technical, highly legible experience for long-form content and UI controls, maintaining a "developer-tool" level of precision.
- **Technical Labels:** **JetBrains Mono** is used for small metadata, timestamps, and secondary labels to reinforce the "Neon/Tech" narrative.

All typography should be rendered in high-contrast white (`#FFFFFF`) for primary content or a muted silver-grey (`#8B949E`) for secondary descriptions.

## Layout & Spacing

This design system utilizes a **4px baseline grid** optimized for mobile-first PWA environments.

- **Mobile Layout:** A 4-column fluid grid with 16px outer margins. Gutters are kept at 12px to maximize horizontal density.
- **Vertical Rhythm:** Components are spaced using the `md` (16px) unit as the standard separator. Grouped elements (like labels and inputs) use `xs` (8px).
- **Safe Areas:** Navigation and primary actions must respect the mobile "thumb zone" (bottom 30% of the screen) and the top notch safe area.

## Elevation & Depth

Elevation is conveyed through **Color Intensity** and **Outer Glows** rather than traditional grey shadows.

- **Base Layer:** The darkest surface (`#0A0C10`).
- **Surface Layer:** Elevated cards or containers use a slightly lighter grey (`#161B22`) with a subtle 1px border of `#30363D`.
- **Interactive Depth:** Hover or active states on primary elements should trigger a soft "Neon Glow" using a box-shadow with a high blur (15-20px) and low opacity (20-30%) using the primary gradient colors.
- **Overlays:** Modals and drawers use a backdrop-filter blur (8px) with a 60% opacity black tint to focus the user on the foreground element.

## Shapes

The shape language is **Technical-Modern**. 
- **Standard Radius:** 0.5rem (8px) is the default for buttons, cards, and inputs.
- **Large Radius:** 1.5rem (24px) is reserved for top-level containers like bottom sheets and large modal surfaces.
- **Contrast:** Small UI elements like tags or "status dots" can remain sharp (0px) or fully rounded (pill) to create visual distinction against the standard 8px grid.

## Components

- **Buttons:** 
  - *Primary:* Full gradient background (`#00FF9D` to `#00D1FF`) with black text (`#0A0C10`) for maximum legibility.
  - *Secondary:* 1px gradient border with transparent background and white text.
- **Inputs:** Dark backgrounds (`#161B22`) with a subtle bottom border. Upon focus, the border transitions to the primary gradient with a soft glow.
- **Cards:** Use a "Glassmorphism" hint,semi-opaque backgrounds with a 1px stroke. Content should be padded with `md` (16px).
- **Chips/Tags:** Monospaced font (**JetBrains Mono**) at `label-sm` size, housed in a pill-shaped container with a low-opacity version of the primary color.
- **Bottom Navigation:** Fixed at the bottom, using a subtle blur and top-border highlight to separate it from the content scroll area.
- **Progress Indicators:** Use the primary-to-secondary gradient for the fill, with a glow effect on the leading edge to simulate a "laser" movement.