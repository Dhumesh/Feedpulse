# Design System Strategy: The Intelligent Pulse

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

FeedPulse is not just a data aggregator; it is an AI-driven lens that brings clarity to chaos. To reflect this, the UI must move beyond the "standard SaaS dashboard" aesthetic. We are eschewing the rigid, boxy constraints of traditional grids in favor of **Intentional Asymmetry** and **Tonal Depth**. The experience should feel like a high-end editorial piece—quiet, authoritative, and deeply focused. 

By leveraging expansive white space (using the `20` and `24` spacing tokens) and a sophisticated layering of surfaces, we create an environment where insights breathe. We don't use lines to separate ideas; we use the natural physics of light and depth.

---

## 2. Colors & Surface Philosophy
The palette is anchored by `primary (#3525cd)`, a deep, intellectual indigo that commands attention without shouting.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Structure is defined through **Background Shifts**. A `surface-container-low` module sitting on a `surface` background creates a clear boundary that feels organic. For FeedPulse, use `surface-container-lowest (#ffffff)` for active content cards to make them "pop" against the `surface (#faf8ff)` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of fine paper.
*   **Base:** `surface` (#faf8ff)
*   **Secondary Content:** `surface-container-low` (#f2f3ff)
*   **Primary Focus/Cards:** `surface-container-lowest` (#ffffff)
*   **Floating/Nav Elements:** `surface-container-high` (#e2e7ff) with a `backdrop-blur` effect.

### The "Glass & Gradient" Rule
To inject "soul" into the AI experience:
*   **Hero Sections:** Use a subtle linear gradient from `primary` (#3525cd) to `primary_container` (#4f46e5) at a 135-degree angle.
*   **Glassmorphism:** Navigation rails and floating AI insight panels should use `surface_container_low` at 80% opacity with a `blur-xl` Tailwind utility. This allows the primary brand colors to bleed through softly, preventing the UI from feeling "pasted on."

---

## 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headline) with **Inter** (Body) to balance character with legibility.

*   **Display-LG (Manrope, 3.5rem):** Reserved for high-level AI summaries. Use `on_surface` with a `-0.02em` letter-spacing for a premium, compressed feel.
*   **Headline-MD (Manrope, 1.75rem):** Used for feedback category titles. This creates a clear editorial break in the data.
*   **Body-MD (Inter, 0.875rem):** The workhorse for customer feedback text. Use a generous line-height (`leading-relaxed`) to ensure readability during long research sessions.
*   **Label-MD (Inter, 0.75rem, All Caps):** Used for metadata (e.g., "TIMESTAMP" or "SOURCE"). Increase letter-spacing to `0.05em` to maintain a professional, architectural feel.

---

## 4. Elevation & Depth
In this design system, shadows are a last resort, not a default.

### The Layering Principle
Achieve hierarchy through **Tonal Layering**. Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle shift from `#ffffff` to `#f2f3ff` provides all the separation the eye needs without the visual "noise" of a shadow.

### Ambient Shadows
When a card must float (e.g., a hovered feedback item), use a **Custom Ambient Shadow**:
*   `shadow-[0_20px_40px_-15px_rgba(19,27,46,0.08)]`
*   The shadow is tinted with the `on_surface` (#131b2e) color at a very low opacity (8%) to mimic natural light.

### The "Ghost Border" Fallback
If contrast ratios require a border (e.g., in Dark Mode or high-accessibility views), use a **Ghost Border**: `outline-variant` (#c7c4d8) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons & Chips
*   **Primary Button:** Uses the `primary` (#3525cd) fill with `on_primary` text. Apply `rounded-xl` and a subtle inner-glow gradient to give it a tactile, "pressed" quality.
*   **Sentiment Chips:** 
    *   *Positive:* `surface_container_lowest` with `on_secondary_container` text and a `primary` pulse dot. 
    *   *Negative:* `error_container` fill with `on_error_container` text.
    *   *Note:* Avoid heavy fills; use "soft" semantic backgrounds to keep the UI minimal.

### Input Fields
*   Standard state: `surface-container-low` background, no border, `rounded-lg`. 
*   Focus state: Background shifts to `surface-container-lowest` with a 2px `surface_tint` "Ghost Border."

### Feedback Cards & Lists
*   **No Dividers:** Prohibit the use of `hr` tags or border-bottoms. Use `spacing-6` (1.5rem) to separate list items. 
*   **Asymmetric Layout:** In feedback lists, offset the "AI Sentiment Score" to the top-right of the card, breaking the vertical alignment of the text to create a more dynamic, less "spreadsheet" feel.

### AI Insight Tooltips
*   Use `inverse_surface` (#283044) for tooltips to create high-contrast callouts. This signals that the information is "generated" by the AI, distinct from the user-generated feedback.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace the "Dead Zone":** Use large areas of `surface` color to separate major functional areas.
*   **Use Soft Rounding:** Stick to `rounded-lg` (1rem) for UI elements and `rounded-xl` (1.5rem) for main content containers to maintain the "Soft Minimalism" vibe.
*   **Layer Color:** Use `primary_fixed_dim` for subtle background highlights behind important AI metrics.

### Don't:
*   **Don't use "Pure" Black:** Use `on_surface` (#131b2e) for all "black" text to maintain tonal harmony with the indigo primary.
*   **Don't use Box Shadows on everything:** Only use shadows for elements that are physically "above" the page (Modals, Popovers, Hovered Cards).
*   **Don't use Standard Grids:** Occasionally break the grid. Allow an image or a pull-quote to bleed into the margin to create an editorial, premium feel.