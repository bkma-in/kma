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
const PDF_PATH = 'C:\\Users\\shivu naganur\\.gemini\\antigravity\\brain\\7b15ecc8-916d-4b64-9431-e52bbba92f45\\media__1784233156458.pdf';

const ISSUE_VOLUME = '17';
const ISSUE_NUMBER = 1;
const ISSUE_MONTH_YEAR = 'June 2020';
const ISSUE_ISSN = '0973-2721';
const ISSUE_DOC_ID = 'vol_17_issue_1_june_2020';

const ARTICLES = [
  {
    title: 'On Bounded Solutions for Some Strongly Nonlinear Elliptic Equations with Lower Order Terms and L1-Data',
    abstract: 'We are interested in existence result concerning the solution to the following nonlinear elliptic problem : $-\\Delta_pu + \\frac{u}{\\sigma-|u|} - \\beta|\\nabla u|^p = f(x)$ in $\\Omega$ and $u = 0$ on $\\partial\\Omega$, where $\\sigma, \\beta > 0$, and $f(x)$ in $L^1(\\Omega)$.',
    keywords: 'Elliptic problem; Nonlinear singular term; Existence; Sobolev space',
    startPage: 7,
    endPage: 19,
    authors: [
      { name: 'Rachid Bouzyani', email: 'rachid.maths2013@gmail.com', affiliation: 'Department of Mathematics, Faculty of Sciences El Jadida, University Chouaib Doukkali, P. O. Box 20, 24000 El Jadida, Morocco' },
      { name: 'Badr El Haji', email: 'badr.elhaji@gmail.com', affiliation: 'Équipe d’AFNLA, Département de Mathématiques, Faculté des Sciences de Tétouan, Université Abdelmalek Essaadi, BP 2121, Tétouan, Maroc' },
      { name: 'Mostafa El Moumni', email: 'mostafaelmoumni@gmail.com', affiliation: 'Department of Mathematics, Faculty of Sciences El Jadida, University Chouaib Doukkali, P.O. Box 20, 24000 El Jadida, Morocco' }
    ]
  },
  {
    title: 'Some Results on Centrality Measures in Trees',
    abstract: 'Notions of centrality in graphs are important from both theoretical and practical points of view. The classical concept of center was defined by Jordan as early as in 1869. Since then several notions of centrality have been defined. Many of these concepts coincide in the case of a tree. We discuss concepts such as centroid, median, security center, accretion center, telephone center, weight balance center and processing center. We show that the concepts coincide for a tree. With each centrality concept one may naturally associate a function defined on the vertices of the tree. These functions are shown to possess certain convexity and quasiconvexity properties. As a consequence the functions are shown to be monotonic as one moves along a path in the tree starting from the center.',
    keywords: 'tree, centrality, median, centroid, convex function on trees',
    startPage: 21,
    endPage: 39,
    authors: [
      { name: 'Ronit Neogy', email: 'ronitneogy@gmail.com', affiliation: 'Indian Statistical Institute, 7, S.J.S. Sansanwal Marg, New Delhi-110016, India' },
      { name: 'Ravindra B. Bapat', email: 'rbb@isid.ac.in', affiliation: 'Indian Statistical Institute, 7, S.J.S. Sansanwal Marg, New Delhi-110016, India' }
    ]
  },
  {
    title: 'Bipolar L Fuzzy Graph',
    abstract: 'In this paper we introduce Bipolar L-Fuzzy graph as a generalisation of Bipolar Fuzzy graph. We try to define complete bipolar L-fuzzy graph, complement of bipolar L-fuzzy graph, and discuss their properties. The operations on bipolar L-fuzzy graphs such as Cartesian product, Union of such graphs are discussed. Isomorphism, Strong bipolar L-fuzzy graph, threshold and Partial bipolar L-fuzzy graph are also discussed.',
    keywords: 'Bipolar L-Fuzzy graph, Complement of Bipolar L Fuzzy graph, Isomorphism of Bipolar L Fuzzy graph',
    startPage: 41,
    endPage: 53,
    authors: [
      { name: 'Sreedevi V. S.', email: '', affiliation: 'Maharajas College, Ernakulam, Kerala, India' },
      { name: 'Bloomy Joseph', email: '', affiliation: 'Maharajas College, Ernakulam, Kerala, India' }
    ]
  },
  {
    title: 'Analysis of Interdependent Processes: A Semi-Markov Approach',
    abstract: 'This paper introduces a new approach to analyse interdependence between stochastic processes evolving together. First, a brief description of the analysis of independent processes will be given. These processes are independent within as well as mutually independent. Next step is the introduction of processes, a few of which are dependent within the same process, but mutually independent. Finally we move to the case of interdependence which is dependence between processes, either pair wise or in groups or all put together. Between distinct groups there may not be interdependence. There may be processes that stay "neutral" in the sense that they do not contribute to the interdependence.',
    keywords: 'Phase type process, Markovian/ Marked Markovian/Batch Markovian Arrival Processes, Semi-Markov Process, Independence, Within Dependence, Interdependence (Between Dependence)-Interacting particle system',
    startPage: 55,
    endPage: 74,
    authors: [
      { name: 'Achyutha Krishnamoorthy', email: 'achyuthacusat@gmail.com', affiliation: 'Centre for Research in Mathematics, C.M.S. College, Kottayam - 686001, India' }
    ]
  },
  {
    title: 'A Relation between Fuzzy Σ-Space and Fuzzy σ-Space',
    abstract: 'A class of generalized metric spaces is any class of spaces defined by a property possessed by all metric spaces. They characterize metrizability in terms of weaker topological properties. The concept like $\\Sigma$-space, strong $\\Sigma$-space and $\\sigma$-space were extensively studied by various authors as a part of theory of generalized metric spaces. In this paper we establish a relation between fuzzy $\\Sigma$-space and fuzzy $\\sigma$-space.',
    keywords: 'Fuzzy σ-space, fuzzy Σ-space and fuzzy strong Σ-space',
    startPage: 75,
    endPage: 82,
    authors: [
      { name: 'Jisha M. S.', email: 'jishamkrishnan@gmail.com', affiliation: 'Assistant Professor, Department of Mathematics, M.S.M. College, Kayamkulam, Kerala, India' },
      { name: 'Dr. R. Sreekumar', email: 'dr.r.sreekumar@gmail.com', affiliation: 'Associate Professor and Head, Department of Mathematics, S.D. College, Alappuzha, Kerala, India' }
    ]
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
