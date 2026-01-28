-- avatarsバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- 誰でもavatarsバケットの画像を閲覧可能
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 認証済みユーザーは自分のアバターをアップロード可能
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- 認証済みユーザーは自分のアバターを更新可能
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- 認証済みユーザーは自分のアバターを削除可能
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
