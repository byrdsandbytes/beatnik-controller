# Beatnik Controller

![Beatnik Dashboard Screen](docs/images/iphone15_screen.webp)



Beatnik Controller is a project built with Angular that demonstrates integration with the Snapcast media streaming server. This repository provides a sample implementation to manage and control audio streams.

**NOTE: This project is work in progess and not ment to be installed yet.**

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)


## Prerequisites
- **Node.js:** For better Node.js version management, we recommend using nvm. First, install nvm by following the instructions on [nvm-sh/nvm](https://github.com/nvm-sh/nvm). Then, install the latest Node.js version with:
    ```bash
    nvm install node
    ```
- **Angular CLI:** Install Angular CLI globally using:
    ```bash
    npm install -g @angular/cli
    ```
- **Snapcast Server:** Install and configure the Snapcast media streaming server.
Find the tutorial here: https://github.com/byrdsandbytes/beatnik-pi

## Full Workflow

This section outlines the complete workflow for developing, building, and running the Beatnik Controller application.

### 1. Local Development

This is the standard workflow for making changes to the application on your local machine.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/byrdsandbytes/beatnik-controller.git
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
    This will start a local development server. Open your browser and navigate to `http://localhost:4200`. The app will automatically reload if you change any of the source files.

4.  **Code Scaffolding:**
    Use the `npm run generate:*` scripts in `package.json` to easily create new pages, components, or services. For example, to create a new service:
    ```bash
    npm run generate:service --name=my-new-service
    ```

### 2. Continuous Integration (CI) with GitHub Actions

This project uses GitHub Actions to automate building and checking the code.

-   **CI Workflow (`.github/workflows/ci.yml`):** On every push or pull request to the `master` branch, this workflow automatically:
    1.  Checks out the code.
    2.  Installs all necessary dependencies using `npm ci`.
    3.  Builds the Angular application for production. This step also implicitly runs the linter to ensure code quality.

-   **CodeQL Analysis (`.github/workflows/codeql.yml`):** This workflow runs on the same triggers and performs a deep security scan of the codebase to find potential vulnerabilities.

This automated process ensures that code merged into the `master` branch is always in a buildable and secure state.

### 3. Running with Docker

You can easily run the application in a containerized environment using Docker and Docker Compose.

## Prequisites

**Install Docker & docker compose**

Perform update and upgrade
```
sudo apt update && sudo apt upgrade -y
``````
Install Docker via Script
```
curl -fsSL test.docker.com -o get-docker.sh && sh get-docker.sh
```

Add current user to the Docker Group
```
sudo usermod -aG docker ${USER}
```

Check if it's running:
```
groups ${USER}
```

Check docker user
Reboot the Raspberry Pi to let the changes take effect
```
sudo reboot
```

## Installation

1.  **Build and Run the Docker Container:**
    From the root of the project, run the following command:
    ```bash
    docker compose up -d
    ```
    This command reads the `docker-compose.yml` file, builds the Docker image as defined in the `Dockerfile`, and starts the container.

2.  **Access the Application:**
    Once the container is running, open your browser and navigate to `http://localhost:8181`.

The `Dockerfile` is optimized for production and uses a multi-stage build. It first builds the Angular application and then serves the static output files from a lightweight Nginx web server, resulting in a small and efficient final image.

## Usage

- **Configuration:** Configure your Snapcast settings in the project's environment files.

