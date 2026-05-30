# The Flavor Explorer: Journey into the Culinary Universe

[![Live App](https://img.shields.io/badge/status-live%20on%20custom%20domain-success?style=for-the-badge&logo=google-cloud&color=606c38)](https://culinary-universe.vikramtiwari.com)
[![Scientific Foundation](https://img.shields.io/badge/arXiv-2605.22391-B31B1B?style=for-the-badge&logo=arxiv)](https://arxiv.org/pdf/2605.22391)

> "Is a carrot closer to a parsnip or a coriander seed? In a 300-dimensional culinary universe, flavor is not an opinion—it is a coordinates system."

Welcome to **The Flavor Explorer (The Culinary Universe)**, an interactive, high-fidelity visualizer that maps **1,790 ingredients** across a dense, high-dimensional flavor coordinate system. By combining high-performance 3D graphics, advanced machine learning clustering, and classical vector math, this project allows chefs, food scientists, and culinary enthusiasts to discover perfect pairings, blend taste notes, and model recipe synergies in real time.

---

## 🍳 The Science Behind the Constellations

Traditional recipe pairings rely heavily on intuition, culture, or simple single-compound matching (such as matching foods that share volatile compounds). While useful, this approach misses the complex, multi-faceted nature of culinary pairings. 

This project is built upon the dense scientific embeddings documented in the recent breakthrough paper:
📄 **[Read the Scientific Foundation: arXiv:2605.22391](https://arxiv.org/pdf/2605.22391)**

### 1. High-Dimensional Culinary Vectors (300-D)
Our corpus starts with **1,790 unique ingredients** from the **Epicure Core Dataset**. Each ingredient is mapped to a **300-dimensional vector space** where dimensions represent dense semantic and chemical flavor facets. In this space, proximity is a direct proxy for flavor alignment.

### 2. The UMAP 3D Clustering Manifold
To render this 300-dimensional space in a format humans can perceive, we employ **UMAP (Uniform Manifold Approximation and Projection)** using a cosine metric. UMAP acts as a non-linear lens, preserving local relationships:
* Ingredients clustered closely in the 3D space share highly compatible volatile chemical profiles.
* Constellations organically emerge representing natural categories: **Aromatic Herbs**, **Citrus Esters**, **Roasted Alliums**, **Smoked Fats**, and **Sweet Sugars**.

### 3. The Taste Lab Projection System
While UMAP is perfect for macro-clustering, we also need direct, actionable coordinates. In the **Taste Lab**, users project the 300-dimensional vectors onto ten direct taste anchors:

| Taste Dimension | Anchor Ingredient | Vector Target |
| :--- | :--- | :--- |
| **Sweet** | Brown Sugar | `brown_sugar` |
| **Sour** | Apple Cider Vinegar | `apple_cider_vinegar` |
| **Salty** | Bamboo Salt | `bamboo_salt` |
| **Bitter** | Cocoa Butter | `cocoa_butter` |
| **Umami** | MSG (Monosodium Glutamate) | `msg` |
| **Spicy** | Chili Pepper | `chili_pepper` |
| **Herbal** | Basil | `basil` |
| **Citrusy** | Lemon | `lemon` |
| **Smoky** | Bacon | `bacon` |
| **FattyRich** | Almond Butter | `almond_butter` |

When you select custom axes, the engine projects the 300-D ingredient vector $\vec{v}_i$ onto the normalized target anchor vector $\vec{a}_t$:

$$\text{Sensory Projection Score} = \vec{v}_i \cdot \vec{a}_t$$

These scores are then min-max normalized across the entire dataset and scaled with an exponential contrast adjustment ($S^{1.6}$) to bring out premium sensory contrast.

---

## 🎨 Interactive Interface & Key Features

* **3D Constellation Visualizer**: Pan, tilt, and zoom through a gorgeous, interactive point cloud styled in a premium, warm-parchment aesthetic with dynamic orbital rotations.
* **Cinematic Preview HUD**: Hover over nodes to inspect real-time taste profiles, and observe floating, pulsing highlight markers on 10 random ingredients that showcase the variety of the database.
* **Extreme 20.0x Zoom**: Zoom from a sweeping macro-universe perspective down to individual ingredient constellations to read labels clearly.
* **State-Driven Detail Cards**:
  * *Info Panel*: Shows selected ingredient metrics and its nearest "culinary similar" neighbors.
  * *Pairing Panel*: Activated on click to lock focus on an ingredient, highlighting neighboring connections.
  * *Pairing Matcher*: Hover over any other ingredient while one is selected to calculate a real-time **Culinary similarity score** matching percentage and pair synergy recommendations.
* **URL Deep-Linking**: All viewport adjustments (rotation, zoom, active selectors, grid axes, connectors, selected node index) are synchronized in real time with search parameters. Sharing a URL restores the exact perspective and focus immediately!

---

## ⚡ Technical Stack & Clean Architecture

The project is built for blistering local-first performance with zero bloated libraries:
* **Core**: React 18, TypeScript, and raw HTML Canvas rendering.
* **WASM Engine (Optional)**: Core heavy calculations compiled from a Rust WASM backend in `wasm-engine/`.
* **Asset Optimization**: High-dimensional datasets (`epicure_core.csv` [5.1 MB] and `dataset.bin` [2.1 MB]) reside strictly offline. Only a lightweight, pre-compiled `ingredients.json` metadata file (~448 KB) is loaded by the React client.
* **Pristine Codebase**: Strictly structured with modular, single-responsibility files well under the 300-line limit:
  * `src/VectorMath.tsx`: Coordinates UI hooks, URL parameters, and state hooks.
  * `src/canvas.ts`: Renders rendering loops, lighting, point offsets, and connecting tethers.
  * `src/math.ts`: Manages vector math, center alignments, and cosmic dust generation.
  * `src/components/ControlsHUD.tsx`: Axis selectors and display controls.
  * `src/components/HeaderHUD.tsx`: Brand and repository integration.

---

## 🛠️ Local Development & Operations

### Prerequisites
* Node.js & NPM
* Python 3 with `pandas`, `numpy`, `umap-learn` (for data seeds regeneration)
* Rust & `wasm-pack` (if editing the Rust backend)

### Commands
All operations are wrapped in an easy-to-use developer **Makefile**:

```bash
# 1. Install all dependencies
make install

# 2. Download raw datasets and process vectors locally
# (Reads from Hugging Face and generates public/ingredients.json using Python)
make data-gen

# 3. Compile the Rust WebAssembly engine
make wasm-build

# 4. Start the Vite local development server
make dev

# 5. Build and verify production assets (outputs to dist/)
make build
```

---

## 🚀 Deployed on GitHub Pages & Firebase Hosting (Custom Domain)

The project is fully optimized for zero-overhead static hosting on both platforms. You can compile production assets and deploy them simultaneously to both targets with a single Terminal command:

```bash
make deploy
```
*(Or `npm run deploy`)*

### Live Deployments:
* 🌐 **Custom Branded Domain (Firebase CDN)**: [culinary-universe.vikramtiwari.com](https://culinary-universe.vikramtiwari.com)
* 🐙 **GitHub Pages CDN Mirror**: [vikramtiwari.github.io/the-culinary-universe](https://vikramtiwari.github.io/the-culinary-universe/)

### Asset Pipeline Summary
To conform to the lightweight requirements of GitHub Pages and Firebase, and prevent hosting large source datasets that can be retrieved directly from Hugging Face, our build pipeline behaves as follows:
* **`public/ingredients.json` (~448 KB)** is compiled and packaged in `dist/`.
* **`data/epicure_core.csv` (5.1 MB)** and **`data/dataset.bin` (2.1 MB)** are ignored by Git and excluded from the production build, leaving a lightning-fast, ultra-accessible static app.
* **Relative Base Paths**: Vite and the React fetch client use relative paths (`./`) so that the application operates flawlessly under any sub-path directory configuration without breaking static links.
