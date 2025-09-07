export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_generated_content: {
        Row: {
          content_type: string
          created_at: string
          generated_content: Json
          id: string
          model_used: string | null
          prompt: string
          tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          generated_content: Json
          id?: string
          model_used?: string | null
          prompt: string
          tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          generated_content?: Json
          id?: string
          model_used?: string | null
          prompt?: string
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_tutoring_sessions: {
        Row: {
          ai_response: Json
          created_at: string
          follow_up_questions: string[] | null
          id: string
          lesson_id: string | null
          question: string
          response_rating: number | null
          session_duration_seconds: number | null
          user_id: string
        }
        Insert: {
          ai_response: Json
          created_at?: string
          follow_up_questions?: string[] | null
          id?: string
          lesson_id?: string | null
          question: string
          response_rating?: number | null
          session_duration_seconds?: number | null
          user_id: string
        }
        Update: {
          ai_response?: Json
          created_at?: string
          follow_up_questions?: string[] | null
          id?: string
          lesson_id?: string | null
          question?: string
          response_rating?: number | null
          session_duration_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutoring_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_answers: Json | null
          created_at: string
          explanation: string | null
          id: string
          interaction_type: string | null
          media_type: string | null
          media_url: string | null
          options: Json | null
          points: number | null
          question_order: number
          question_text: string
          question_type: string
        }
        Insert: {
          assessment_id: string
          correct_answers?: Json | null
          created_at?: string
          explanation?: string | null
          id?: string
          interaction_type?: string | null
          media_type?: string | null
          media_url?: string | null
          options?: Json | null
          points?: number | null
          question_order: number
          question_text: string
          question_type?: string
        }
        Update: {
          assessment_id?: string
          correct_answers?: Json | null
          created_at?: string
          explanation?: string | null
          id?: string
          interaction_type?: string | null
          media_type?: string | null
          media_url?: string | null
          options?: Json | null
          points?: number | null
          question_order?: number
          question_text?: string
          question_type?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessment_type: string
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          lesson_id: string | null
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          lesson_id?: string | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          lesson_id?: string | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          badge_metadata: Json | null
          certificate_type: string
          certificate_url: string | null
          course_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          path_id: string | null
          points_earned: number | null
          skill_level: string | null
          title: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          badge_metadata?: Json | null
          certificate_type?: string
          certificate_url?: string | null
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          path_id?: string | null
          points_earned?: number | null
          skill_level?: string | null
          title: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          badge_metadata?: Json | null
          certificate_type?: string
          certificate_url?: string | null
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          path_id?: string | null
          points_earned?: number | null
          skill_level?: string | null
          title?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          name: string
          updated_at: string
          user_id: string
          verification_url: string | null
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          name: string
          updated_at?: string
          user_id: string
          verification_url?: string | null
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          updated_at?: string
          user_id?: string
          verification_url?: string | null
        }
        Relationships: []
      }
      content_posts: {
        Row: {
          allow_comments: boolean
          author_id: string
          content: string
          content_type: string
          created_at: string
          delivery_method: string | null
          excerpt: string | null
          feature_image_url: string | null
          id: string
          published_at: string | null
          required_min_tier: string | null
          slug: string
          status: string
          tags: Json
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_comments?: boolean
          author_id: string
          content: string
          content_type?: string
          created_at?: string
          delivery_method?: string | null
          excerpt?: string | null
          feature_image_url?: string | null
          id?: string
          published_at?: string | null
          required_min_tier?: string | null
          slug: string
          status?: string
          tags?: Json
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_comments?: boolean
          author_id?: string
          content?: string
          content_type?: string
          created_at?: string
          delivery_method?: string | null
          excerpt?: string | null
          feature_image_url?: string | null
          id?: string
          published_at?: string | null
          required_min_tier?: string | null
          slug?: string
          status?: string
          tags?: Json
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_learning_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_issued: boolean
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number
          user_id: string
        }
        Insert: {
          certificate_issued?: boolean
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          user_id: string
        }
        Update: {
          certificate_issued?: boolean
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          accessibility_features: Json | null
          content_metadata: Json | null
          content_text: string | null
          content_url: string | null
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          interactive_content: Json | null
          is_preview_accessible: boolean | null
          is_required: boolean
          lesson_order: number
          lesson_type: string
          module_id: string
          required_subscription_tier: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          accessibility_features?: Json | null
          content_metadata?: Json | null
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          interactive_content?: Json | null
          is_preview_accessible?: boolean | null
          is_required?: boolean
          lesson_order: number
          lesson_type?: string
          module_id: string
          required_subscription_tier?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          accessibility_features?: Json | null
          content_metadata?: Json | null
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          interactive_content?: Json | null
          is_preview_accessible?: boolean | null
          is_required?: boolean
          lesson_order?: number
          lesson_type?: string
          module_id?: string
          required_subscription_tier?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      course_media_files: {
        Row: {
          course_id: string
          created_at: string
          creator_id: string
          description: string | null
          download_count: number | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          folder_path: string | null
          id: string
          is_public: boolean | null
          mime_type: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          creator_id: string
          description?: string | null
          download_count?: number | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          folder_path?: string | null
          id?: string
          is_public?: boolean | null
          mime_type: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          download_count?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          folder_path?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_media_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_media_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_media_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content_text: string | null
          content_type: string | null
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_preview_accessible: boolean | null
          is_required: boolean
          module_order: number
          required_subscription_tier: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_preview_accessible?: boolean | null
          is_required?: boolean
          module_order: number
          required_subscription_tier?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_preview_accessible?: boolean | null
          is_required?: boolean
          module_order?: number
          required_subscription_tier?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_surveys: {
        Row: {
          course_id: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_required: boolean | null
          lesson_id: string | null
          points_value: number | null
          settings: Json | null
          survey_type: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          points_value?: number | null
          settings?: Json | null
          survey_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          points_value?: number | null
          settings?: Json | null
          survey_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_surveys_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_surveys_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_surveys_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_surveys_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          allow_free_preview: boolean | null
          average_rating: number | null
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          enrollment_count: number
          estimated_duration_hours: number | null
          id: string
          instructor_id: string | null
          is_featured: boolean
          is_published: boolean
          preview_content_percentage: number | null
          required_subscription_tier: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_free_preview?: boolean | null
          average_rating?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          enrollment_count?: number
          estimated_duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean
          is_published?: boolean
          preview_content_percentage?: number | null
          required_subscription_tier?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_free_preview?: boolean | null
          average_rating?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          enrollment_count?: number
          estimated_duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean
          is_published?: boolean
          preview_content_percentage?: number | null
          required_subscription_tier?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      interactive_activities: {
        Row: {
          activity_type: string
          content: Json
          created_at: string
          description: string | null
          id: string
          lesson_id: string
          points_value: number | null
          settings: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          lesson_id: string
          points_value?: number | null
          settings?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string
          points_value?: number | null
          settings?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactive_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_analytics: {
        Row: {
          course_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          lesson_id: string | null
          session_id: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          lesson_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          lesson_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_analytics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_analytics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_analytics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "learning_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_goals: {
        Row: {
          associated_courses: string[] | null
          associated_paths: string[] | null
          created_at: string
          description: string | null
          id: string
          progress_percentage: number | null
          status: string
          target_completion_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          associated_courses?: string[] | null
          associated_paths?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string
          target_completion_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          associated_courses?: string[] | null
          associated_paths?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string
          target_completion_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          category: string | null
          created_at: string
          creator_id: string
          description: string | null
          difficulty_level: string | null
          estimated_total_hours: number | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          difficulty_level?: string | null
          estimated_total_hours?: number | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_total_hours?: number | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_predictions: {
        Row: {
          accuracy_score: number | null
          created_at: string
          expires_at: string | null
          id: string
          model_version: string | null
          prediction_data: Json
          prediction_type: string
          target_id: string | null
          target_type: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          model_version?: string | null
          prediction_data: Json
          prediction_type: string
          target_id?: string | null
          target_type: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          model_version?: string | null
          prediction_data?: Json
          prediction_type?: string
          target_id?: string | null
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_recommendations: {
        Row: {
          confidence_score: number | null
          content: Json
          course_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_viewed: boolean | null
          recommendation_type: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: Json
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          recommendation_type: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: Json
          course_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          recommendation_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_recommendations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_recommendations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_recommendations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
        ]
      }
      lesson_content_blocks: {
        Row: {
          block_order: number
          block_type: string
          content: Json
          created_at: string
          creator_id: string
          id: string
          lesson_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          block_order: number
          block_type: string
          content?: Json
          created_at?: string
          creator_id: string
          id?: string
          lesson_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          block_order?: number
          block_type?: string
          content?: Json
          created_at?: string
          creator_id?: string
          id?: string
          lesson_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          lesson_id: string
          module_id: string
          notes: string | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          lesson_id: string
          module_id: string
          notes?: string | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string
          module_id?: string
          notes?: string | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      medicare_compliance: {
        Row: {
          ahip_certification_completed: boolean | null
          ahip_completion_date: string | null
          annual_training_hours: number | null
          cms_marketing_training: boolean | null
          compliance_score: number | null
          compliance_year: number
          created_at: string
          fraud_waste_abuse_training: boolean | null
          id: string
          last_updated: string | null
          privacy_security_training: boolean | null
          required_training_hours: number | null
          state_specific_training: boolean | null
          user_id: string
        }
        Insert: {
          ahip_certification_completed?: boolean | null
          ahip_completion_date?: string | null
          annual_training_hours?: number | null
          cms_marketing_training?: boolean | null
          compliance_score?: number | null
          compliance_year?: number
          created_at?: string
          fraud_waste_abuse_training?: boolean | null
          id?: string
          last_updated?: string | null
          privacy_security_training?: boolean | null
          required_training_hours?: number | null
          state_specific_training?: boolean | null
          user_id: string
        }
        Update: {
          ahip_certification_completed?: boolean | null
          ahip_completion_date?: string | null
          annual_training_hours?: number | null
          cms_marketing_training?: boolean | null
          compliance_score?: number | null
          compliance_year?: number
          created_at?: string
          fraud_waste_abuse_training?: boolean | null
          id?: string
          last_updated?: string | null
          privacy_security_training?: boolean | null
          required_training_hours?: number | null
          state_specific_training?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          module_id: string
          score: number | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          module_id: string
          score?: number | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string
          score?: number | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          subscribed: boolean
          subscription_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          subscribed?: boolean
          subscription_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          subscribed?: boolean
          subscription_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      path_courses: {
        Row: {
          course_id: string
          course_order: number
          created_at: string
          id: string
          is_required: boolean
          path_id: string
        }
        Insert: {
          course_id: string
          course_order: number
          created_at?: string
          id?: string
          is_required?: boolean
          path_id: string
        }
        Update: {
          course_id?: string
          course_order?: number
          created_at?: string
          id?: string
          is_required?: boolean
          path_id?: string
        }
        Relationships: []
      }
      path_enrollments: {
        Row: {
          completed_at: string | null
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          path_id: string
          progress_percentage: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          path_id: string
          progress_percentage?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          path_id?: string
          progress_percentage?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string
          email_verified: boolean
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          license_number: string | null
          license_state: string | null
          npn: string
          npn_verified: boolean | null
          onboarding_completed: boolean
          phone_number: string | null
          phone_verified: boolean
          position_title: string | null
          profile_completed: boolean
          updated_at: string
          user_id: string
          verification_badges: Json | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          license_number?: string | null
          license_state?: string | null
          npn: string
          npn_verified?: boolean | null
          onboarding_completed?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          position_title?: string | null
          profile_completed?: boolean
          updated_at?: string
          user_id: string
          verification_badges?: Json | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          license_number?: string | null
          license_state?: string | null
          npn?: string
          npn_verified?: boolean | null
          onboarding_completed?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          position_title?: string | null
          profile_completed?: boolean
          updated_at?: string
          user_id?: string
          verification_badges?: Json | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          correct_answers: Json | null
          created_at: string
          id: string
          is_required: boolean | null
          options: Json | null
          points: number | null
          question_order: number
          question_text: string
          question_type: string
          survey_id: string
        }
        Insert: {
          correct_answers?: Json | null
          created_at?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          points?: number | null
          question_order: number
          question_text: string
          question_type: string
          survey_id: string
        }
        Update: {
          correct_answers?: Json | null
          created_at?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          points?: number | null
          question_order?: number
          question_text?: string
          question_type?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "course_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          course_id: string | null
          created_at: string | null
          earned_at: string | null
          id: string
          lesson_id: string | null
          points_earned: number | null
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          course_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          lesson_id?: string | null
          points_earned?: number | null
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          course_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          lesson_id?: string | null
          points_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_course_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_achievements_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_assessment_attempts: {
        Row: {
          answers: Json | null
          assessment_id: string
          attempt_number: number
          completed_at: string | null
          created_at: string
          id: string
          passed: boolean | null
          score: number | null
          started_at: string
          time_taken_minutes: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          assessment_id: string
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          time_taken_minutes?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          assessment_id?: string
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          time_taken_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          last_activity_date: string | null
          level_name: string | null
          streak_days: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level_name?: string | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level_name?: string | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean
          session_id: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          session_id: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_survey_responses: {
        Row: {
          created_at: string
          id: string
          points_earned: number | null
          question_id: string
          response: Json
          survey_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_earned?: number | null
          question_id: string
          response: Json
          survey_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_earned?: number | null
          question_id?: string
          response?: Json
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "course_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      webinar_registrations: {
        Row: {
          attended: boolean
          attended_at: string | null
          id: string
          registered_at: string
          user_id: string
          webinar_id: string
        }
        Insert: {
          attended?: boolean
          attended_at?: string | null
          id?: string
          registered_at?: string
          user_id: string
          webinar_id: string
        }
        Update: {
          attended?: boolean
          attended_at?: string | null
          id?: string
          registered_at?: string
          user_id?: string
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          access_type: string
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor_name: string | null
          is_published: boolean
          max_attendees: number | null
          meeting_id: string | null
          meeting_url: string | null
          passcode: string | null
          presenter_bio: string | null
          presenter_name: string | null
          recording_urls: Json | null
          registration_count: number
          scheduled_at: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          zoom_created: boolean | null
          zoom_join_url: string | null
          zoom_meeting_uuid: string | null
          zoom_passcode: string | null
          zoom_registration_url: string | null
          zoom_webinar_id: string | null
        }
        Insert: {
          access_type?: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_name?: string | null
          is_published?: boolean
          max_attendees?: number | null
          meeting_id?: string | null
          meeting_url?: string | null
          passcode?: string | null
          presenter_bio?: string | null
          presenter_name?: string | null
          recording_urls?: Json | null
          registration_count?: number
          scheduled_at: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          zoom_created?: boolean | null
          zoom_join_url?: string | null
          zoom_meeting_uuid?: string | null
          zoom_passcode?: string | null
          zoom_registration_url?: string | null
          zoom_webinar_id?: string | null
        }
        Update: {
          access_type?: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_name?: string | null
          is_published?: boolean
          max_attendees?: number | null
          meeting_id?: string | null
          meeting_url?: string | null
          passcode?: string | null
          presenter_bio?: string | null
          presenter_name?: string | null
          recording_urls?: Json | null
          registration_count?: number
          scheduled_at?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          zoom_created?: boolean | null
          zoom_join_url?: string | null
          zoom_meeting_uuid?: string | null
          zoom_passcode?: string | null
          zoom_registration_url?: string | null
          zoom_webinar_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      course_statistics: {
        Row: {
          avg_progress: number | null
          category: string | null
          completion_rate: number | null
          completions: number | null
          enrollment_count: number | null
          id: string | null
          instructor_id: string | null
          is_published: boolean | null
          title: string | null
        }
        Relationships: []
      }
      instructor_course_overview: {
        Row: {
          active_learners: number | null
          avg_progress: number | null
          completions: number | null
          course_id: string | null
          enrollment_count: number | null
          instructor_id: string | null
          title: string | null
          total_engagement_minutes: number | null
        }
        Relationships: []
      }
      user_learning_overview: {
        Row: {
          avg_progress: number | null
          completed_courses: number | null
          enrolled_courses: number | null
          first_name: string | null
          last_name: string | null
          streak_days: number | null
          total_points: number | null
          total_study_time: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_points_and_achievements: {
        Args: {
          p_achievement_data?: Json
          p_achievement_type: string
          p_course_id?: string
          p_lesson_id?: string
          p_points: number
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_course_progress: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: number
      }
      calculate_medicare_compliance_score: {
        Args: {
          ahip_completed: boolean
          cms_training: boolean
          fraud_training: boolean
          privacy_training: boolean
          required_hours: number
          state_training: boolean
          training_hours: number
        }
        Returns: number
      }
      calculate_profile_completion: {
        Args: {
          _avatar_url: string
          _bio: string
          _company_name: string
          _first_name: string
          _last_name: string
          _license_state: string
          _phone_number: string
          _position_title: string
        }
        Returns: number
      }
      get_user_learning_pattern: {
        Args: { user_uuid: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "instructional_designer"
        | "facilitator"
        | "agent"
        | "prospect"
        | "business_leader"
        | "author"
        | "analyst"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "instructional_designer",
        "facilitator",
        "agent",
        "prospect",
        "business_leader",
        "author",
        "analyst",
      ],
    },
  },
} as const
