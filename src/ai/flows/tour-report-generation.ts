
'use server';

/**
 * @fileOverview File ini mendefinisikan alur Genkit untuk menghasilkan laporan tur.
 *
 * - generateTourReport - Fungsi yang menghasilkan laporan tur yang menarik.
 * - TourReportInput - Tipe input untuk fungsi generateTourReport.
 * - TourReportOutput - Tipe output untuk fungsi generateTourReport.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TourReportInputSchema = z.object({
  tourName: z.string().describe('Nama tur.'),
  guideName: z.string().describe('Nama pemandu.'),
  date: z.string().describe('Tanggal tur.'),
  notableEncounters: z.string().describe('Temuan dan perjumpaan menarik selama tur.'),
});
export type TourReportInput = z.infer<typeof TourReportInputSchema>;

const TourReportOutputSchema = z.object({
  report: z.string().describe('Laporan tur yang dihasilkan.'),
});
export type TourReportOutput = z.infer<typeof TourReportOutputSchema>;

export async function generateTourReport(input: TourReportInput): Promise<TourReportOutput> {
  return generateTourReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tourReportPrompt',
  input: {schema: TourReportInputSchema},
  output: {schema: TourReportOutputSchema},
  prompt: `Anda adalah penulis laporan tur jalan kaki profesional.
  Tujuan Anda adalah membuat narasi yang menarik dan memikat tentang pengalaman tur jalan kaki di Banjarmasin.
  Gunakan informasi berikut untuk menghasilkan laporan dalam Bahasa Indonesia:

  Nama Tur: {{{tourName}}}
  Nama Pemandu: {{{guideName}}}
  Tanggal: {{{date}}}
  Temuan Menarik & Catatan: {{{notableEncounters}}}

  Tulis laporan tur yang detail, hangat, dan menggugah minat pembaca untuk ikut serta di masa mendatang.
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
