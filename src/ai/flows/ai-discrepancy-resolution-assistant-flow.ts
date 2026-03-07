'use server';
/**
 * @fileOverview An AI assistant flow that analyzes discrepancy details, photos, and historical data to suggest resolutions and communication templates for administrators.
 *
 * - aiDiscrepancyResolutionAssistant - A function that triggers the AI discrepancy resolution process.
 * - AiDiscrepancyResolutionAssistantInput - The input type for the aiDiscrepancyResolutionAssistant function.
 * - AiDiscrepancyResolutionAssistantOutput - The return type for the aiDiscrepancyResolutionAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDiscrepancyResolutionAssistantInputSchema = z.object({
  discrepancyId: z.string().describe('Unique identifier for the discrepancy.'),
  hospitalName: z.string().describe('Name of the hospital involved.'),
  requestDetails: z
    .string()
    .describe('Detailed description of the original hospital request (e.g., items, quantities).'),
  actualDetails: z
    .string()
    .describe('Detailed description of what was actually collected or delivered.'),
  discrepancyReason: z.string().describe('The stated reason for the discrepancy.'),
  photoDataUris: z
    .array(z.string())
    .describe(
      'An array of photo data URIs related to the discrepancy. Each URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    )
    .optional(),
  historicalDiscrepancies: z
    .array(
      z.object({
        id: z.string().describe('ID of past discrepancy'),
        hospitalName: z.string().describe('Hospital name for past discrepancy'),
        type: z.string().describe('Type of past discrepancy (e.g., quantity, damage)'),
        resolution: z.string().describe('How the past discrepancy was resolved'),
      })
    )
    .describe('A list of past discrepancy records for contextual analysis.')
    .optional(),
});

export type AiDiscrepancyResolutionAssistantInput = z.infer<
  typeof AiDiscrepancyResolutionAssistantInputSchema
>;

const AiDiscrepancyResolutionAssistantOutputSchema = z.object({
  suggestedResolution: z.string().describe('A clear, actionable suggestion for resolving the discrepancy.'),
  communicationTemplate: z
    .string()
    .describe('A template for communicating the resolution to relevant parties.'),
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('An assessment of the dispute risk (low, medium, high).'),
});

export type AiDiscrepancyResolutionAssistantOutput = z.infer<
  typeof AiDiscrepancyResolutionAssistantOutputSchema
>;

export async function aiDiscrepancyResolutionAssistant(
  input: AiDiscrepancyResolutionAssistantInput
): Promise<AiDiscrepancyResolutionAssistantOutput> {
  return aiDiscrepancyResolutionAssistantFlow(input);
}

const resolveDiscrepancyPrompt = ai.definePrompt({
  name: 'resolveDiscrepancyPrompt',
  input: {schema: AiDiscrepancyResolutionAssistantInputSchema},
  output: {schema: AiDiscrepancyResolutionAssistantOutputSchema},
  prompt: `You are an AI assistant specializing in resolving logistical discrepancies in hospital laundry services. Your task is to analyze details provided for a specific discrepancy, considering historical context and visual evidence, and propose a fair resolution along with a communication template.

**Discrepancy Details:**
- Discrepancy ID: {{{discrepancyId}}}
- Hospital: {{{hospitalName}}}
- Original Request: {{{requestDetails}}}
- Actual Collected/Delivered: {{{actualDetails}}}
- Stated Reason for Discrepancy: {{{discrepancyReason}}}

{{#if photoDataUris}}
**Attached Photos:**
{{#each photoDataUris}}
  {{media url=this}}
{{/each}}
{{/if}}

{{#if historicalDiscrepancies}}
**Historical Discrepancy Context (recent and relevant cases):**
{{#each historicalDiscrepancies}}
  - ID: {{id}}, Hospital: {{hospitalName}}, Type: {{type}}, Resolution: {{resolution}}
{{/each}}
{{else}}
No historical discrepancy data provided.
{{/if}}

Based on the information above, provide:
1. A clear, actionable suggested resolution for this specific discrepancy.
2. A polite and professional communication template addressed to the relevant party (e.g., hospital, driver, factory) explaining the situation and the proposed resolution.
3. An assessment of the dispute risk level (low, medium, high) for this discrepancy, justifying your assessment.

Ensure your output strictly adheres to the JSON schema provided.`,
});

const aiDiscrepancyResolutionAssistantFlow = ai.defineFlow(
  {
    name: 'aiDiscrepancyResolutionAssistantFlow',
    inputSchema: AiDiscrepancyResolutionAssistantInputSchema,
    outputSchema: AiDiscrepancyResolutionAssistantOutputSchema,
  },
  async input => {
    const {output} = await resolveDiscrepancyPrompt(input);
    return output!;
  }
);
