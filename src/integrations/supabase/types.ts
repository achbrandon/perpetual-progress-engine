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
          created_at: string | null
          date_of_birth: string | null
          drivers_license_url: string | null
          email: string
          full_name: string
          id: string
          id_back_url: string | null
          id_front_url: string | null
          phone: string | null
          phone_number: string | null
          qr_code_secret: string | null
          qr_code_verified: boolean | null
          residential_address: string | null
          security_answer: string | null
          security_question: string | null
          selfie_url: string | null
          ssn: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type: string
          address?: string | null
          address_proof_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          drivers_license_url?: string | null
          email: string
          full_name: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          phone?: string | null
          phone_number?: string | null
          qr_code_secret?: string | null
          qr_code_verified?: boolean | null
          residential_address?: string | null
          security_answer?: string | null
          security_question?: string | null
          selfie_url?: string | null
          ssn?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          address?: string | null
          address_proof_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          drivers_license_url?: string | null
          email?: string
          full_name?: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          phone?: string | null
          phone_number?: string | null
          qr_code_secret?: string | null
          qr_code_verified?: boolean | null
          residential_address?: string | null
          security_answer?: string | null
          security_question?: string | null
          selfie_url?: string | null
          ssn?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      account_details: {
        Row: {
          account_id: string
          bank_address: string | null
          branch_code: string | null
          created_at: string | null
          iban: string | null
          id: string
          routing_number: string | null
          swift_code: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          bank_address?: string | null
          branch_code?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          routing_number?: string | null
          swift_code?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          bank_address?: string | null
          branch_code?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          routing_number?: string | null
          swift_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      account_requests: {
        Row: {
          account_type: string
          created_at: string | null
          id: string
          reason: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string | null
          id?: string
          reason?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          account_number: string
          account_type: string
          balance: number | null
          created_at: string | null
          id: string
          qr_code_secret: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          balance?: number | null
          created_at?: string | null
          id?: string
          qr_code_secret?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          balance?: number | null
          created_at?: string | null
          id?: string
          qr_code_secret?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ach_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          created_at: string | null
          id: string
          routing_number: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          created_at?: string | null
          id?: string
          routing_number: string
          status?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          created_at?: string | null
          id?: string
          routing_number?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_actions_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: string | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: string | null
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
          message: string | null
          notification_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sent_at: string | null
          sent_by_admin_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sent_at?: string | null
          sent_by_admin_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sent_at?: string | null
          sent_by_admin_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          account_number: string
          amount: number
          created_at: string | null
          id: string
          payee_name: string
          payment_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          amount: number
          created_at?: string | null
          id?: string
          payee_name: string
          payment_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          amount?: number
          created_at?: string | null
          id?: string
          payee_name?: string
          payment_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      card_applications: {
        Row: {
          application_status: string | null
          card_type: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_status?: string | null
          card_type: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_status?: string | null
          card_type?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          card_holder: string
          card_number: string
          card_type: string
          created_at: string | null
          cvv: string
          expiry_date: string
          id: string
          is_locked: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          card_holder: string
          card_number: string
          card_type: string
          created_at?: string | null
          cvv: string
          expiry_date: string
          id?: string
          is_locked?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          card_holder?: string
          card_number?: string
          card_type?: string
          created_at?: string | null
          cvv?: string
          expiry_date?: string
          id?: string
          is_locked?: boolean | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_scores: {
        Row: {
          created_at: string | null
          id: string
          report_date: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_date: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          report_date?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      crypto_deposit_addresses: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          is_active: boolean | null
          network: string
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          currency: string
          id?: string
          is_active?: boolean | null
          network: string
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          network?: string
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
          user_id: string
          wallet_address: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency: string
          id?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          id: string
          sent_to: string
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          sent_to: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          sent_to?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      external_payment_accounts: {
        Row: {
          account_identifier: string
          account_name: string | null
          account_number: string | null
          account_type: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          account_identifier: string
          account_name?: string | null
          account_number?: string | null
          account_type: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          account_identifier?: string
          account_name?: string | null
          account_number?: string | null
          account_type?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      favorite_transactions: {
        Row: {
          created_at: string | null
          id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      joint_account_documents: {
        Row: {
          created_at: string | null
          document_type: string
          id: string
          joint_request_id: string
          sent_to_email: string | null
          shipped_to_address: string | null
          signature_date: string | null
          signed_document_url: string | null
          status: string
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          id?: string
          joint_request_id: string
          sent_to_email?: string | null
          shipped_to_address?: string | null
          signature_date?: string | null
          signed_document_url?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          id?: string
          joint_request_id?: string
          sent_to_email?: string | null
          shipped_to_address?: string | null
          signature_date?: string | null
          signed_document_url?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "joint_account_documents_joint_request_id_fkey"
            columns: ["joint_request_id"]
            isOneToOne: false
            referencedRelation: "joint_account_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      joint_account_requests: {
        Row: {
          account_id: string
          activation_date: string | null
          agreement_sent: boolean | null
          created_at: string | null
          deposit_amount: number
          documents_verified: boolean | null
          id: string
          otp_verified: boolean | null
          partner_address: string
          partner_drivers_license_url: string | null
          partner_email: string
          partner_full_name: string
          partner_id_document_url: string | null
          partner_phone: string
          partner_ssn: string
          requester_user_id: string
          required_deposit_percentage: number
          status: string
          terms_accepted: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          activation_date?: string | null
          agreement_sent?: boolean | null
          created_at?: string | null
          deposit_amount: number
          documents_verified?: boolean | null
          id?: string
          otp_verified?: boolean | null
          partner_address: string
          partner_drivers_license_url?: string | null
          partner_email: string
          partner_full_name: string
          partner_id_document_url?: string | null
          partner_phone: string
          partner_ssn: string
          requester_user_id: string
          required_deposit_percentage?: number
          status?: string
          terms_accepted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          activation_date?: string | null
          agreement_sent?: boolean | null
          created_at?: string | null
          deposit_amount?: number
          documents_verified?: boolean | null
          id?: string
          otp_verified?: boolean | null
          partner_address?: string
          partner_drivers_license_url?: string | null
          partner_email?: string
          partner_full_name?: string
          partner_id_document_url?: string | null
          partner_phone?: string
          partner_ssn?: string
          requester_user_id?: string
          required_deposit_percentage?: number
          status?: string
          terms_accepted?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "joint_account_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          loan_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          loan_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          loan_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          balance: number
          created_at: string | null
          id: string
          interest_rate: number
          loan_type: string
          monthly_payment: number
          status: string | null
          term_months: number
          user_id: string
        }
        Insert: {
          amount: number
          balance: number
          created_at?: string | null
          id?: string
          interest_rate: number
          loan_type: string
          monthly_payment: number
          status?: string | null
          term_months: number
          user_id: string
        }
        Update: {
          amount?: number
          balance?: number
          created_at?: string | null
          id?: string
          interest_rate?: number
          loan_type?: string
          monthly_payment?: number
          status?: string | null
          term_months?: number
          user_id?: string
        }
        Relationships: []
      }
      manual_deposits: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mobile_deposits: {
        Row: {
          account_id: string | null
          amount: number
          check_image_back: string | null
          check_image_front: string | null
          created_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          check_image_back?: string | null
          check_image_front?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          check_image_back?: string | null
          check_image_front?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
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
          expires_at: string | null
          id: string
          is_claimed: boolean | null
          offer_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          offer_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          offer_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          security_answer: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          security_answer?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          security_answer?: string | null
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
          pin: string | null
          qr_verified: boolean | null
          security_answer: string | null
          security_question: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_transact?: boolean | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          pin?: string | null
          qr_verified?: boolean | null
          security_answer?: string | null
          security_question?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_transact?: boolean | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          pin?: string | null
          qr_verified?: boolean | null
          security_answer?: string | null
          security_question?: string | null
        }
        Relationships: []
      }
      statements: {
        Row: {
          account_id: string | null
          created_at: string | null
          end_date: string
          id: string
          pdf_url: string | null
          start_date: string
          statement_date: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          pdf_url?: string | null
          start_date: string
          statement_date: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          pdf_url?: string | null
          start_date?: string
          statement_date?: string
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
          id: string
          is_online: boolean | null
          name: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          name?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          name?: string | null
          user_id?: string
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
          message: string | null
          sender_type: string | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          sender_type?: string | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          sender_type?: string | null
          ticket_id?: string | null
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
          created_at: string | null
          feedback: string | null
          id: string
          rating: number
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating: number
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
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
          assigned_agent_id: string | null
          chat_mode: string | null
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          subject: string | null
          ticket_type: string | null
          updated_at: string | null
          user_id: string
          user_online: boolean | null
          user_typing: boolean | null
        }
        Insert: {
          agent_online?: boolean | null
          agent_typing?: boolean | null
          assigned_agent_id?: string | null
          chat_mode?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          ticket_type?: string | null
          updated_at?: string | null
          user_id: string
          user_online?: boolean | null
          user_typing?: boolean | null
        }
        Update: {
          agent_online?: boolean | null
          agent_typing?: boolean | null
          assigned_agent_id?: string | null
          chat_mode?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          ticket_type?: string | null
          updated_at?: string | null
          user_id?: string
          user_online?: boolean | null
          user_typing?: boolean | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          auto_complete_at: string | null
          created_at: string | null
          crypto_currency: string | null
          description: string | null
          id: string
          proof_of_payment_url: string | null
          reference_number: string | null
          status: string | null
          type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_complete_at?: string | null
          created_at?: string | null
          crypto_currency?: string | null
          description?: string | null
          id?: string
          proof_of_payment_url?: string | null
          reference_number?: string | null
          status?: string | null
          type: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_complete_at?: string | null
          created_at?: string | null
          crypto_currency?: string | null
          description?: string | null
          id?: string
          proof_of_payment_url?: string | null
          reference_number?: string | null
          status?: string | null
          type?: string
          user_id?: string
          wallet_address?: string | null
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
          account_number: string | null
          created_at: string | null
          id: string
          last_used_at: string | null
          recipient_name: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          recipient_name?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          recipient_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number | null
          created_at: string | null
          from_account: string | null
          id: string
          status: string | null
          to_account: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          from_account?: string | null
          id?: string
          status?: string | null
          to_account?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          from_account?: string | null
          id?: string
          status?: string | null
          to_account?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          user_id?: string
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
          created_at: string | null
          ended_at: string | null
          id: string
          is_online: boolean | null
          last_activity: string | null
          page_title: string | null
          page_url: string | null
          session_id: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_online?: boolean | null
          last_activity?: string | null
          page_title?: string | null
          page_url?: string | null
          session_id?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_online?: boolean | null
          last_activity?: string | null
          page_title?: string | null
          page_url?: string | null
          session_id?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_complete_pending_transactions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
