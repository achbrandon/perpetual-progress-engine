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
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError);
      throw new Error('Ticket not found');
    }

    // Get user profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', ticket.user_id)
      .single();

    const { data: messages } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Build conversation context
    const conversationHistory = messages?.map(msg => ({
      role: (msg.sender_type === 'staff' || msg.sender_type === 'bot') ? 'assistant' : 'user',
      content: msg.message
    })) || [];

    // Check if any agents are online
    const { data: onlineAgents } = await supabase
      .from('support_agents')
      .select('id')
      .eq('is_available', true)
      .limit(1);

    const hasOnlineAgents = onlineAgents && onlineAgents.length > 0;

    const systemPrompt = `You are VaultBank's AI support assistant. Your role is to:
1. Help customers with banking questions (accounts, transactions, cards, loans)
2. Provide general banking information including cryptocurrency services
3. Offer to connect them with a live support agent when needed

VaultBank Services:
- Traditional banking: checking, savings, credit cards, loans
- Cryptocurrency support: We DO support crypto deposits and withdrawals
- Crypto withdrawal steps:
  1. Navigate to Crypto Wallet section in your dashboard
  2. Select the cryptocurrency you want to withdraw
  3. Enter the destination wallet address
  4. Specify the amount to withdraw
  5. Confirm the transaction and verify via SMS/OTP
  6. Transaction will be processed within 24-48 hours
- Supported cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), and other major coins

Important guidelines:
- Be helpful and professional
- Have a natural conversation - answer their questions fully
- For general questions, provide complete helpful information
- For complex or account-specific issues, offer to connect with a live agent
- If user says "yes", "sure", "connect me", "I want to talk to agent", or similar, that means they want live agent connection
- ${hasOnlineAgents ? 'Live agents are currently available' : 'Live agents will be available soon'}

Current ticket type: ${ticket?.ticket_type || 'general'}
Customer name: ${profile?.full_name || 'Customer'}`;

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
    const { error: insertError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        message: botReply,
        sender_type: 'bot',
        is_read: false
      });

    if (insertError) {
      console.error('Error inserting bot message:', insertError);
      throw insertError;
    }

    // Check if user is requesting to connect to an agent
    const userWantsAgent = message.toLowerCase().match(/\b(yes|sure|ok|okay|connect|agent|talk to someone|speak to|human|representative)\b/);
    
    return new Response(JSON.stringify({ 
      reply: botReply,
      suggestsLiveAgent: userWantsAgent !== null
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