
INSERT INTO storage.buckets (id, name, public) VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Acesso público leitura produtos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'produtos');
CREATE POLICY "Upload público produtos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'produtos');
CREATE POLICY "Update público produtos" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'produtos');
CREATE POLICY "Delete público produtos" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'produtos');
