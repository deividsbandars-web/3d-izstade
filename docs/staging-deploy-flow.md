# Staging Deploy Flow

`staging.30sek24.com` should stay on the last verified deployment until a new build is reviewed.

Do not use plain `vercel --prod` for normal staging review builds. A production deployment on the `app-staging` project automatically moves the `staging.30sek24.com` alias unless `--skip-domain` is used.

## Safe Flow

1. Verify that the Vercel source context contains every remote-build input and no operator/QA scripts:

```bash
npm run check:vercel-source-context
```

2. Create a staging candidate deployment that does not move the staging alias:

```bash
npm run deploy:staging:preview
```

The source-deploy wrapper runs the same context check before linking or uploading. The prebuilt command remains available as a fallback and does not require the source-context preflight:

```bash
npm run deploy:staging:preview:prebuilt
```

3. Open the generated `app-staging-...vercel.app` URL and verify it.

4. Only after verification, promote it to the staging domain:

```bash
npm run promote:staging -- https://app-staging-<id>-esaukans-6934s-projects.vercel.app
```

The promote script refuses non-`app-staging` deployment URLs so production app deployments cannot be accidentally assigned to the staging domain.

## Current Rule

- `staging.30sek24.com` is the stable review URL.
- Preview deployments are temporary candidate URLs.
- Promotion to `staging.30sek24.com` is a separate explicit step.
