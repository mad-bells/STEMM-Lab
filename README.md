# STEMM Lab

A React Native mobile app for classroom science activities. Teams of up to four students use the phone's built-in sensors to collect data during seven experiments across different STEMM fields. Results save to a shared Firebase leaderboard.

## Tech Stack

- React Native / Expo SDK 54
- Firebase Firestore (via REST API - no Firebase JS SDK)
- EAS Build (preview APK / production AAB)
- Jest + jest-expo (48 unit and integration tests)
- Firebase Test Lab (Robo tests on Android)

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)
- A Firebase project with Firestore enabled

## Getting Started

```bash
git clone https://github.com/mad-bells/stemm-lab.git
cd stemm-lab
npm install
```

Configure Firebase in `app.json` under the `extra` key:

```json
"extra": {
  "firebaseProjectId": "your-project-id",
  "firebaseApiKey": "your-api-key",
  "firebaseAuthDomain": "your-project.firebaseapp.com",
  "firebaseStorageBucket": "your-project.appspot.com"
}
```

Start the development server:

```bash
npx expo start
```

Scan the QR code with Expo Go to load the app on your device.

## Running Tests

```bash
npm test
# or with coverage
npx jest --coverage
```

48 tests across two suites:

- `__tests__/calculations.test.js` - physics utility functions (36 tests)
- `__tests__/firebase.test.js` - Firestore serialisation helpers (12 tests)

## Building

Builds are managed through Expo Application Services (EAS).

```bash
# Install EAS CLI
npm install -g eas-cli

# Preview APK (for sideloading / Firebase Test Lab)
npm run build:preview

# Production AAB (for Google Play)
npm run build:production
```

## Firebase Test Lab

Requires the `gcloud` CLI authenticated to the Firebase project.

```bash
# Install gcloud: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project stemm-lab-5c5fa

# Run Robo tests on Pixel 5 (API 30) and Pixel 6a (API 32)
node scripts/firebase-test-lab.js path/to/app.apk
```

## Project Structure

```
src/
  components/    # Shared UI components (AdBanner, VideoPickerButton, etc.)
  hooks/         # Custom hooks (useAccelerometer, useAudio, useLocation)
  screens/       # App screens (Home, Leaderboard, Team, 7 activity screens)
  services/      # Firebase, SQLite, notifications, background tasks
  utils/         # Physics calculations (calculations.js)
scripts/
  firebase-test-lab.js   # Firebase Test Lab runner
__tests__/
  calculations.test.js
  firebase.test.js
```

## Activities

| Activity | Sensors Used |
|---|---|
| Parachute Drop | Accelerometer |
| Sound Hunter | Microphone (expo-av) |
| Hand Fan | Gyroscope |
| Earthquake Structure | Gyroscope + GPS |
| Human Performance | Accelerometer |
| Reaction Board | Touch timing |
| Breathing Pace | Timer + manual input |

## Known Limitations

- Video upload to Firebase Storage requires the Blaze (pay-as-you-go) plan. The current Spark plan does not support Storage; recorded videos are kept on-device only.
- Firestore security rules are open for development. Tighten before any public release.
- AdMob banners show a placeholder in Expo Go; a native EAS build is required for real ads.
- Background fetch and some native features are disabled in Expo Go.

## License

MIT
