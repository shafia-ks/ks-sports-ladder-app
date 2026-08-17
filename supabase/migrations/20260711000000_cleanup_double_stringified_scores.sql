-- Clean up double-stringified JSON arrays in set_scores
UPDATE matches
SET set_scores = (set_scores #>> '{}')::jsonb
WHERE jsonb_typeof(set_scores) = 'string';
