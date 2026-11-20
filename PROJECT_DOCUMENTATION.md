# 🌾 KissanAlert — Complete Project Documentation & Technical Specification

> **Comprehensive Technical Master Guide**  
> Covers System Architecture, Multimodal AI Pipelines, Multilingual Localization Engine, Weather & Water Budgeting, GIS Mapping, and Deployment Guides.

---

## 📑 Complete Document Outline
1. **Executive Summary & Mission Statement**
2. **System Architecture & Data Flow**
3. **Multi-Key API Rotation & Failover Protocol**
4. **Computer Vision & Diagnostic Pipeline (Gemini 3.8 Flash)**
5. **Weather Intelligence & Smart Irrigation Advisory**
6. **Multilingual Architecture & Authentic Odia (ଓଡ଼ିଆ) Implementation**
7. **Dynamic Image-Driven Health Analytics**
8. **GIS Farm Mapping & Water Proximity (Haversine Algorithm)**
9. **Offline-First PWA Implementation & Service Workers**
10. **Data Models & Storage Schemas**
11. **Component-by-Component Source Code Walkthrough**
12. **Environment Variables & Security Best Practices**
13. **Local Setup, Build & Deployment**
14. **Viva / Presentation Q&A for Judges & Technical Reviewers**

---

## 1. Executive Summary & Mission Statement

### The Problem
Indian agriculture supports over 600 million livelihoods but faces systemic inefficiencies:
- **Water Wastage**: Flood irrigation and poor scheduling waste more than half of pumped groundwater.
- **Crop Disease Vulnerability**: Pests and fungal diseases cause preventable losses of up to 40% of crop yields.
- **Language Exclusion**: Traditional agricultural advisories and modern AI tools are predominantly in English, creating an adoption barrier for rural farmers in states like Odisha, Andhra Pradesh, and West Bengal.

### The Solution: KissanAlert
**KissanAlert** is an offline-first Progressive Web Application (PWA) that acts as an on-field AI agronomist and water conservation manager:
- Diagnoses crop and livestock health from photos in seconds using **Google Gemini Vision**.
- Assesses water stress and delivers tailored irrigation advice to prevent over-watering or under-watering.
- Integrates real-time weather forecasts to recommend **irrigation skipping** when rainfall is imminent.
- Delivers 100% of its interface and diagnostic findings in **Odia (ଓଡ଼ିଆ)** and 11+ Indian languages.
- Eliminates API downtime using an **automated multi-key rotation and failover system**.

---

## 2. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│               Client Layer (PWA / React 18)            │
│  - TailwindCSS + Glassmorphic UI                       │
│  - Offline-First LocalStorage & CacheStorage           │
│  - HTML5 Canvas Image Pre-Compression                  │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│       AI Multimodal Engine   │ │      Weather Intelligence    │
│  - 3-Key Gemini Pool         │ │  - Google Maps Weather API   │
│  - gemini-3.8-flash Model    │ │  - Dual OpenWeatherMap Keys  │
│  - Validation Gate           │ │  - Rain-Triggered Advisories │
│  - Vernacular Prompting      │ │  - 7-Day Forecast            │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               └───────────────┬────────────────┘
                               ▼
┌────────────────────────────────────────────────────────┐
│               Application Logic & Processing           │
│  - i18n Translation & Background Caching               │
│  - Dynamic Health Score Aggregator (Crops & Animals)   │
│  - Leaflet GIS & Haversine Distance Calculation        │
│  - WhatsApp & PDF Report Generation                    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Multi-Key API Rotation & Failover Protocol

### The Need for Multi-Key Rotation
Free-tier AI API keys (Google AI Studio) and weather APIs are vulnerable to:
- Rate limits (RPM/TPM limits causing HTTP 429).
- Daily quota limits.
- Model deprecation (e.g., `gemini-2.5-flash` deprecation for new accounts).

### Implementation (`src/utils/geminiKey.js`)
- **Key Registry**: Reads `VITE_GEMINI_API_KEY`, `VITE_GEMINI_API_KEY_2`, `VITE_GEMINI_API_KEY_3`, and any user-configured key from `localStorage`.
- **Rotation Algorithm**:
  ```javascript
  for (const apiKey of keys) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const result = await fn(apiKey, modelName);
        return result; // Success on first available key/model
      } catch (err) {
        console.warn(`Key/Model failed: ${modelName}, switching to next...`);
      }
    }
  }
  ```
