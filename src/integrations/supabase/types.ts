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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_applications: {
        Row: {
          account_type: string
          address: string | null
          address_proof_url: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          id_back_url: string | null
          id_front_url: string | null
          phone: string | null
          qr_code_secret: string | null
          qr_code_verified: boolean | null
          selfie_url: string | null
          ssn: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          verification_token: string | null
          zip_code: string | null
        }
        Insert: {
          account_type: string
          address?: string | null
          address_proof_url?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          phone?: string | null
          qr_code_secret?: string | null
          qr_code_verified?: boolean | null
          selfie_url?: string | null
          ssn?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          zip_code?: string | null
        }
        Update: {
          account_type?: string
          address?: string | null
          address_proof_url?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          phone?: string | null
          qr_code_secret?: string | null
          qr_code_verified?: boolean | null
          selfie_url?: string | null
          ssn?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      account_details: {
        Row: {
          account_id: string
          bank_address: string
          branch_code: string | null
          created_at: string
          iban: string
          id: string
          swift_code: string
          user_id: string
        }
        Insert: {
          account_id: string
          bank_address: string
          branch_code?: string | null
          created_at?: string
          iban: string
          id?: string
          swift_code: string
          user_id: string
        }
        Update: {
          account_id?: string
          bank_address?: string
          branch_code?: string | null
          created_at?: string
          iban?: string
          id?: string
          swift_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_details_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          available_balance: number | null
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          routing_number: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          available_balance?: number | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          routing_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          available_balance?: number | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          routing_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ach_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string
          created_at: string
          id: string
          routing_number: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          bank_name: string
          created_at?: string
          id?: string
          routing_number: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          bank_name?: string
          created_at?: string
          id?: string
          routing_number?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      admin_actions_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_message: string
          alert_title: string
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          user_id: string
        }
        Insert: {
          alert_message: string
          alert_title: string
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          user_id: string
        }
        Update: {
          alert_message?: string
          alert_title?: string
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          admin_notes: string | null
          application_type: string
          content: Json
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          application_type: string
          content: Json
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          application_type?: string
          content?: Json
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payee_account: string | null
          payee_address: string | null
          payee_name: string
          payment_date: string
          recurring_frequency: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payee_account?: string | null
          payee_address?: string | null
          payee_name: string
          payment_date: string
          recurring_frequency?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payee_account?: string | null
          payee_address?: string | null
          payee_name?: string
          payment_date?: string
          recurring_frequency?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          end_date: string | null
          id: string
          period: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          period?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          period?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      card_applications: {
        Row: {
          annual_income: number | null
          application_status: string
          card_type: string
          created_at: string
          employment_status: string | null
          id: string
          requested_credit_limit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_income?: number | null
          application_status?: string
          card_type: string
          created_at?: string
          employment_status?: string | null
          id?: string
          requested_credit_limit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_income?: number | null
          application_status?: string
          card_type?: string
          created_at?: string
          employment_status?: string | null
          id?: string
          requested_credit_limit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          account_id: string
          card_number: string
          card_status: string
          card_type: string
          created_at: string | null
          cvv: string
          expiry_date: string
          id: string
          is_locked: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          card_number: string
          card_status?: string
          card_type: string
          created_at?: string | null
          cvv: string
          expiry_date: string
          id?: string
          is_locked?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          card_number?: string
          card_status?: string
          card_type?: string
          created_at?: string | null
          cvv?: string
          expiry_date?: string
          id?: string
          is_locked?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_scores: {
        Row: {
          created_at: string | null
          factors: Json | null
          id: string
          provider: string
          score: number
          score_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          factors?: Json | null
          id?: string
          provider?: string
          score: number
          score_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          factors?: Json | null
          id?: string
          provider?: string
          score?: number
          score_date?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_deposit_addresses: {
        Row: {
          currency: string
          id: string
          is_active: boolean | null
          network: string | null
          updated_at: string | null
          updated_by: string | null
          wallet_address: string
        }
        Insert: {
          currency: string
          id?: string
          is_active?: boolean | null
          network?: string | null
          updated_at?: string | null
          updated_by?: string | null
          wallet_address: string
        }
        Update: {
          currency?: string
          id?: string
          is_active?: boolean | null
          network?: string | null
          updated_at?: string | null
          updated_by?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      crypto_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string
          id: string
          updated_at: string | null
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          id: string
          sent_at: string | null
          sent_by: string | null
          sent_to: string[]
          status: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_to: string[]
          status?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_to?: string[]
          status?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          created_at: string
          id: string
          interest_rate: number
          loan_amount: number
          loan_purpose: string
          loan_term_months: number
          monthly_payment: number
          status: string
          total_interest: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_rate?: number
          loan_amount: number
          loan_purpose: string
          loan_term_months?: number
          monthly_payment: number
          status?: string
          total_interest: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_rate?: number
          loan_amount?: number
          loan_purpose?: string
          loan_term_months?: number
          monthly_payment?: number
          status?: string
          total_interest?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string | null
          id: string
          interest_rate: number
          loan_amount: number
          loan_status: string
          loan_type: string
          maturity_date: string
          monthly_payment: number
          next_due_date: string
          origination_date: string
          outstanding_balance: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_rate: number
          loan_amount: number
          loan_status?: string
          loan_type: string
          maturity_date: string
          monthly_payment: number
          next_due_date: string
          origination_date: string
          outstanding_balance: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_rate?: number
          loan_amount?: number
          loan_status?: string
          loan_type?: string
          maturity_date?: string
          monthly_payment?: number
          next_due_date?: string
          origination_date?: string
          outstanding_balance?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      manual_deposits: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          created_by: string
          deposit_date: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          created_by: string
          deposit_date: string
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          created_by?: string
          deposit_date?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      mobile_deposits: {
        Row: {
          account_id: string
          amount: number
          check_back_url: string | null
          check_front_url: string | null
          check_number: string | null
          cleared_date: string | null
          created_at: string | null
          deposit_date: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          check_back_url?: string | null
          check_front_url?: string | null
          check_number?: string | null
          cleared_date?: string | null
          created_at?: string | null
          deposit_date?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          check_back_url?: string | null
          check_front_url?: string | null
          check_number?: string | null
          cleared_date?: string | null
          created_at?: string | null
          deposit_date?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_deposits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          description: string
          expiry_date: string | null
          id: string
          is_claimed: boolean | null
          offer_type: string
          title: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          expiry_date?: string | null
          id?: string
          is_claimed?: boolean | null
          offer_type: string
          title: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          expiry_date?: string | null
          id?: string
          is_claimed?: boolean | null
          offer_type?: string
          title?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          transaction_id: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          transaction_id?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          transaction_id?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          reset_token: string
          security_answer: string
          security_question: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          reset_token: string
          security_answer: string
          security_question: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          reset_token?: string
          security_answer?: string
          security_question?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          can_transact: boolean | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          phone_number: string | null
          pin: string | null
          qr_verified: boolean | null
          security_answer: string | null
          security_question: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_transact?: boolean | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          phone?: string | null
          phone_number?: string | null
          pin?: string | null
          qr_verified?: boolean | null
          security_answer?: string | null
          security_question?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_transact?: boolean | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_number?: string | null
          pin?: string | null
          qr_verified?: boolean | null
          security_answer?: string | null
          security_question?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      statements: {
        Row: {
          account_id: string
          created_at: string | null
          file_size: number | null
          id: string
          statement_date: string
          statement_period: string
          statement_url: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          file_size?: number | null
          id?: string
          statement_date: string
          statement_period: string
          statement_url?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          file_size?: number | null
          id?: string
          statement_date?: string
          statement_period?: string
          statement_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "statements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_agents: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_available: boolean | null
          is_online: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          is_staff: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          is_staff?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          is_staff?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ratings: {
        Row: {
          agent_id: string | null
          created_at: string
          feedback: string | null
          id: string
          rating: number
          ticket_id: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          ticket_id: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ratings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ratings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          agent_online: boolean | null
          agent_typing: boolean | null
          agent_typing_at: string | null
          assigned_agent_id: string | null
          chat_mode: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          ticket_type: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
          user_online: boolean | null
          user_typing: boolean | null
          user_typing_at: string | null
        }
        Insert: {
          agent_online?: boolean | null
          agent_typing?: boolean | null
          agent_typing_at?: string | null
          assigned_agent_id?: string | null
          chat_mode?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          ticket_type: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
          user_online?: boolean | null
          user_typing?: boolean | null
          user_typing_at?: string | null
        }
        Update: {
          agent_online?: boolean | null
          agent_typing?: boolean | null
          agent_typing_at?: string | null
          assigned_agent_id?: string | null
          chat_mode?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          ticket_type?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_online?: boolean | null
          user_typing?: boolean | null
          user_typing_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string | null
          description: string
          id: string
          merchant: string | null
          status: string | null
          transaction_date: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          merchant?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          merchant?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_recipients: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          recipient_account: string
          recipient_bank: string
          recipient_name: string
          recipient_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          recipient_account: string
          recipient_bank: string
          recipient_name: string
          recipient_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          recipient_account?: string
          recipient_bank?: string
          recipient_name?: string
          recipient_type?: string
          user_id?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          completed_date: string | null
          created_at: string | null
          currency: string | null
          from_account_id: string | null
          id: string
          notes: string | null
          scheduled_date: string | null
          status: string | null
          to_account_id: string | null
          transfer_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_date?: string | null
          created_at?: string | null
          currency?: string | null
          from_account_id?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string | null
          to_account_id?: string | null
          transfer_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_date?: string | null
          created_at?: string | null
          currency?: string | null
          from_account_id?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string | null
          to_account_id?: string | null
          transfer_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          location: Json | null
          page_url: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          location?: Json | null
          page_url: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          location?: Json | null
          page_url?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_activity: string
          page_title: string | null
          page_url: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_activity?: string
          page_title?: string | null
          page_url: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_activity?: string
          page_title?: string | null
          page_url?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_old_typing_indicators: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
