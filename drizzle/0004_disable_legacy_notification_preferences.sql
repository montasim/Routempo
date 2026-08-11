-- Earlier builds displayed these preferences but had no delivery channel.
-- Require every user to explicitly opt in now that browser permission and push
-- subscription state are part of the feature.
UPDATE "app_settings"
SET
	"notifications" = false,
	"weekly_summary" = false,
	"updated_at" = now()
WHERE "notifications" = true OR "weekly_summary" = true;
