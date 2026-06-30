# AGENTS.md

## Project Vision

This project is an AI-powered Web3D B2B Expo City.

Core product direction:
- futuristic Web3D expo city;
- monthly AI demo battles;
- Demo Arena;
- Expo Passport missions;
- sponsor zones and landmark sponsorship;
- standard booths and premium AI diagnostic booths;
- AI booth agents and AI Guide;
- sponsor lead generation;
- sponsor analytics dashboard;
- strong mobile Web3D performance.

## Performance Principles

Mobile performance is a first-class requirement.

Follow these principles:
- design mobile-first and test on constrained devices;
- introduce quality tiers later: low, medium, high, auto;
- cap DPR aggressively on mobile;
- avoid heavy real-time shadows on mobile;
- limit video textures and pause offscreen media;
- use zone-based visibility instead of rendering the whole city when possible;
- instance or pool repeated objects;
- prefer compressed and right-sized textures;
- keep raycasting limited to necessary interaction/debug targets;
- avoid adding heavy dependencies unless clearly justified.

Targets:
- mobile: stable 30 FPS;
- desktop: stable 60 FPS where possible.

## Visual Direction

Keep the city premium and intentional:
- futuristic corporate expo city;
- coherent premium floor system;
- sponsor boulevard;
- demo arena;
- AI reactor landmark;
- human-scale navigation moments;
- fog and skyline perimeter;
- clear sponsor surfaces and event landmarks.

Avoid:
- generic metaverse halls;
- random greybox/blockout geometry;
- visually cheap duplicated towers;
- cluttered booths/screens;
- hidden or overlapping sponsor screens;
- floor seams or accidental color-layer patches.

## Architecture Principles

Prefer configuration-driven content:
- sponsors config;
- booth config;
- zones config;
- events config;
- passport missions config.

Do not hardcode sponsor content deep inside visual components.

Keep modules separate:
- PerformanceMonitor;
- QualitySettings;
- ZoneManager;
- BoothSystem;
- DemoArena;
- PassportSystem;
- SponsorAnalytics;
- AIGuide.

## Validation Rules

For every implementation round:
- inspect existing structure before changing files;
- make minimal focused changes;
- run build, lint, typecheck, and tests when available;
- document validation failures honestly;
- state whether failures are related to the current changes;
- provide a changed files summary;
- create a delivery ZIP after each round;
- include screenshots only when visual/runtime UI changes can be captured safely;
- when visual scene changes are made, generate operator camera screenshots/contact sheet if a safe capture flow is available.
