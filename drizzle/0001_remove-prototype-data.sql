DELETE FROM "routine_occurrence"
WHERE "routine_id" IN ('morning-stretch', 'vitamins', 'walk', 'reading');
--> statement-breakpoint
DELETE FROM "routine_log"
WHERE "id" IN (
  'evt_01J8W4K9B7',
  'evt_01J8TX2M5C',
  'evt_01J8SP7Q4A',
  'evt_01J8QG3N8D'
);
--> statement-breakpoint
DELETE FROM "routine"
WHERE "id" IN ('morning-stretch', 'vitamins', 'walk', 'reading');
--> statement-breakpoint
DELETE FROM "category" AS "prototype_category"
WHERE "prototype_category"."normalized_name" IN (
  'personal',
  'movement',
  'health',
  'mind'
)
AND NOT EXISTS (
  SELECT 1
  FROM "routine"
  WHERE "routine"."user_id" = "prototype_category"."user_id"
    AND lower(trim("routine"."category")) = "prototype_category"."normalized_name"
);