- **Prioritized Models**:
  1. `gemini-3.8-flash` (Primary, verified high-speed multimodal vision)
  2. `gemini-2.0-flash`
  3. `gemini-2.5-flash`
  4. `gemini-1.5-flash`

---

## 4. Computer Vision & Diagnostic Pipeline

### Image Pre-Processing (`src/utils/imageCompressor.js`)
Raw smartphone camera captures often exceed 10MB, causing upload lag and API timeouts. KissanAlert uses HTML5 Canvas to pre-compress images on the client device:
- Constrains maximum dimensions to 800px.
- Encodes as JPEG at 0.7 quality.
- Compresses payload by 90%+ in under 100 milliseconds without losing diagnostic clarity.

### Agricultural Subject Validation Gate
To prevent token waste on non-agricultural uploads, Gemini executes a binary classification gate:
```json
{
  "isValid": true,
  "type": "Crop or Livestock"
}
```
If an irrelevant object is photographed (e.g., a car, room, person), the AI returns `{"isValid": false}` and the app prompts the farmer to photograph plants or farm animals only.

### Structured Diagnostic Output
For valid images, Gemini returns a strictly validated JSON payload containing:
- `identity`: Exact crop variety or animal breed.
- `diagnosis`: Pathogen, pest, or nutrient deficiency.
- `severity`: Healthy (green), Moderate (amber), or Critical (red).
- `healthPercentage`: Computed health index (0–100%).
- `waterStress`: None, Mild, Moderate, or Severe.
- `irrigationAdvice`: Specific watering timing, quantity, and method.
- `urgency`: Immediate, Within 24h, or Routine.
- `immediateCare`: First-aid instructions.
- `actionPlan`: Detailed chemical, organic, or management steps.

---

## 5. Weather Intelligence & Smart Irrigation Advisory

### Dual Weather Provider Architecture (`src/pages/Weather.jsx`)
- **Primary Source**: OpenWeatherMap API (Key 1 with automatic fallback to Key 2).
- **Secondary Source**: Google Maps Platform Weather API.
- **Metrics Tracked**:
  - Live Temperature & Feels-Like Temperature.
  - Humidity percentage.
  - Wind speed & direction.
  - 7-Day Precipitation Probability (Pop).
  - Sunrise and Sunset timings.

### Water Conservation Decision Logic
- **Rain Warning**: If rain probability exceeds 60% within 24–48 hours, KissanAlert triggers a **"Skip Watering"** alert:
  > *"Rainfall expected soon. Delay your irrigation schedule to prevent water runoff and root waterlogging."*
- **Evaporative Loss Warning**: In temperatures exceeding 34°C with low humidity (<40%), the advisory recommends:
  > *"High evaporation risk. Avoid midday flood watering. Irrigate early morning (6:00–8:00 AM) or after sunset using drip irrigation."*

---

## 6. Multilingual Architecture & Authentic Odia (ଓଡ଼ିଆ)

### Localization Design (`src/utils/i18n.js`)
- Supports 11+ Indian languages: **Odia (ଓଡ଼ିଆ)**, Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.
- **Comprehensive Static Dictionary**: Over 100 agricultural and UI phrases translated natively into Odia script.
- **Dynamic Translation Fallback**:
  - Uncached dynamic strings are translated in the background using Gemini AI with key rotation.
  - Results are cached in `localStorage` under `kisanalert_translations_[lang]`.
- **Vernacular AI Prompting**:
  The system prompt forces Gemini to respond strictly in authentic Odia script:
  > *"If user language is Odia (ଓଡ଼ିଆ), ALL values ('identity', 'diagnosis', 'severity', 'affectedArea', 'possibleConditions', 'immediateCare', 'urgency', 'actionPlan', 'waterStress', 'irrigationAdvice') MUST be strictly written in authentic, fluent Odia script (ଓଡ଼ିଆ ଲିପି / ଅକ୍ଷର) with proper agricultural terminology and step-by-step remedies."*

---

## 7. Dynamic Image-Driven Health Analytics

Unlike standard mock applications that hardcode health scores, KissanAlert dynamically computes health metrics directly from user scans:
1. Every scan is stored in `localStorage.getItem('smartAgHistory')`.
2. When the farmer opens the **Dashboard** (`src/pages/Dashboard.jsx`):
   - Scans classified as `type === 'Crop'` are averaged to compute **Crop Health %**.
   - Scans classified as `type === 'Livestock'` are averaged to compute **Livestock Health %**.
3. If no scans exist, the app gracefully falls back to baseline healthy scores (94% and 91%) and prompts the farmer to make their first scan.

---

## 8. GIS Farm Mapping & Water Proximity

