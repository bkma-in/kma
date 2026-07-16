const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { db } = require('../dist/config/firebase');
const { PDFDocument } = require('pdf-lib');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const PDF_PATH = 'C:\\Users\\shivu naganur\\.gemini\\antigravity\\brain\\ccfd65bc-cefd-4c7e-b583-8663ed3d4aa3\\media__1784128274481.pdf';

const ISSUE_VOLUME = '19';
const ISSUE_NUMBER = 1;
const ISSUE_MONTH_YEAR = 'June 2025';
const ISSUE_ISSN = '0973-2721';
const ISSUE_DOC_ID = 'vol_19_issue_1_june_2025';

// Articles with PDF page ranges (as they appear in the actual PDF file, 1-indexed)
const ARTICLES = [
  {
    title: 'Analytic Solution of linear and nonlinear integro-differential equations with smooth kernels in Banach space C[0, T]',
    abstract: 'In this paper, some linear and nonlinear integro-differential equations are solved using the Laplace-Adomian Decomposition Algorithm (LADA). Discussions are held over the existence and uniqueness of solutions to these functions defined in the Banach space C[0, T] and the kernels. The difficulty in solving the problem arises from the nature of the kernel defined. This papers suggested approach is based on a classical fixed point that has been suitably modified. The accuracy and speed of convergence of the Laplace-Adomian Decomposition Algorithm are significantly higher than those of other methods currently in use. The method\'s efficiency has been evaluated by contrasting the numerical results it produced with the answer produced by other approaches.',
    keywords: 'Existence of fixed points of an operator on a Banach space, Convergence, Functional, Integral operator Laplace-Adomian Decomposition Algorithm, Wavelet Galerkin Method, Taylor Expansion Approach, Variational Iteration Method, Integral and integro-differential equation, Analytical and Numerical treatments',
    startPage: 5,
    endPage: 19,
    authors: [
      { name: 'S. Baiju', email: 'baijupoint@gmail.com', affiliation: 'Department of Mathematics, Government College, Kariavattom, Thiruvananthapuram, Kerala, India - 695 581' },
      { name: 'Doney Kurian', email: 'dkmathgc@gmail.com', affiliation: 'Department of Mathematics, Government College, Kariavattom, Thiruvananthapuram, Kerala, India - 695 581' }
    ]
  },
  {
    title: 'Irregularity on Pendant Graphs',
    abstract: 'Graphs with pendant vertices are known as pendant graphs, and the vertex adjacent to a pendant vertex is typically referred to as the support vertex. This text examines the irregularity of pendant graphs based on the degree of the support vertex. The set of vertices adjacent to the support vertex is called the support dependent set, while the set of vertices that are not adjacent to it is referred to as the support independent set. The support dependent number and the support independent number represent the cardinalities of the support dependent set and the support independent set, respectively. Furthermore, the minimum covering number, support dependent number, and support-independent number of graphs under the category of irregular pendant graphs are also explored.',
    keywords: 'Pendant Graphs, Support Vertex, Support Dependent Set, Support Independent Set',
    startPage: 21,
    endPage: 35,
    authors: [
      { name: 'Suji Elizabeth Mathew', email: 'augustinestaugustine@gmail.com', affiliation: 'Department of Mathematics, Catholicate College, Pathanamthitta, Kerala, India' },
      { name: 'Sunny Joseph Kalayathankal', email: 'sunnyj@rajagiritech.edu.in', affiliation: 'Department of Computer Science & Engineering, Rajagiri School of Engineering & Technology, Kochi, Kerala, India' }
    ]
  },
  {
    title: 'Leap Zagreb Indices of Certain Graph Operations',
    abstract: 'Topological indices are real numbers associated with a graph that can be used for predicting many physical, chemical, and pharmacological properties of chemical compounds. There are both distance based and degree based topological indices in graph theory. In 2017 A. M. Naji presented leap Zagreb indices of a graph G based on the second degrees of vertices. In this paper we obtain the first, second and third leap Zagreb indices of certain graph operations on a simple graph G.',
    keywords: 'Leap Zagreb indices, second degree',
    startPage: 37,
    endPage: 47,
    authors: [
      { name: 'Surya S.', email: 'suryas1116@gmail.com', affiliation: 'Department of Mathematics, St. Paul\'s College, Kalamassery, Kerala, India - 683 503' },
      { name: 'Pramada Ramachandran', email: 'pramada@stpauls.ac.in', affiliation: 'Department of Mathematics, St. Paul\'s College, Kalamassery, Kerala, India - 683 503' }
    ]
  },
  {
    title: 'An Innovative Score Function in Circular Intuitionistic Fuzzy Context and its Utilization in Healthcare Service Assessment',
    abstract: 'To provide a comprehensive way to represent imprecise information. Atanassov introduced the circular intuitionistic fuzzy set (C-IFS) by incorporating a form of circularity into the notion of intuitionistic fuzzy set (IFS). Effective decision-making under uncertainty requires a score function for ordering circular intuitionistic fuzzy values (C-IFVs) in multi-attribute decision-making. In this paper, we introduce a new score function that can offer a more accurate assessment in the C-IF settings. Afterward, we discuss some of the characteristics of the score function. Also, we compare the proposed score function with the existing score function and establish the superiority of the new score function over the existing methods, providing a more reliable mechanism for ranking C-IFVs. We develop a new decision-making technique using the suggested scoring function in the C-IF context. Finally, we demonstrate the efficacy of the proposed algorithm by applying it to the multi-attribute decision-making (MADM) problem in the healthcare service assessment.',
    keywords: 'fuzzy set, intuitionistic fuzzy set, circular intuitionistic fuzzy set, score function, multi-attribute decision making',
    startPage: 49,
    endPage: 60,
    authors: [
      { name: 'Theresa J. Puzhakkara', email: 'theresajp905@gmail.com', affiliation: 'Department of Mathematics, St. Thomas College, Palai, Kerala, India - 686 574' },
      { name: 'Shiny Jose', email: 'shinyjosedavis@gmail.com', affiliation: 'St. George\'s College, Aruvithura, Kerala, India - 686 122' }
    ]
  },
  {
    title: 'A Tutorial On Queues, Inventory, Reliability And Queueing Inventory',
    abstract: 'This tutorial provides a brief account of the mathematical analysis of queues, inventory, reliability and queueing-inventory (QI). The description provided here is a glimpse of the initial developments in these research topics. Interested readers may refer to books on Stochastic Processes or those exclusively on Queues or Inventory or Reliability. So far no book exclusively on QI has been published though there are not less than 500 research papers published in that area.',
    keywords: 'Queues, Inventory, Reliability, Queueing Inventory, Stochastic Processes',
    startPage: 61,
    endPage: 66,
    authors: [
      { name: 'Achyutha Krishnamoorthy', email: 'achyuthacusat@gmail.com', affiliation: 'Department of Mathematics, CMS College, Kottayam; Centre for Research in Mathematics, CMS College, Kottayam; and Department of Mathematics, Central University of Kerala, Kasaragod, India' }
    ]
  },
  {
    title: 'Obituary—R. S. Chakravarti',
    abstract: 'This obituary pays tribute to Dr. Rajeev Sreenivasa Chakravarti (June 21, 1951 – May 17, 2025), Associate Professor in Mathematics at Cochin University of Science and Technology (CUSAT). Dr. Chakravarti studied electrical engineering at IIT Bombay before changing fields to complete his M.Sc. in Mathematics at IIT Kanpur and his Ph.D. at the University of Washington (specializing in Associative Rings with Chain Conditions). He taught at CUSAT from 1985 until 2011, serving as department head from 2008–2011.',
    keywords: 'Obituary, R. S. Chakravarti, CUSAT, Mathematics',
    startPage: 67,
    endPage: 70,
    authors: []
  }
];

