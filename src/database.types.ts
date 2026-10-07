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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          body_excerpt: string | null
          business_profile_id: string | null
          channel: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          direction: string | null
          id: string
          metadata: Json
          occurred_at: string
          opportunity_id: string | null
          organization_id: string
          outcome: string | null
          sentiment: string | null
          subject: string | null
        }
        Insert: {
          activity_type: string
          body_excerpt?: string | null
          business_profile_id?: string | null
          channel?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          opportunity_id?: string | null
          organization_id: string
          outcome?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Update: {
          activity_type?: string
          body_excerpt?: string | null
          business_profile_id?: string | null
          channel?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          opportunity_id?: string | null
          organization_id?: string
          outcome?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "activities_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "activities_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "activities_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "activities_organization_id_contact_id_fkey"
            columns: ["organization_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_opportunity_id_fkey"
            columns: ["organization_id", "opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_name: string
          business_profile_id: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          input_context: Json
          metrics: Json
          organization_id: string
          output_summary: Json
          started_at: string
          status: string
        }
        Insert: {
          agent_name: string
          business_profile_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          input_context?: Json
          metrics?: Json
          organization_id: string
          output_summary?: Json
          started_at?: string
          status?: string
        }
        Update: {
          agent_name?: string
          business_profile_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          input_context?: Json
          metrics?: Json
          organization_id?: string
          output_summary?: Json
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "agent_runs_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "agent_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          entity_id: string | null
          entity_type: string
          event_metadata: Json
          event_type: string
          id: number
          occurred_at: string
          organization_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          entity_id?: string | null
          entity_type: string
          event_metadata?: Json
          event_type: string
          id?: never
          occurred_at?: string
          organization_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          entity_id?: string | null
          entity_type?: string
          event_metadata?: Json
          event_type?: string
          id?: never
          occurred_at?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          active: boolean
          channel_policy: Json
          created_at: string
          icp_rules: Json
          id: string
          name: string
          offer_catalog: Json
          organization_id: string
          primary_goal: string | null
          score_weights: Json
          segment: string | null
          slug: string
          target_personas: Json
          updated_at: string
          value_proposition: string | null
          website: string | null
        }
        Insert: {
          active?: boolean
          channel_policy?: Json
          created_at?: string
          icp_rules?: Json
          id?: string
          name: string
          offer_catalog?: Json
          organization_id: string
          primary_goal?: string | null
          score_weights?: Json
          segment?: string | null
          slug: string
          target_personas?: Json
          updated_at?: string
          value_proposition?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean
          channel_policy?: Json
          created_at?: string
          icp_rules?: Json
          id?: string
          name?: string
          offer_catalog?: Json
          organization_id?: string
          primary_goal?: string | null
          score_weights?: Json
          segment?: string | null
          slug?: string
          target_personas?: Json
          updated_at?: string
          value_proposition?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buying_signals: {
        Row: {
          business_profile_id: string | null
          company_id: string
          confidence: number
          consumed_at: string | null
          contact_id: string | null
          created_at: string
          detected_at: string
          evidence: Json
          expires_at: string | null
          id: string
          organization_id: string
          signal_label: string
          signal_strength: number
          signal_type: string
          source_provider: string
          source_reference: string | null
          status: string
        }
        Insert: {
          business_profile_id?: string | null
          company_id: string
          confidence?: number
          consumed_at?: string | null
          contact_id?: string | null
          created_at?: string
          detected_at?: string
          evidence?: Json
          expires_at?: string | null
          id?: string
          organization_id: string
          signal_label: string
          signal_strength?: number
          signal_type: string
          source_provider: string
          source_reference?: string | null
          status?: string
        }
        Update: {
          business_profile_id?: string | null
          company_id?: string
          confidence?: number
          consumed_at?: string | null
          contact_id?: string | null
          created_at?: string
          detected_at?: string
          evidence?: Json
          expires_at?: string | null
          id?: string
          organization_id?: string
          signal_label?: string
          signal_strength?: number
          signal_type?: string
          source_provider?: string
          source_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "buying_signals_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "buying_signals_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "buying_signals_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "buying_signals_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "buying_signals_organization_id_contact_id_fkey"
            columns: ["organization_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "buying_signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_permissions: {
        Row: {
          channel: string
          company_id: string | null
          contact_id: string | null
          expires_at: string | null
          id: string
          lawful_basis: string | null
          observed_at: string
          organization_id: string
          permission_status: string
          source_reference: string | null
          updated_at: string
        }
        Insert: {
          channel: string
          company_id?: string | null
          contact_id?: string | null
          expires_at?: string | null
          id?: string
          lawful_basis?: string | null
          observed_at?: string
          organization_id: string
          permission_status?: string
          source_reference?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          company_id?: string | null
          contact_id?: string | null
          expires_at?: string | null
          id?: string
          lawful_basis?: string | null
          observed_at?: string
          organization_id?: string
          permission_status?: string
          source_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_permissions_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "channel_permissions_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "channel_permissions_organization_id_contact_id_fkey"
            columns: ["organization_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "channel_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_line: string | null
          city: string | null
          cnae: string | null
          country: string
          created_at: string
          data_confidence: number
          email: string | null
          employee_band: string | null
          id: string
          industry: string | null
          last_enriched_at: string | null
          last_signal_at: string | null
          legal_name: string
          lifecycle_stage: string
          normalized_name: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          revenue_band: string | null
          source_last_seen_at: string
          source_reference: string | null
          source_type: string
          state: string | null
          tax_id: string | null
          trade_name: string | null
          updated_at: string
          verification_status: string
          website_domain: string | null
          website_url: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          cnae?: string | null
          country?: string
          created_at?: string
          data_confidence?: number
          email?: string | null
          employee_band?: string | null
          id?: string
          industry?: string | null
          last_enriched_at?: string | null
          last_signal_at?: string | null
          legal_name: string
          lifecycle_stage?: string
          normalized_name?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          revenue_band?: string | null
          source_last_seen_at?: string
          source_reference?: string | null
          source_type?: string
          state?: string | null
          tax_id?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: string
          website_domain?: string | null
          website_url?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          cnae?: string | null
          country?: string
          created_at?: string
          data_confidence?: number
          email?: string | null
          employee_band?: string | null
          id?: string
          industry?: string | null
          last_enriched_at?: string | null
          last_signal_at?: string | null
          legal_name?: string
          lifecycle_stage?: string
          normalized_name?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          revenue_band?: string | null
          source_last_seen_at?: string
          source_reference?: string | null
          source_type?: string
          state?: string | null
          tax_id?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: string
          website_domain?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_import_batches: {
        Row: {
          accepted_rows: number
          created_at: string
          created_by: string
          file_sha256: string
          id: string
          organization_id: string
          skipped_rows: number
          status: string
          total_rows: number
        }
        Insert: {
          accepted_rows: number
          created_at?: string
          created_by: string
          file_sha256: string
          id?: string
          organization_id: string
          skipped_rows: number
          status?: string
          total_rows: number
        }
        Update: {
          accepted_rows?: number
          created_at?: string
          created_by?: string
          file_sha256?: string
          id?: string
          organization_id?: string
          skipped_rows?: number
          status?: string
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_import_items: {
        Row: {
          batch_id: string
          company_id: string | null
          created_at: string
          id: string
          organization_id: string
          outcome: string
          reason_code: string | null
          source_line: number
        }
        Insert: {
          batch_id: string
          company_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          outcome: string
          reason_code?: string | null
          source_line: number
        }
        Update: {
          batch_id?: string
          company_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          outcome?: string
          reason_code?: string | null
          source_line?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_import_items_organization_id_batch_id_fkey"
            columns: ["organization_id", "batch_id"]
            isOneToOne: false
            referencedRelation: "company_import_batches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "company_import_items_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "company_import_items_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      company_scores: {
        Row: {
          business_profile_id: string
          company_id: string
          confidence: number
          contactability: number
          engagement: number
          icp_fit: number
          id: string
          intent: number
          next_review_at: string | null
          organization_id: string
          reasons: Json
          scored_at: string
          timing: number
          total_score: number
        }
        Insert: {
          business_profile_id: string
          company_id: string
          confidence?: number
          contactability?: number
          engagement?: number
          icp_fit?: number
          id?: string
          intent?: number
          next_review_at?: string | null
          organization_id: string
          reasons?: Json
          scored_at?: string
          timing?: number
          total_score?: number
        }
        Update: {
          business_profile_id?: string
          company_id?: string
          confidence?: number
          contactability?: number
          engagement?: number
          icp_fit?: number
          id?: string
          intent?: number
          next_review_at?: string | null
          organization_id?: string
          reasons?: Json
          scored_at?: string
          timing?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_scores_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "company_scores_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "company_scores_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "company_scores_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "company_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          data_confidence: number
          department: string | null
          email: string | null
          facebook_url: string | null
          full_name: string
          id: string
          instagram_url: string | null
          is_decision_maker: boolean
          job_title: string | null
          last_verified_at: string | null
          linkedin_url: string | null
          organization_id: string
          persona: string | null
          phone: string | null
          seniority: string | null
          source_reference: string | null
          source_type: string
          updated_at: string
          verification_status: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          data_confidence?: number
          department?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name: string
          id?: string
          instagram_url?: string | null
          is_decision_maker?: boolean
          job_title?: string | null
          last_verified_at?: string | null
          linkedin_url?: string | null
          organization_id: string
          persona?: string | null
          phone?: string | null
          seniority?: string | null
          source_reference?: string | null
          source_type?: string
          updated_at?: string
          verification_status?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          data_confidence?: number
          department?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          is_decision_maker?: boolean
          job_title?: string | null
          last_verified_at?: string | null
          linkedin_url?: string | null
          organization_id?: string
          persona?: string | null
          phone?: string | null
          seniority?: string | null
          source_reference?: string | null
          source_type?: string
          updated_at?: string
          verification_status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_facts: {
        Row: {
          company_id: string
          confidence: number
          contact_id: string | null
          created_at: string
          expires_at: string | null
          field_name: string
          field_value: Json
          id: string
          is_current: boolean
          observed_at: string
          organization_id: string
          source_provider: string
          source_reference: string | null
        }
        Insert: {
          company_id: string
          confidence?: number
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          field_name: string
          field_value: Json
          id?: string
          is_current?: boolean
          observed_at?: string
          organization_id: string
          source_provider: string
          source_reference?: string | null
        }
        Update: {
          company_id?: string
          confidence?: number
          contact_id?: string | null
          created_at?: string
          expires_at?: string | null
          field_name?: string
          field_value?: Json
          id?: string
          is_current?: boolean
          observed_at?: string
          organization_id?: string
          source_provider?: string
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_facts_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "enrichment_facts_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrichment_facts_organization_id_contact_id_fkey"
            columns: ["organization_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrichment_facts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_health: {
        Row: {
          channel: string
          id: string
          last_error: string | null
          last_failure_at: string | null
          last_success_at: string | null
          metadata: Json
          organization_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          id?: string
          last_error?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json
          organization_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          id?: string
          last_error?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json
          organization_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_health_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          active: boolean
          created_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          amount: number | null
          business_profile_id: string
          company_id: string
          created_at: string
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          next_action_at: string | null
          organization_id: string
          owner_user_id: string | null
          primary_contact_id: string | null
          probability: number | null
          source: string | null
          stage: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          business_profile_id: string
          company_id: string
          created_at?: string
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          next_action_at?: string | null
          organization_id: string
          owner_user_id?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          business_profile_id?: string
          company_id?: string
          created_at?: string
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          next_action_at?: string | null
          organization_id?: string
          owner_user_id?: string | null
          primary_contact_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_primary_contact_id_fkey"
            columns: ["organization_id", "primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      prospecting_states: {
        Row: {
          business_profile_id: string
          company_id: string
          entered_stage_at: string
          id: string
          last_activity_at: string | null
          next_action_at: string | null
          organization_id: string
          owner_user_id: string | null
          stage: string
          stage_reason: string | null
          updated_at: string
        }
        Insert: {
          business_profile_id: string
          company_id: string
          entered_stage_at?: string
          id?: string
          last_activity_at?: string | null
          next_action_at?: string | null
          organization_id: string
          owner_user_id?: string | null
          stage?: string
          stage_reason?: string | null
          updated_at?: string
        }
        Update: {
          business_profile_id?: string
          company_id?: string
          entered_stage_at?: string
          id?: string
          last_activity_at?: string | null
          next_action_at?: string | null
          organization_id?: string
          owner_user_id?: string | null
          stage?: string
          stage_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_states_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "prospecting_states_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "prospecting_states_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "prospecting_states_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "prospecting_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          business_profile_id: string
          channel: string | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          due_at: string
          execution_mode: string
          expires_at: string | null
          id: string
          opportunity_id: string | null
          organization_id: string
          outcome: string | null
          payload: Json
          priority: number
          rationale: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          business_profile_id: string
          channel?: string | null
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          due_at?: string
          execution_mode?: string
          expires_at?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id: string
          outcome?: string | null
          payload?: Json
          priority?: number
          rationale: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          business_profile_id?: string
          channel?: string | null
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          due_at?: string
          execution_mode?: string
          expires_at?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id?: string
          outcome?: string | null
          payload?: Json
          priority?: number
          rationale?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommended_actions_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_contact_id_fkey"
            columns: ["organization_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_opportunity_id_fkey"
            columns: ["organization_id", "opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_channel_config: {
        Row: {
          approval_reference: string | null
          discovery_enabled: boolean
          inbound_enabled: boolean
          integration_mode: string
          organization_id: string
          outbound_enabled: boolean
          platform: string
          updated_at: string
        }
        Insert: {
          approval_reference?: string | null
          discovery_enabled?: boolean
          inbound_enabled?: boolean
          integration_mode?: string
          organization_id: string
          outbound_enabled?: boolean
          platform: string
          updated_at?: string
        }
        Update: {
          approval_reference?: string | null
          discovery_enabled?: boolean
          inbound_enabled?: boolean
          integration_mode?: string
          organization_id?: string
          outbound_enabled?: boolean
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_channel_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_prospect_candidates: {
        Row: {
          account_key: string
          company_id: string | null
          company_label: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          platform: string
          profile_url: string
          review_reason: string | null
          review_status: string
          reviewed_at: string | null
          reviewer_user_id: string | null
          source_kind: string
          source_reference: string | null
          updated_at: string
        }
        Insert: {
          account_key: string
          company_id?: string | null
          company_label: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          platform: string
          profile_url: string
          review_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          source_kind: string
          source_reference?: string | null
          updated_at?: string
        }
        Update: {
          account_key?: string
          company_id?: string | null
          company_label?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          platform?: string
          profile_url?: string
          review_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          source_kind?: string
          source_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_prospect_candidates_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "social_prospect_candidates_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_prospect_candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_360_v: {
        Row: {
          account_confidence: number | null
          active_contacts: number | null
          active_signals: number | null
          business_profile: string | null
          business_profile_id: string | null
          city: string | null
          cnae: string | null
          company_id: string | null
          company_name: string | null
          contactability: number | null
          decision_makers: number | null
          engagement: number | null
          grit_score: number | null
          icp_fit: number | null
          industry: string | null
          intent: number | null
          last_activity_at: string | null
          next_action_at: string | null
          next_action_channel: string | null
          next_action_id: string | null
          next_action_priority: number | null
          next_action_rationale: string | null
          next_action_type: string | null
          open_opportunities: number | null
          organization_id: string | null
          score_confidence: number | null
          stage: string | null
          stage_reason: string | null
          state: string | null
          tax_id: string | null
          timing: number | null
          website_domain: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_revenue_summary_v: {
        Row: {
          business_profile: string | null
          business_profile_id: string | null
          contactable_or_beyond: number | null
          engaged_accounts: number | null
          hot_accounts: number | null
          meeting_accounts: number | null
          nurture_accounts: number | null
          open_actions: number | null
          open_opportunities: number | null
          organization_id: string | null
          overdue_actions: number | null
          pipeline_value: number | null
          scored_accounts: number | null
          signals_7d: number | null
          slug: string | null
          warm_accounts: number | null
        }
        Insert: {
          business_profile?: string | null
          business_profile_id?: string | null
          contactable_or_beyond?: never
          engaged_accounts?: never
          hot_accounts?: never
          meeting_accounts?: never
          nurture_accounts?: never
          open_actions?: never
          open_opportunities?: never
          organization_id?: string | null
          overdue_actions?: never
          pipeline_value?: never
          scored_accounts?: never
          signals_7d?: never
          slug?: string | null
          warm_accounts?: never
        }
        Update: {
          business_profile?: string | null
          business_profile_id?: string | null
          contactable_or_beyond?: never
          engaged_accounts?: never
          hot_accounts?: never
          meeting_accounts?: never
          nurture_accounts?: never
          open_actions?: never
          open_opportunities?: never
          organization_id?: string | null
          overdue_actions?: never
          pipeline_value?: never
          scored_accounts?: never
          signals_7d?: never
          slug?: string | null
          warm_accounts?: never
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_queue_v: {
        Row: {
          action_id: string | null
          action_type: string | null
          assigned_to: string | null
          business_profile: string | null
          business_profile_id: string | null
          channel: string | null
          city: string | null
          company_id: string | null
          company_name: string | null
          contact_email: string | null
          contact_facebook_url: string | null
          contact_id: string | null
          contact_instagram_url: string | null
          contact_linkedin_url: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          contactability: number | null
          due_at: string | null
          engagement: number | null
          execution_mode: string | null
          expires_at: string | null
          grit_score: number | null
          icp_fit: number | null
          intent: number | null
          is_decision_maker: boolean | null
          job_title: string | null
          organization_id: string | null
          payload: Json | null
          priority: number | null
          rationale: string | null
          score_confidence: number | null
          stage: string | null
          state: string | null
          status: string | null
          timing: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recommended_actions_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_business_profile_id_fkey"
            columns: ["organization_id", "business_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_revenue_summary_v"
            referencedColumns: ["organization_id", "business_profile_id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "account_360_v"
            referencedColumns: ["organization_id", "company_id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_company_id_fkey"
            columns: ["organization_id", "company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_contact_id_fkey"
            columns: ["organization_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "recommended_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_company_import: {
        Args: {
          p_accepted: Json
          p_actor_id: string
          p_file_sha256: string
          p_organization_id: string
          p_skipped: Json
          p_total_rows: number
        }
        Returns: Json
      }
      bootstrap_first_owner: { Args: { p_user_id: string }; Returns: Json }
      complete_recommended_action: {
        Args: { p_action_id: string; p_metadata?: Json; p_outcome: string }
        Returns: {
          action_type: string
          assigned_to: string | null
          business_profile_id: string
          channel: string | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          due_at: string
          execution_mode: string
          expires_at: string | null
          id: string
          opportunity_id: string | null
          organization_id: string
          outcome: string | null
          payload: Json
          priority: number
          rationale: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "recommended_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_org_member: {
        Args: { p_organization_id: string; p_roles?: string[] }
        Returns: boolean
      }
      prospecting_stage_rank: { Args: { p_stage: string }; Returns: number }
      refresh_company_score: {
        Args: {
          p_business_profile_id: string
          p_company_id: string
          p_icp_fit?: number
        }
        Returns: {
          business_profile_id: string
          company_id: string
          confidence: number
          contactability: number
          engagement: number
          icp_fit: number
          id: string
          intent: number
          next_review_at: string | null
          organization_id: string
          reasons: Json
          scored_at: string
          timing: number
          total_score: number
        }
        SetofOptions: {
          from: "*"
          to: "company_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_profile_scores: {
        Args: { p_business_profile_id: string; p_limit?: number }
        Returns: number
      }
      refresh_revenue_queue: {
        Args: { p_business_profile_id: string; p_limit?: number }
        Returns: {
          action_type: string
          assigned_to: string | null
          business_profile_id: string
          channel: string | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          due_at: string
          execution_mode: string
          expires_at: string | null
          id: string
          opportunity_id: string | null
          organization_id: string
          outcome: string | null
          payload: Json
          priority: number
          rationale: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "recommended_actions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      review_social_candidate: {
        Args: {
          p_actor_id: string
          p_candidate_id: string
          p_company_id: string
          p_decision: string
          p_organization_id: string
          p_reason: string
        }
        Returns: Json
      }
      seed_default_business_profiles: {
        Args: { p_organization_id: string }
        Returns: number
      }
      upsert_company_golden: {
        Args: { p_organization_id: string; p_payload: Json }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
