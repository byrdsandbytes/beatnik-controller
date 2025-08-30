# Build Pipeline

This document outlines the automated build and release process for the Beatnik Controller application, which uses GitHub Actions to create and publish a multi-platform Docker image.

## Overview

The build pipeline is defined in the `.github/workflows/build-docker.yml` file. Its primary purpose is to build the Beatnik Controller frontend, package it into a Docker image, and publish it to the GitHub Container Registry (GHCR).

The pipeline produces a Docker image that supports two different computer architectures:

-   `linux/amd64`: For standard desktop computers and servers.
-   `linux/arm64`: For ARM-based devices like the Raspberry Pi.

This allows you to run the same container on a wide range of hardware.

## How It Works

The pipeline is triggered in two ways:

1.  **Manual Trigger:** You can start the build manually from the "Actions" tab in the GitHub repository. This is useful for creating development or test builds. When triggered this way, you can specify a version number.
2.  **Automatic Trigger (on Git Tag):** The build runs automatically whenever a new Git tag matching the pattern `v*` (e.g., `v1.0.0`, `v1.2.3`) is pushed to the repository. This is the standard process for creating a new release.

### Build Steps

The build process consists of the following steps:

1.  **Checkout Code:** The workflow begins by checking out the latest source code from the repository.
2.  **Set Up Docker Buildx:** It initializes Docker Buildx, which is a tool that enables multi-platform builds.
3.  **Log in to GHCR:** The workflow logs into the GitHub Container Registry using a temporary token. This step is skipped for pull requests.
4.  **Extract Metadata:** It generates metadata for the Docker image, including tags and labels based on the Git history.
5.  **Determine Version:** The version number for the build is determined:
    -   If triggered by a Git tag (e.g., `v1.2.3`), the version is extracted from the tag (`1.2.3`).
    -   If triggered manually, it uses the version number provided at the start of the build.
6.  **Build and Push Image:** The workflow builds the Docker image using the `Dockerfile` at the root of the repository. It passes the version number as a build argument and builds for both `linux/amd64` and `linux/arm64` platforms. If the build was not triggered by a pull request, the resulting image is pushed to GHCR.

## Published Image

The final Docker image is published to the following location:

`ghcr.io/byrdsandbytes/beatnik-controller`

You can pull and run this image using standard Docker commands. For example, to pull the latest version:

```bash
docker pull ghcr.io/byrdsandbytes/beatnik-controller:latest
```
