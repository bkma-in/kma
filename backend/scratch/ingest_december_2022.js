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
const PDF_PATH = 'C:\\Users\\shivu naganur\\.gemini\\antigravity\\brain\\7b15ecc8-916d-4b64-9431-e52bbba92f45\\media__1784564053279.pdf';

const ISSUE_VOLUME = '16';
const ISSUE_NUMBER = 2;
const ISSUE_MONTH_YEAR = 'December 2022';
const ISSUE_ISSN = '0973-2721';
const ISSUE_DOC_ID = 'vol_16_issue_2_december_2022';

const ARTICLES = [
  {
    title: 'The Golden Ratio and the Fibonacci Numbers',
    abstract: 'The ancient Greeks believed that the golden ratio, which we now known as 1 : 1.618, approximately, when used to construct a rectangle, produced the most pleasing of shapes. To the Greeks the connection between shapes and numbers was deep and mystical. They also thought that it had certain magical properties as did the Egyptians who used it in the construction of the Pyramids. The mystical symbol of the Pythagorean cult was a number-shape namely, the pentagram, a five pointed star. The pentagram became the most sacred symbol of the Pythagorean school because the lines of the star are divided in the golden ratio. Divide a line segment into two, such that the ratio of the small part to the large part is equal to the ratio of the large part to the whole segment. Then such a ratio is called the golden ratio and the section is called the golden section. The number whose approximate value is 1.618 is called the golden number. It is denoted by $\\Phi$. It is the positive solution of the equation $\\phi^2 - \\phi - 1 = 0$ and is an irrational number. A rectangle whose sides are in this ratio is called a golden rectangle. This number produces a set of nesting golden rectangles. This nesting property of the golden number provides the sequence, 1, 1.618, 2.618, 4.236, $\\dots$ which is Fibonacci sequence. Fibonacci numbers can be used to make a golden rectangle so that golden ratio and Fibonacci numbers are inter related to each other. Vastuvidhya adopts the golden ratio in the construction of special types of temples, Natymandapam (koothambalam) and in iconography.',
    keywords: '',
    startPage: 5,
    endPage: 11,
    authors: [
      { name: 'P. Ramamkrishnan', email: 'perunellyramakrishnan1947@gmail.com', affiliation: 'Formerly Cochin College, Cochin - 682 002, Kerala, India' }
    ]
  },
  {
    title: 'Pythagorean Triples, Baudhayana and Pothayanar',
    abstract: 'We discuss here a linear formula to compute the hypotenuse of a right triangle, given the two sides containing the right angle and the formula appears to have been known long back. We note that there are indeed other similar linear expressions for computing the hypotenuse corresponding to sub classes of Pythagorean triples that satisfy the Pythagoras theorem.',
    keywords: 'Right triangles, Pythagorean triples',
    startPage: 13,
    endPage: 15,
    authors: [
      { name: 'Robinson Thamburaj', email: '', affiliation: 'Department of Mathematics, Madras Christian College, Tambaram, Chennai - 600059, India' },
      { name: 'D. Gnanaraj Thomas', email: '', affiliation: 'Department of Mathematics, Madras Christian College, Tambaram, Chennai - 600059, India' },
      { name: 'K.G. Subramanian', email: '', affiliation: 'Department of Mathematics, Madras Christian College, Tambaram, Chennai - 600059, India' }
    ]
  },
  {
    title: 'Coupled Common Fixed Point Theorem in Generalized b-Fuzzy Metric Spaces',
    abstract: 'In this paper, we establish a Coupled Common Fixed Point Theorem in the context of Generalized b-Fuzzy Metric Spaces ($G_bFMS$). $G_bFMS$ provide a generalization of classical metric spaces, allowing for a more flexible framework to analyze fuzzy relationships between points. The notion of a coupled common fixed point is pivotal in various applications, including the study of coupled systems and differential equations. We extend previous results in metric fixed point theory to this fuzzy setting by introducing a novel notion of coupled fixed points that respects the fuzzy nature of the metric. Our main result establishes conditions under which two mappings, satisfying certain contractive conditions with respect to a generalized b-fuzzy metric, possess a unique coupled common fixed point.',
    keywords: 'Coincidence point, Common fixed point, b-fuzzy metric space, Commutative mapping',
    startPage: 17,
    endPage: 27,
    authors: [
      { name: 'M. Jeyaraman', email: 'jeya.math@gmail.com', affiliation: 'PG and Research Department of Mathematics, Raja Dorai Singam Govt. Arts College, Sivagangai (Affiliated to Alagappa University, Karaikudi), Tamil Nadu, India' },
      { name: 'D. Poovaragavan', email: 'poovaragavan87@gmail.com', affiliation: 'Department of Mathematics, Government Arts College for Women, Sivagangai (Affiliated to Alagappa University, Karaikudi), Tamil Nadu, India' },
      { name: 'M. Pandiselvi', email: 'mpandiselvi2612@gmail.com', affiliation: 'PG and Research Department of Mathematics, Raja Doraisingam Govt. Arts College, Sivagangai (Affiliated to Alagappa University, Karaikudi), Tamil Nadu, India' }
    ]
  },
  {
    title: 'Intersection and product operations on firemodules',
    abstract: 'The study of algebraic structures in fire settings has intrigued researchers. Our introduction of fire modules motivated this present research. In this paper, we examine various operations on fire modules. We particularly look at the intersection and product operations, presenting notable findings. Additionally, we include results related to the first isomorphism theorem for fire modules. Our goal is to provide a comprehensive understanding of these operations and their implications in the context of fire modules.',
    keywords: 'firesets, firerings, firemodules, fuzzy firemodule, fireideals, subfiremodule',
    startPage: 29,
    endPage: 38,
    authors: [
      { name: 'Srinivasan Vijayabalaji', email: 'balaji1977harshini@gmail.com', affiliation: 'Department of Mathematics (S&H), University College of Engineering, Panruti (A Constituent College of Anna University, Chennai), Panruti - 607106, Tamilnadu, India' },
      { name: 'Shanmugam Kalaiselvan', email: 'kselvan44@gmail.com', affiliation: 'Department of Mathematics (S&H), University College of Engineering, Panruti (A Constituent College of Anna University, Chennai), Panruti - 607106, Tamilnadu, India' }
    ]
  },
  {
    title: 'Applications of Coupled N-Structures to Ideals in BF-Algebras',
    abstract: 'In this paper, we introduce the notions of coupled $\\mathcal{N}$-ideal and coupled $\\mathcal{N}$-structured closed ideal in a BF-algebra with suitable examples. We discuss some properties and structural characteristics of coupled $\\mathcal{N}$-ideals in BF-algebras. We establish a sufficient condition for a coupled $\\mathcal{N}$-subalgebra to be a coupled $\\mathcal{N}$-ideal in a BF-algebra. We also prove that the arbitrary union of family of coupled $\\mathcal{N}$-closed ideals of a BF-algebra is a coupled $\\mathcal{N}$-closed ideal.',
    keywords: 'BF-algebra, N-ideal, N-closed ideal, coupled N-subalgebra, coupled N-ideal, coupled N-structured closed ideal',
    startPage: 39,
    endPage: 48,
    authors: [
      { name: 'T. Manikantan', email: 'manikantan_slm@rediffmail.com', affiliation: 'Post Graduate and Research Department of Mathematics, Thiruvalluvar Government Arts College (Affil. to Periyar University), Rasipuram - 637 401, Namakkal District, Tamilnadu, India' },
      { name: 'B. Punitha', email: 'punithamaths005@gmail.com', affiliation: 'Post Graduate and Research Department of Mathematics, Thiruvalluvar Government Arts College (Affil. to Periyar University), Rasipuram - 637 401, Namakkal District, Tamilnadu, India' },
      { name: 'S. Ramkumar', email: 'ramkumars_slm@rediffmail.com', affiliation: 'Department of Mathematics, Mahendra Engineering College (Autonomous), Namakkal - 637 503, Tamilnadu, India' }
    ]
  },
  {
    title: 'Complement Metric Dimension of Some Graphs',
    abstract: 'Let $G=(V(G), E(G))$ be a connected graph. Consider an ordered subset $W$ of $V(G)$ given by $W=\{w_1,w_2,w_3,\\dots,w_k\}$. The representation of a vertex $v \\in V(G)$ with respect to $W$ is the k-tuple, $r(v|W) = (d(v, w_1), d(v, w_2), \\dots, d(v, w_k))$ where $d(v, w_i)$ is the length of the shortest path from $v$ to $w_i$. If there exist two vertices $u, v \\in V(G) - W$ such that $r(u|W)=r(v|W)$, then the set $W$ is called a complement resolving set for $G$. A complement resolving set having maximum cardinality is called a complement basis of $G$. The cardinality of a complement basis of $G$ is called the complement metric dimension of $G$ and is denoted by $\\overline{dim}(G)$. In this paper we have examined the complement metric dimension of wheel graphs, Petersen graphs, Generalized Petersen graph $P(n, 1)$ and trees.',
    keywords: 'Complement Resolving Set, Complement Basis, Complement Metric Dimension',
    startPage: 49,
    endPage: 59,
    authors: [
      { name: 'Neenu Susan Paul', email: 'neenususanpaul@teresas.ac.in', affiliation: 'Department of Mathematics, St. Teresa’s College, Ernakulam, Kerala, India' },
      { name: 'Nisha Oommen', email: 'nishaoommen@teresas.ac.in', affiliation: 'Department of Mathematics, St. Teresa’s College, Ernakulam, Kerala, India' },
      { name: 'Dhanalakshmi O.M.', email: 'dhanalakshmiom@teresas.ac.in', affiliation: 'Department of Mathematics, St. Teresa’s College, Ernakulam, Kerala, India' },
      { name: 'Manju K. Menon', email: 'manju@stpauls.ac.in', affiliation: 'Department of Mathematics, St. Paul’s College, Kalamassery, Kerala, India' }
    ]
  },
  {
    title: 'Fixed Point Theorem for Quasi-Contraction Maps on Generalized Intuitionistic Fuzzy Metric Spaces',
    abstract: 'In this paper, we discuss the concept of set valued quasi-contraction mapping in $\\mathcal{V}$-fuzzy metric spaces. We improve and established in fixed point theorem in the setting of Generalized Intuitionistic Fuzzy Metric Spaces.',
    keywords: 'Fixed point, V-Fuzzy Metric Space, Generalized Intuitionistic Fuzzy Metric Spaces, Quasi-contraction',
    startPage: 61,
    endPage: 73,
    authors: [
      { name: 'M. Jeyaraman', email: 'jeya.math@gmail.com', affiliation: 'PG and Research Department of Mathematics, Raja Dorai Singam Govt. Arts College, Sivagangai (Affiliated to Alagappa University, Karaikudi), Tamil Nadu, India' },
      { name: 'D. Poovaragavan', email: 'poovaragavan87@gmail.com', affiliation: 'Department of Mathematics, Government Arts College for Women, Sivagangai (Affiliated to Alagappa University, Karaikudi), Tamil Nadu, India' },
      { name: 'J. Johnsy', email: 'johnsy.math@gmail.com', affiliation: 'P.G. and Research Department of Mathematics, Raja Doraisingam Govt. Arts College, Sivagangai (Affiliated to Alagappa University, Karaikudi), Tamil Nadu, India' }
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
      tag: 'Research Paper',
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
