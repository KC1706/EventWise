
'use server';
/**
 * @fileOverview An AI agent that suggests nearby booths, live trending talks, and people to meet.
 *
 * - getNextAction - A function that handles the process of getting the next action suggestion.
 * - GetNextActionInput - The input type for the getNextAction function.
 * - GetNextActionOutput - The return type for the getNextAction function.
 */

import {ai, getGeminiModel} from '@/ai/genkit';
import {z} from 'genkit';
import { eventSessions } from '@/lib/data';
import { attendeeService, sessionService } from '@/lib/firestore-service';
import { Timestamp } from 'firebase/firestore';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

const GetNextActionInputSchema = z.object({
  query: z.string().describe('The user query for what to do next.'),
  history: z.array(MessageSchema).optional().describe('The conversation history so far.'),
  eventId: z.string().optional().describe('The event ID to query sessions and attendees for.'),
});
export type GetNextActionInput = z.infer<typeof GetNextActionInputSchema>;

const GetNextActionOutputSchema = z.object({
  suggestion: z.string().describe('The AI-generated suggestion for the next action.'),
});
export type GetNextActionOutput = z.infer<typeof GetNextActionOutputSchema>;

export async function getNextAction(input: GetNextActionInput): Promise<GetNextActionOutput> {
  return getNextActionFlow(input);
}

const getLiveSessions = ai.defineTool(
  {
    name: 'getLiveSessions',
    description: 'Get a list of event sessions that are currently live or are starting in the next 15 minutes. Useful for when a user asks what they can do right now.',
    inputSchema: z.object({
      eventId: z.string().optional().describe('The event ID to query sessions for.'),
    }),
    outputSchema: z.array(z.object({
        title: z.string(),
        startTime: z.string(),
    })),
  },
  async ({ eventId }) => {
    // If eventId is provided, use Firestore
    if (eventId) {
      try {
        const sessions = await sessionService.getUpcomingSessions(eventId, 15);
        return sessions.map(session => ({
          title: session.title,
          startTime: session.startTime.toDate().toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching live sessions from Firestore:', error);
        // Fallback to mock data
      }
    }
    
    // Fallback to mock data if no eventId or Firestore fails
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    return eventSessions
        .filter(session => {
            const startTime = new Date(session.startTime);
            return startTime >= now && startTime <= in15Minutes;
        })
        .map(({ title, startTime }) => ({ title, startTime }));
  }
);

const findRelevantPeople = ai.defineTool(
  {
    name: 'findRelevantPeople',
    description: 'Finds conference attendees who have a specified interest. Useful for networking recommendations.',
    inputSchema: z.object({ 
      interest: z.string().describe('The interest or topic to search for, e.g., "SaaS" or "AI".'),
      eventId: z.string().optional().describe('The event ID to query attendees for.'),
    }),
    outputSchema: z.array(z.object({ name: z.string(), title: z.string(), company: z.string() })),
  },
  async ({ interest, eventId }) => {
    const lowerCaseInterest = interest.toLowerCase();
    
    // If eventId is provided, use Firestore
    if (eventId) {
      try {
        const attendees = await attendeeService.getAttendeesByEvent(eventId);
        return attendees
          .filter(attendee => {
            return attendee.interests.some(i => i.toLowerCase().includes(lowerCaseInterest));
          })
          .map(({ name, title, company }) => ({ 
            name: name || 'Unknown',
            title: title || '',
            company: company || '',
          }));
      } catch (error) {
        console.error('Error fetching attendees from Firestore:', error);
        // Fallback to empty array
        return [];
      }
    }
    
    // Fallback: return empty array if no eventId
    return [];
  }
);

// Create a prompt for the AI assistant
const assistantPrompt = ai.definePrompt({
  name: 'realTimeAssistantPrompt',
  input: { schema: GetNextActionInputSchema },
  output: { schema: GetNextActionOutputSchema },
  model: getGeminiModel('gemini-2.5-flash-lite'),
  tools: [getLiveSessions, findRelevantPeople],
  prompt: `You are a helpful and friendly AI event guide for the Eventwise conference.
Your goal is to provide personalized and actionable recommendations to attendees.
Use the available tools to answer questions about what sessions to attend or who to meet.

User Query: {{query}}
Event ID: {{eventId}}

- If the user asks what to do now or soon, use the 'getLiveSessions' tool to see what's on.
- If the user mentions an interest or topic (e.g., "I'm interested in SaaS"), use the 'findRelevantPeople' tool to suggest networking opportunities.
- If no specific tools apply, provide a general helpful suggestion.
- Be proactive and engaging in your responses. Keep them concise and to the point.
- Format your response as a direct suggestion. For example, if you find a session, say "You should check out the 'The AI Revolution' session starting soon!"

Provide a helpful suggestion based on the user's query.
`,
});

const getNextActionFlow = ai.defineFlow(
  {
    name: 'getNextActionFlow',
    inputSchema: GetNextActionInputSchema,
    outputSchema: GetNextActionOutputSchema,
  },
  async ({ query, history, eventId }) => {
    try {
      const result = await assistantPrompt({ query, history, eventId });
      if (!result || !result.output) {
        throw new Error('Prompt returned undefined result');
      }
      return result.output;
    } catch (error) {
      console.error('Error in getNextActionFlow:', error);
      // Fallback response
      return {
        suggestion: 'I apologize, but I encountered an error. Please try asking your question again or contact support.',
      };
    }
  }
);
