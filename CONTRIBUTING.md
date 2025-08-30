# Contributing to Beatnik Controller

First off, thank you for considering contributing to Beatnik Controller! Any help is welcome and appreciated.

## Development Workflow

If you want to contribute with code, here is how to get the project running locally.

1.  **Fork and Clone the Repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/beatnik-controller.git
    cd beatnik-controller
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    ng serve
    ```
    This will start a local development server at `http://localhost:4200`. The app will automatically reload if you change any of the source files.

## Building Mobile Apps (Android/iOS)

This application is built with Ionic and Capacitor, which means you can also compile it as a native app for Android and iOS.

To build the mobile apps, you will need to have the necessary development environments set up for Android (Android Studio) and iOS (Xcode).

1.  **Add the desired platform:**
    ```bash
    npx capacitor add android
    npx capacitor add ios
    ```

2.  **Build the web assets:**
    ```bash
    npm run build
    ```

3.  **Sync the web assets with the native project:**
    ```bash
    npx capacitor sync
    ```

4.  **Open the native project in its IDE:**
    ```bash
    npx capacitor open android
    npx capacitor open ios
    ```

## Generate Assets
```bash
npx @capacitor/assets generate
```

From there, you can build and run the app on a device or emulator using the standard development tools for that platform.