// ─────────────────────────────────────────
// R2 Client
// ─────────────────────────────────────────
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

async function uploadBuffer(buffer, key) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  });
  await r2.send(command);
  console.log(`  ✅ Uploaded: ${key}`);
  return key;
}

async function extractPages(fullBuffer, startPage, endPage) {
  const srcDoc = await PDFDocument.load(fullBuffer);
  const subDoc = await PDFDocument.create();
  const indices = [];
  for (let i = startPage - 1; i < endPage; i++) indices.push(i);
  const copied = await subDoc.copyPages(srcDoc, indices);
  copied.forEach(p => subDoc.addPage(p));
  const bytes = await subDoc.save();
  return Buffer.from(bytes);
}

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
async function run() {
  console.log('\n📂 Loading PDF...');
  const fullBuffer = fs.readFileSync(PDF_PATH);
  const srcDoc = await PDFDocument.load(fullBuffer);
  console.log(`  Total PDF pages: ${srcDoc.getPageCount()}`);

  console.log('\n🔎 Checking if issue already exists...');
  const issueRef = db.collection('issues').doc(ISSUE_DOC_ID);
  const issueSnap = await issueRef.get();
  if (issueSnap.exists) {
    console.log(`  ⚠️  Issue ${ISSUE_DOC_ID} already exists! Aborting.`);
    process.exit(1);
  }
  console.log('  Issue does not exist. Proceeding.');

  const createdArticleIds = [];

  for (let i = 0; i < ARTICLES.length; i++) {
    const art = ARTICLES[i];
    console.log(`\n📄 [${i + 1}/${ARTICLES.length}] Processing: ${art.title.substring(0, 60)}...`);

    // Extract pages
    console.log(`  Extracting pages ${art.startPage}–${art.endPage}...`);
    const splitBuf = await extractPages(fullBuffer, art.startPage, art.endPage);
    console.log(`  Split buffer: ${splitBuf.length} bytes`);

    // Build a clean filename
    const slug = art.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
    const rand = crypto.randomBytes(6).toString('hex');
    const objectKey = `articles/admin_ingested/${Date.now()}-${rand}-${slug}.pdf`;

    // Upload to R2
    await uploadBuffer(splitBuf, objectKey);

    // Prepare article document
    const articleRef = db.collection('articles').doc();
    const now = new Date();
    const finalAuthors = art.authors.map((au, idx) => ({
      userId: `legacy_${articleRef.id}_${idx}`,
      name: au.name,
      email: au.email || '',
      affiliation: au.affiliation || '',
      role: idx === 0 ? 'submitter' : 'coauthor',
      accepted: true,
      acceptedAt: now,
    }));

    const newArticle = {
      articleId: articleRef.id,
      title: art.title,
      abstract: art.abstract,
      keywords: art.keywords,
      authorId: 'admin_ingested',
      participantIds: ['admin_ingested'],
      authors: finalAuthors,
      reviewerId: null,
      status: 'published',
      pdfUrl: objectKey,
      pdfName: `${slug}.pdf`,
      issueId: ISSUE_DOC_ID,
      volume: ISSUE_VOLUME,
      volumeNo: ISSUE_VOLUME,
      monthYear: ISSUE_MONTH_YEAR,
      issueNumber: ISSUE_NUMBER,
      issn: ISSUE_ISSN,
      isOld: true,
      subjectClassification: '',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await articleRef.set(newArticle);
    createdArticleIds.push(articleRef.id);
    console.log(`  ✅ Saved article to Firestore: ${articleRef.id}`);
  }

  // Create issue document
  console.log('\n📰 Creating Issue document...');
  const issueDoc = {
    issueId: ISSUE_DOC_ID,
    title: `Volume ${ISSUE_VOLUME}, Issue ${ISSUE_NUMBER} (${ISSUE_MONTH_YEAR})`,
    volume: ISSUE_VOLUME,
    volumeNo: ISSUE_VOLUME,
    issueNumber: ISSUE_NUMBER,
    monthYear: ISSUE_MONTH_YEAR,
    issn: ISSUE_ISSN,
    articleIds: createdArticleIds,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await issueRef.set(issueDoc);
  console.log(`\n✅ Issue created: ${ISSUE_DOC_ID}`);
  console.log(`✅ Total articles published: ${createdArticleIds.length}`);
  createdArticleIds.forEach((id, i) => {
    console.log(`   ${i + 1}. ${id} - ${ARTICLES[i].title.substring(0, 60)}`);
  });
  console.log('\n🎉 Done! All articles are now live.\n');
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
