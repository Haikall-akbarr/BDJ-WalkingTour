'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating tour reports.
 *
 * - generateTourReport - A function that generates a compelling tour report.
 * - TourReportInput - The input type for the generateTourReport function.
 * - TourReportOutput - The return type for the generateTourReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TourReportInputSchema = z.object({
  tourName: z.string().describe('The name of the tour.'),
  guideName: z.string().describe('The name of the guide.'),
  date: z.string().describe('The date of the tour.'),
  notableEncounters: z.string().describe('Notable encounters and discoveries during the tour.'),
});
export type TourReportInput = z.infer<typeof TourReportInputSchema>;

const TourReportOutputSchema = z.object({
  report: z.string().describe('The generated tour report.'),
});
export type TourReportOutput = z.infer<typeof TourReportOutputSchema>;

export async function generateTourReport(input: TourReportInput): Promise<TourReportOutput> {
  return generateTourReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tourReportPrompt',
  input: {schema: TourReportInputSchema},
  output: {schema: TourReportOutputSchema},
  prompt: `You are an expert tour guide report writer.
  Your goal is to create a compelling and engaging narrative of a walking tour.
  Use the following information to generate the report:

  Tour Name: {{{tourName}}}
  Guide Name: {{{guideName}}}
  Date: {{{date}}}
  Notable Encounters and Discoveries: {{{notableEncounters}}}

  Write a detailed and engaging tour report.
  `,
});

const generateTourReportFlow = ai.defineFlow(
  {
    name: 'generateTourReportFlow',
    inputSchema: TourReportInputSchema,
    outputSchema: TourReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
