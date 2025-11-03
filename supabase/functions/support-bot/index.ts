import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, ticketId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get ticket info and messages for context
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*, profiles(full_name)')
      .eq('id', ticketId)
      .single();

    const { data: messages } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Build conversation context
    const conversationHistory = messages?.map(msg => ({
      role: msg.is_staff ? 'assistant' : 'user',
      content: msg.message
    })) || [];

    const systemPrompt = `You are VaultBank's AI support assistant. Your role is to:
1. Help customers with banking questions (accounts, transactions, cards, loans)
2. Provide general banking information
3. For complex issues or account-specific requests, offer to connect them with a live support agent

Important guidelines:
- Be helpful and professional
- If asked about specific account details or transactions, offer to connect with live support
- For general questions, provide helpful information
- Always ask if they'd like to speak with a live agent if their issue seems complex

Current ticket type: ${ticket?.ticket_type || 'general'}
Customer name: ${ticket?.profiles?.full_name || 'Customer'}`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const botReply = data.choices[0].message.content;

    // Save bot message to database
    await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: ticket.user_id,
        message: botReply,
        is_staff: true,
        is_read: false
      });

    // Check if bot suggested connecting to live agent
    const suggestsLiveAgent = botReply.toLowerCase().includes('live agent') || 
                             botReply.toLowerCase().includes('human support') ||
                             botReply.toLowerCase().includes('speak with');

    return new Response(JSON.stringify({ 
      reply: botReply,
      suggestsLiveAgent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in support-bot:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      reply: "I apologize, but I'm having trouble processing your request. Would you like to connect with a live support agent?"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});