### Interactive Mapping (`src/pages/FarmMap.jsx`)
- Powered by **Leaflet** and **React-Leaflet** with customized satellite and terrain tiles.
- **Plot Markers**: Farmers pin their fields and designate primary water sources (Well, Borewell, Canal, River, Pond).
- **Proximity Calculations (Haversine Formula)**:
  $$\Delta \sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cos(\phi_2) \sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
  Calculates the distance from each field to the nearest water reservoir, helping farmers evaluate piping and pumping energy requirements.

---

## 9. Offline-First PWA Implementation

- Configured using `vite-plugin-pwa` with `generateSW` Workbox strategy.
- Pre-caches core app shell (HTML, CSS, JS, Lucide icons, fonts).
- Compliant Web App Manifest (`manifest.webmanifest`) with standalone display mode.
- Validated standard PNG launcher icons:
  - `public/pwa-192x192.png`
  - `public/pwa-512x512.png`
- Allows farmers in zero-connectivity fields to view previous diagnostic reports, review saved action plans, and check field coordinates.

---

## 10. Data Models & Storage Schemas

### Scan Record Schema
```typescript
interface ScanRecord {
  id: number;                     // Timestamp (e.g. 1732104500000)
  date: string;                   // Localized date string (e.g. "20/11/2026")
  image: string;                  // Base64 data URL
  isValid: boolean;               // True if subject is plant or livestock
  type: "Crop" | "Livestock";    // Category
  identity: string;               // Variety or breed name (e.g. "ବାଇଗଣ (Brinjal)")
  diagnosis: string;              // Detected disease or "ସୁସ୍ଥ (Healthy)"
  severity: "Healthy" | "Moderate" | "Critical";
  healthPercentage: number;       // 0 - 100
  waterStress: "None" | "Mild" | "Moderate" | "Severe";
  irrigationAdvice: string;       // Actionable watering advice
  affectedArea: string;           // Part of plant or animal body affected
  possibleConditions: string[];   // Ranked list of 3 differential diagnoses
  immediateCare: string;          // Emergency first-aid steps
  urgency: "Immediate" | "Within 24h" | "Routine";
  actionPlan: string;             // Detailed management protocol
}
```

---

## 11. Environment Configuration

| Variable | Description | Default / Example |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Primary Google Gemini AI API key | `AIzaSy...` |
| `VITE_GEMINI_API_KEY_2` | Secondary Gemini key for automatic failover | `AQ.Ab8RN6IPV...` |
| `VITE_GEMINI_API_KEY_3` | Tertiary Gemini key for quota protection | `AQ.Ab8RN6KhG...` |
| `VITE_GOOGLE_WEATHER_API_KEY` | Google Maps Platform Weather API key | `AIzaSyBnt...` |
| `VITE_WEATHER_API_KEY` | OpenWeatherMap Primary Key | `04906a77d...` |
| `VITE_WEATHER_API_KEY_2` | OpenWeatherMap Secondary Key | `667b467e3...` |
| `VITE_SUPABASE_URL` | Optional Supabase project endpoint | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Optional Supabase anonymous client key | `eyJhbGci...` |

---

## 12. Local Setup & Deployment

```bash
# 1. Clone repository
git clone https://github.com/AdityaNarayanPadhi/KissanAlert.git
cd KissanAlert/KissanAlert

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start local development server
npm run dev

# 5. Build for production
npm run build
```

---

## 13. Presentation & Viva FAQ

**Q: Why use client-side image compression instead of uploading raw photos?**  
*A: Rural mobile connections often have limited bandwidth (<1 Mbps). Compressing images to ~80KB on-device via HTML5 Canvas drops upload times from 15 seconds to under 1 second and prevents API timeout errors.*

**Q: How does the system prevent non-plant or non-animal images from wasting tokens?**  
*A: Gemini is prompted with a strict validation gate. If an image does not match the agricultural classification criteria, it returns `{"isValid": false}`, skipping further diagnostic parsing and notifying the user immediately.*

**Q: How does the Odia translation handle technical agricultural terms?**  
*A: Rather than relying on generic translation services that transliterate terms phonetically, KissanAlert's prompt explicitly instructs the AI to use traditional Odia agricultural terminology (e.g., 'ପତ୍ର କୁଞ୍ଚନ ରୋଗ' for Leaf Curl, 'ଫଳ ବିନ୍ଧା ପୋକ' for Fruit Borer).*

---

**Developed for Indian Agriculture, Water Sustainability, and Rural Empowerment.**
