import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    papers: [
      { year: 2025, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://drive.google.com/file/d/1Ld3QiSPhVTXktuwTNlthGT4MszQ4iB7u/view', source: 'Google Drive', note: 'Direct PDF' },
      { year: 2024, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://www.adda247.com/jobs/wp-content/uploads/sites/22/2025/05/07214018/TNPSC_Group4_2024-question-paper-GeneralStudiesWithGeneralTamil.pdf', source: 'Adda247', note: 'Direct PDF' },
      { year: 2022, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://www.adda247.com/jobs/wp-content/uploads/sites/22/2025/05/07214114/TNPSC_Group4_2022-question-paper-GeneralStudiesWithGeneralTamil.pdf', source: 'Adda247', note: 'Direct PDF' },
      { year: 2019, exam: 'Group 4', questions: 200, languages: ['Tamil'], sourceUrl: 'https://www.adda247.com/jobs/wp-content/uploads/sites/22/2025/06/20114731/TNPSC_Group4_2019_GeneralTamil-Question-Paper.pdf', source: 'Adda247', note: 'Direct PDF (General Tamil)' },
      { year: 2018, exam: 'Group 4', questions: 200, languages: ['Tamil'], sourceUrl: 'https://www.adda247.com/jobs/wp-content/uploads/sites/22/2025/06/20114723/TNPSC_Group4_2018_GeneralTamil-Question-Paper.pdf', source: 'Adda247', note: 'Direct PDF (General Tamil)' },
      { year: 2016, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://www.freetnbooks.com/tnpsc-group-4-question-paper/', source: 'FreeTNBooks', note: 'Many years on one page' },
      { year: 2014, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://www.freetnbooks.com/tnpsc-group-4-question-paper/', source: 'FreeTNBooks', note: 'Many years on one page' },
      { year: 2013, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://www.freetnbooks.com/tnpsc-group-4-question-paper/', source: 'FreeTNBooks', note: 'Many years on one page' },
      { year: 2012, exam: 'Group 4', questions: 200, languages: ['Tamil', 'English'], sourceUrl: 'https://www.freetnbooks.com/tnpsc-group-4-question-paper/', source: 'FreeTNBooks', note: 'Many years on one page' },
    ],
  });
}