-- Creates a private review-only sponsor media bucket.
-- Public sponsor scene media must not be uploaded here directly.
-- Backend service-role access manages uploads for review workflow.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'expo_review_media',
  'expo_review_media',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
