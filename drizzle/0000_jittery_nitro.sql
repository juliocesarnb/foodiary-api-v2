CREATE TYPE "public"."meal_input_type" AS ENUM('audio', 'picture');--> statement-breakpoint
CREATE TYPE "public"."meal_status" AS ENUM('uploading', 'processing', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "meal_status" NOT NULL,
	"input_type" "meal_input_type" NOT NULL,
	"input_file_key" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(100) NOT NULL,
	"foods" json,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"goal" varchar(8) NOT NULL,
	"gender" varchar(6) NOT NULL,
	"birth_date" date NOT NULL,
	"height" integer NOT NULL,
	"weight" integer NOT NULL,
	"activity_level" integer NOT NULL,
	"calories" integer NOT NULL,
	"proteins" integer NOT NULL,
	"carbohydrates" integer NOT NULL,
	"fats" integer NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;