CREATE TABLE "brief_analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"brief_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now(),
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "business_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"key" text NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Jerusalem',
	"locale" text DEFAULT 'en',
	"accent_color" text DEFAULT '#6366f1',
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "calendar_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_account_id" uuid,
	"calendar_id" text DEFAULT '',
	"calendar_name" text DEFAULT '',
	"primary_calendar" boolean DEFAULT false,
	"color" text DEFAULT '',
	"selected" boolean DEFAULT true,
	"last_sync_at" timestamp with time zone,
	"sync_token" text DEFAULT '',
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_event_id" text DEFAULT '',
	"calendar_id" text DEFAULT 'local',
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"location" text DEFAULT '',
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"google_meet_link" text DEFAULT '',
	"status" text DEFAULT 'confirmed',
	"etag" text DEFAULT '',
	"google_updated_at" timestamp with time zone,
	"local_updated_at" timestamp with time zone,
	"sync_state" text DEFAULT 'local',
	"linked_task_id" uuid,
	"linked_lead_id" uuid,
	"linked_contact_id" uuid,
	"linked_project_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"calendar_id" text DEFAULT '',
	"sync_type" text DEFAULT 'incremental',
	"status" text DEFAULT 'ok',
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"items_pulled" integer DEFAULT 0,
	"items_pushed" integer DEFAULT 0,
	"error_message" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "carousel_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"carousel_id" uuid NOT NULL,
	"export_type" text DEFAULT 'slides',
	"files_json" jsonb DEFAULT '[]'::jsonb,
	"caption_copied" boolean DEFAULT false,
	"exported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carousel_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"source_type" text DEFAULT 'manual_topic',
	"source_id" text DEFAULT '',
	"source_payload" jsonb DEFAULT '{}'::jsonb,
	"platform" text DEFAULT 'instagram',
	"aspect_ratio" text DEFAULT '4:5',
	"slide_count" integer DEFAULT 4,
	"tone" text DEFAULT 'editorial',
	"audience" text DEFAULT '',
	"status" text DEFAULT 'draft',
	"caption_instagram" text DEFAULT '',
	"caption_linkedin" text DEFAULT '',
	"caption_short" text DEFAULT '',
	"caption_professional" text DEFAULT '',
	"hashtags" text DEFAULT '',
	"template" text DEFAULT 'dark_editorial',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carousel_slides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"carousel_id" uuid NOT NULL,
	"slide_number" integer DEFAULT 1,
	"slide_role" text DEFAULT '',
	"headline" text DEFAULT '',
	"subheadline" text DEFAULT '',
	"body_text" text DEFAULT '',
	"label" text DEFAULT '',
	"cta" text DEFAULT '',
	"visual_direction" text DEFAULT '',
	"image_prompt" text DEFAULT '',
	"negative_prompt" text DEFAULT '',
	"layout_style" text DEFAULT 'text_first',
	"text_position" text DEFAULT 'bottom_left',
	"background_style" text DEFAULT 'gradient_blue',
	"generated_image_url" text DEFAULT '',
	"imported_image_url" text DEFAULT '',
	"final_export_url" text DEFAULT '',
	"source_credit" text DEFAULT '',
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carousel_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"platform" text DEFAULT 'both',
	"aspect_ratio" text DEFAULT '4:5',
	"style" text DEFAULT '',
	"layout_json" jsonb DEFAULT '{}'::jsonb,
	"brand_json" jsonb DEFAULT '{}'::jsonb,
	"builtin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"client_name" text DEFAULT '',
	"project_name" text DEFAULT '',
	"lead_id" uuid,
	"raw_text" text DEFAULT '',
	"budget" text DEFAULT '',
	"deadline" text DEFAULT '',
	"links" text DEFAULT '',
	"analysis" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'analyzed',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"source_url" text DEFAULT '',
	"source_type" text DEFAULT '',
	"raw_snippet" text DEFAULT '',
	"confidence" integer DEFAULT 3,
	"valid" boolean DEFAULT true,
	"date_found" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discovery_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"params" jsonb NOT NULL,
	"result" jsonb,
	"error_message" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_message_id" text DEFAULT '',
	"google_thread_id" text DEFAULT '',
	"direction" text DEFAULT 'in',
	"from_email" text DEFAULT '',
	"from_name" text DEFAULT '',
	"to_emails" text DEFAULT '',
	"cc_emails" text DEFAULT '',
	"subject" text DEFAULT '',
	"snippet" text DEFAULT '',
	"body_preview" text DEFAULT '',
	"sent_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"unread" boolean DEFAULT false,
	"linked_lead_id" uuid,
	"linked_contact_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_thread_id" text DEFAULT '',
	"subject" text DEFAULT '',
	"participants" text DEFAULT '',
	"latest_snippet" text DEFAULT '',
	"last_message_at" timestamp with time zone,
	"linked_lead_id" uuid,
	"linked_contact_id" uuid,
	"status" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_draft_id" text DEFAULT '',
	"google_message_id" text DEFAULT '',
	"google_thread_id" text DEFAULT '',
	"lead_id" uuid,
	"contact_id" uuid,
	"to_email" text DEFAULT '',
	"subject" text DEFAULT '',
	"body" text DEFAULT '',
	"status" text DEFAULT 'draft',
	"mode" text DEFAULT 'manual',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"email" text DEFAULT '',
	"display_name" text DEFAULT '',
	"provider" text DEFAULT 'google',
	"access_token_enc" text DEFAULT '',
	"access_token_iv" text DEFAULT '',
	"refresh_token_enc" text DEFAULT '',
	"refresh_token_iv" text DEFAULT '',
	"token_expiry" timestamp with time zone,
	"scopes" text DEFAULT '',
	"connected_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"status" text DEFAULT 'connected'
);
--> statement-breakpoint
CREATE TABLE "inspiration_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text DEFAULT '',
	"image_url" text DEFAULT '',
	"category" text DEFAULT '',
	"tags" text DEFAULT '',
	"notes" text DEFAULT '',
	"why_saved" text DEFAULT '',
	"source" text DEFAULT '',
	"client" text DEFAULT '',
	"favorite" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"job_title" text DEFAULT '',
	"department" text DEFAULT '',
	"seniority" text DEFAULT '',
	"linkedin_url" text DEFAULT '',
	"email" text DEFAULT '',
	"email_status" text DEFAULT 'missing',
	"phone" text DEFAULT '',
	"source_url" text DEFAULT '',
	"source_type" text DEFAULT '',
	"confidence" integer DEFAULT 3,
	"relevance" integer DEFAULT 3,
	"why_relevant" text DEFAULT '',
	"suggested_angle" text DEFAULT '',
	"suggested_service" text DEFAULT '',
	"notes" text DEFAULT '',
	"status" text DEFAULT 'new',
	"do_not_contact" boolean DEFAULT false,
	"last_checked" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"company" text NOT NULL,
	"category" text DEFAULT '',
	"country" text DEFAULT '',
	"city" text DEFAULT '',
	"website" text DEFAULT '',
	"instagram" text DEFAULT '',
	"linkedin" text DEFAULT '',
	"facebook" text DEFAULT '',
	"contact_name" text DEFAULT '',
	"contact_role" text DEFAULT '',
	"email" text DEFAULT '',
	"phone" text DEFAULT '',
	"source" text DEFAULT '',
	"notes" text DEFAULT '',
	"relevance" integer DEFAULT 3,
	"opportunity_type" text DEFAULT '',
	"status" text DEFAULT 'new' NOT NULL,
	"next_follow_up" text,
	"last_contacted" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moodboard_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"moodboard_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moodboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"source" text DEFAULT '',
	"url" text DEFAULT '',
	"image_url" text DEFAULT '',
	"category" text DEFAULT '',
	"published_at" text,
	"summary" text DEFAULT '',
	"why_it_matters" text DEFAULT '',
	"relevance" integer DEFAULT 3,
	"tags" text DEFAULT '',
	"saved" boolean DEFAULT false,
	"action_idea" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"contact_id" uuid,
	"kind" text NOT NULL,
	"language" text DEFAULT 'en',
	"tone" text DEFAULT 'professional',
	"subject" text DEFAULT '',
	"body" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text DEFAULT '',
	"google_draft_id" text DEFAULT '',
	"google_message_id" text DEFAULT '',
	"email_thread_id" uuid,
	"send_mode" text DEFAULT '',
	"sent_at" timestamp with time zone,
	"reply_detected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid,
	"lead_id" uuid,
	"channel" text DEFAULT 'email',
	"status" text DEFAULT 'queued',
	"suggested_send_date" text,
	"last_contacted_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_sync_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'pending',
	"last_attempt_at" timestamp with time zone,
	"error_message" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"client" text DEFAULT '',
	"status" text DEFAULT 'active',
	"brief" text DEFAULT '',
	"budget" text DEFAULT '',
	"deadline" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tool" text DEFAULT 'generic',
	"project_type" text DEFAULT '',
	"output_type" text DEFAULT 'image',
	"fields" jsonb DEFAULT '{}'::jsonb,
	"tags" text DEFAULT '',
	"favorite" boolean DEFAULT false,
	"builtin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_test_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"result_notes" text DEFAULT '',
	"what_failed" text DEFAULT '',
	"improved_version" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_tool_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"tool" text NOT NULL,
	"kb_version" text DEFAULT '',
	"notes" text DEFAULT '',
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"output" jsonb DEFAULT '[]'::jsonb,
	"note" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT '',
	"description" text DEFAULT '',
	"sections" jsonb DEFAULT '[]'::jsonb,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"builtin" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"client_name" text DEFAULT '',
	"brand" text DEFAULT '',
	"contact" text DEFAULT '',
	"lead_id" uuid,
	"type" text DEFAULT '',
	"status" text DEFAULT 'draft',
	"description" text DEFAULT '',
	"goal" text DEFAULT '',
	"timeline" text DEFAULT '',
	"asset_count" text DEFAULT '',
	"revision_rounds" text DEFAULT '2',
	"usage_rights" text DEFAULT '',
	"budget" text DEFAULT '',
	"payment_terms" text DEFAULT '',
	"notes" text DEFAULT '',
	"sections" jsonb DEFAULT '[]'::jsonb,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"email_text" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"tool" text DEFAULT 'generic',
	"project_type" text DEFAULT '',
	"output_type" text DEFAULT 'image',
	"fields" jsonb DEFAULT '{}'::jsonb,
	"output" jsonb DEFAULT '[]'::jsonb,
	"tags" text DEFAULT '',
	"client" text DEFAULT '',
	"lead_id" uuid,
	"favorite" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"notes" text DEFAULT '',
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text DEFAULT '',
	"due_date" text,
	"lead_id" uuid,
	"project_id" uuid,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visual_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"carousel_id" uuid,
	"slide_id" uuid,
	"provider" text DEFAULT 'mock',
	"status" text DEFAULT 'done',
	"input_prompt" text DEFAULT '',
	"output_url" text DEFAULT '',
	"error_message" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"week_start" text,
	"week_end" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_review_action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"review_id" uuid NOT NULL,
	"text" text NOT NULL,
	"done" boolean DEFAULT false,
	"task_id" uuid
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" text NOT NULL,
	"week_start" text,
	"week_end" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brief_analysis_results" ADD CONSTRAINT "brief_analysis_results_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brief_analysis_results" ADD CONSTRAINT "brief_analysis_results_brief_id_client_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."client_briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_secrets" ADD CONSTRAINT "business_secrets_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_accounts" ADD CONSTRAINT "calendar_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_accounts" ADD CONSTRAINT "calendar_accounts_google_account_id_google_accounts_id_fk" FOREIGN KEY ("google_account_id") REFERENCES "public"."google_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_linked_task_id_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_linked_lead_id_leads_id_fk" FOREIGN KEY ("linked_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_linked_contact_id_lead_contacts_id_fk" FOREIGN KEY ("linked_contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_linked_project_id_projects_id_fk" FOREIGN KEY ("linked_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_log" ADD CONSTRAINT "calendar_sync_log_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_exports" ADD CONSTRAINT "carousel_exports_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_exports" ADD CONSTRAINT "carousel_exports_carousel_id_carousel_projects_id_fk" FOREIGN KEY ("carousel_id") REFERENCES "public"."carousel_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_projects" ADD CONSTRAINT "carousel_projects_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_slides" ADD CONSTRAINT "carousel_slides_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_slides" ADD CONSTRAINT "carousel_slides_carousel_id_carousel_projects_id_fk" FOREIGN KEY ("carousel_id") REFERENCES "public"."carousel_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_templates" ADD CONSTRAINT "carousel_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_briefs" ADD CONSTRAINT "client_briefs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_briefs" ADD CONSTRAINT "client_briefs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_sources" ADD CONSTRAINT "contact_sources_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_sources" ADD CONSTRAINT "contact_sources_contact_id_lead_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_jobs" ADD CONSTRAINT "discovery_jobs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_linked_lead_id_leads_id_fk" FOREIGN KEY ("linked_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_linked_contact_id_lead_contacts_id_fk" FOREIGN KEY ("linked_contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_linked_lead_id_leads_id_fk" FOREIGN KEY ("linked_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_linked_contact_id_lead_contacts_id_fk" FOREIGN KEY ("linked_contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_drafts" ADD CONSTRAINT "gmail_drafts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_drafts" ADD CONSTRAINT "gmail_drafts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_drafts" ADD CONSTRAINT "gmail_drafts_contact_id_lead_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspiration_items" ADD CONSTRAINT "inspiration_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moodboard_items" ADD CONSTRAINT "moodboard_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moodboard_items" ADD CONSTRAINT "moodboard_items_moodboard_id_moodboards_id_fk" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moodboard_items" ADD CONSTRAINT "moodboard_items_item_id_inspiration_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inspiration_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moodboards" ADD CONSTRAINT "moodboards_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_contact_id_lead_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_contact_id_lead_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."lead_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_queue" ADD CONSTRAINT "outreach_queue_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_sync_actions" ADD CONSTRAINT "pending_sync_actions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_test_notes" ADD CONSTRAINT "prompt_test_notes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_test_notes" ADD CONSTRAINT "prompt_test_notes_prompt_id_saved_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."saved_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_tool_profiles" ADD CONSTRAINT "prompt_tool_profiles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_saved_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."saved_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_prompts" ADD CONSTRAINT "saved_prompts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_prompts" ADD CONSTRAINT "saved_prompts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visual_generation_jobs" ADD CONSTRAINT "visual_generation_jobs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visual_generation_jobs" ADD CONSTRAINT "visual_generation_jobs_carousel_id_carousel_projects_id_fk" FOREIGN KEY ("carousel_id") REFERENCES "public"."carousel_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visual_generation_jobs" ADD CONSTRAINT "visual_generation_jobs_slide_id_carousel_slides_id_fk" FOREIGN KEY ("slide_id") REFERENCES "public"."carousel_slides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_review_action_items" ADD CONSTRAINT "weekly_review_action_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_review_action_items" ADD CONSTRAINT "weekly_review_action_items_review_id_weekly_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."weekly_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_review_action_items" ADD CONSTRAINT "weekly_review_action_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brief_analysis_results_business_brief_idx" ON "brief_analysis_results" USING btree ("business_id","brief_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_memberships_business_user_uq" ON "business_memberships" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_secrets_business_key_uq" ON "business_secrets" USING btree ("business_id","key");--> statement-breakpoint
CREATE INDEX "calendar_accounts_business_idx" ON "calendar_accounts" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "calendar_events_business_idx" ON "calendar_events" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_log_business_idx" ON "calendar_sync_log" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "carousel_exports_business_carousel_idx" ON "carousel_exports" USING btree ("business_id","carousel_id");--> statement-breakpoint
CREATE INDEX "carousel_projects_business_idx" ON "carousel_projects" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "carousel_slides_business_carousel_idx" ON "carousel_slides" USING btree ("business_id","carousel_id");--> statement-breakpoint
CREATE INDEX "carousel_templates_business_idx" ON "carousel_templates" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "client_briefs_business_idx" ON "client_briefs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "contact_sources_business_contact_idx" ON "contact_sources" USING btree ("business_id","contact_id");--> statement-breakpoint
CREATE INDEX "discovery_jobs_business_idx" ON "discovery_jobs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "email_messages_business_idx" ON "email_messages" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "email_threads_business_idx" ON "email_threads" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "gmail_drafts_business_idx" ON "gmail_drafts" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "google_accounts_business_uq" ON "google_accounts" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "inspiration_items_business_idx" ON "inspiration_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "lead_contacts_business_lead_idx" ON "lead_contacts" USING btree ("business_id","lead_id");--> statement-breakpoint
CREATE INDEX "lead_notes_business_lead_idx" ON "lead_notes" USING btree ("business_id","lead_id");--> statement-breakpoint
CREATE INDEX "leads_business_idx" ON "leads" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "moodboard_items_business_board_idx" ON "moodboard_items" USING btree ("business_id","moodboard_id");--> statement-breakpoint
CREATE UNIQUE INDEX "moodboard_items_board_item_uq" ON "moodboard_items" USING btree ("moodboard_id","item_id");--> statement-breakpoint
CREATE INDEX "moodboards_business_idx" ON "moodboards" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "news_items_business_idx" ON "news_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "outreach_messages_business_lead_idx" ON "outreach_messages" USING btree ("business_id","lead_id");--> statement-breakpoint
CREATE INDEX "outreach_queue_business_idx" ON "outreach_queue" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "pending_sync_actions_business_idx" ON "pending_sync_actions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "projects_business_idx" ON "projects" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "prompt_templates_business_idx" ON "prompt_templates" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "prompt_test_notes_business_prompt_idx" ON "prompt_test_notes" USING btree ("business_id","prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_tool_profiles_business_idx" ON "prompt_tool_profiles" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "prompt_versions_business_prompt_idx" ON "prompt_versions" USING btree ("business_id","prompt_id");--> statement-breakpoint
CREATE INDEX "proposal_templates_business_idx" ON "proposal_templates" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "proposal_versions_business_proposal_idx" ON "proposal_versions" USING btree ("business_id","proposal_id");--> statement-breakpoint
CREATE INDEX "proposals_business_idx" ON "proposals" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "saved_prompts_business_idx" ON "saved_prompts" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_business_key_uq" ON "settings" USING btree ("business_id","key");--> statement-breakpoint
CREATE INDEX "tasks_business_idx" ON "tasks" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "visual_generation_jobs_business_idx" ON "visual_generation_jobs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "weekly_reports_business_idx" ON "weekly_reports" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "weekly_review_action_items_business_review_idx" ON "weekly_review_action_items" USING btree ("business_id","review_id");--> statement-breakpoint
CREATE INDEX "weekly_reviews_business_idx" ON "weekly_reviews" USING btree ("business_id");