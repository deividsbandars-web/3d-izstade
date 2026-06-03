-- Creates the public-read Expo sponsor asset storage bucket.
-- Client uploads are limited to authenticated users and their own sponsor-assets/<auth.uid()> folder.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'expo_assets',
  'expo_assets',
  true,
  83886080,
  array[
    'application/octet-stream',
    'application/pdf',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'model/gltf+json',
    'model/gltf-binary',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "expo_assets_public_read" on storage.objects;
create policy "expo_assets_public_read"
on storage.objects
for select
using (bucket_id = 'expo_assets');

drop policy if exists "expo_sponsor_assets_authenticated_insert" on storage.objects;
create policy "expo_sponsor_assets_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'expo_assets'
  and (storage.foldername(name))[1] = 'sponsor-assets'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "expo_sponsor_assets_authenticated_update" on storage.objects;
create policy "expo_sponsor_assets_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'expo_assets'
  and (storage.foldername(name))[1] = 'sponsor-assets'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'expo_assets'
  and (storage.foldername(name))[1] = 'sponsor-assets'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "expo_sponsor_assets_authenticated_delete" on storage.objects;
create policy "expo_sponsor_assets_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'expo_assets'
  and (storage.foldername(name))[1] = 'sponsor-assets'
  and (storage.foldername(name))[2] = auth.uid()::text
);
