require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const QuestionModel = require('./model/question');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEN_AI_KEY });

const syllabusTaxonomy = {
  English: {
    "Lexis and Structure (Grammar)": [
      "Parts of Speech (Nouns, Pronouns, Verbs)", 
      "Adjectives, Adverbs, Prepositions, Conjunctions", 
      "Tenses (Simple, Continuous, Perfect)", 
      "Concord (Subject-Verb Agreement)", 
      "Sentence Structure and Reported Speech", 
      "Question Tags and Conditionals", 
      "Punctuation and Mechanics"
    ],
    "Vocabulary Development (Lexis)": [
      "Synonyms, Antonyms, Homonyms", 
      "Idioms and Idiomatic Expressions", 
      "Phrasal Verbs", 
      "Registers (Medicine, Law, Tech)"
    ],
    "Oral English (Speech)": [
      "Vowel Sounds (Monophthongs, Diphthongs, Triphthongs)", 
      "Consonant Sounds and Clusters", 
      "Rhymes and Stress Patterns", 
      "Emphatic Stress and Intonation"
    ],
    "Comprehension and Summary": [
      "Reading Strategies (Skimming and Scanning)", 
      "Interpretation and Inference", 
      "Summary Writing and Topic Sentences"
    ]
  },
  Mathematics: {
    "Number and Numeration": [
      "Number Bases and Operations", 
      "Fractions, Decimals, and Percentages", 
      "Indices and Logarithms", 
      "Surds and Rationalization", 
      "Sets and Venn Diagrams", 
      "Sequence and Series (AP/GP)"
    ],
    "Algebraic Processes": [
      "Algebraic Expressions and Factorization", 
      "Linear and Quadratic Equations", 
      "Inequalities and Graphical Solutions", 
      "Variation (Direct, Inverse, Joint, Partial)", 
      "Functions, Relations and Binary Operations", 
      "Matrices and Determinants"
    ],
    "Geometry and Trigonometry": [
      "Euclidean Geometry (Angles and Polygons)", 
      "Circle Geometry and Circle Theorems", 
      "Mensuration (Arc, Area, Volume)", 
      "Trigonometry (Sine/Cosine Rules)", 
      "Bearings, Elevation and Depression", 
      "Trig Identities and Graphs"
    ],
    "Calculus (The Advanced Section)": [
      "Differentiation and First Principles", 
      "Differentiation Rules (Chain, Product, Quotient)", 
      "Applications of Differentiation (Maxima/Minima)", 
      "Indefinite and Definite Integration", 
      "Applications of Integration (Area/Volume)"
    ],
    "Statistics and Probability": [
      "Data Presentation (Ogive, Histograms, Pie Charts)", 
      "Measures of Central Tendency (Grouped/Ungrouped)", 
      "Measures of Dispersion (Variance, SD, Mean Deviation)", 
      "Probability Laws and Events", 
      "Permutations and Combinations"
    ]
  },
  Biology: {
    "Study of Life and The Cell": [
      "Characteristics of Living Things (MR NIGER D)", 
      "Classification of Living Things (Kingdoms to Species)",
      "Cell Theory and Detailed Structures (Mitochondria, Ribosomes)", 
      "Prokaryotic vs Eukaryotic and Plant vs Animal Cells",
      "Diffusion, Osmosis and Active Transport",
      "Haemolysis, Turgidity, Plasmolysis and Flaccidity"
    ],
    "Nutrition and Energy Transformation": [
      "Modes of Nutrition (Holozoic, Parasitic, Saprophytic)", 
      "Photosynthesis (Light and Dark Stages)", 
      "Plant Mineral Nutrition (Macro and Micronutrients)",
      "Animal Nutrition (Balanced Diet and Classes of Food)",
      "Enzymes: Properties and Factors Affecting Action",
      "Human Digestive System (Dentition and Alimentary Canal)"
    ],
    "Transport, Respiration and Excretion": [
      "Plant Transport (Root Pressure, Transpiration, Translocation)", 
      "Animal Transport (Blood Groups, Heart, Circulatory System)", 
      "External Respiration (Gills, Trachea, Lungs)",
      "Internal Respiration (Glycolysis, Krebs Cycle, Aerobic/Anaerobic)",
      "Excretory Mechanisms (Contractile Vacuole, Nephridia, Nephron)"
    ],
    "Coordination, Control and Movement": [
      "Plant Irritability (Taxes, Tropisms, Nastic Movements)", 
      "The Nervous System (Brain, Spinal Cord, Reflexes)", 
      "The Eye (Anatomy and Defects, Myopia, Hypermetropia)",
      "The Ear (Hearing and Balance/Equilibrium)",
      "The Endocrine System (Hormones, Glands, Imbalances)",
      "Skeletal Systems (Axial and Appendicular Skeletons, Joints)",
      "Supporting Tissues in Plants (Sclerenchyma and Xylem)"
    ],
    "Ecology and Environment": [
      "Ecological Concepts (Biomes, Habitats, Niches, Food Webs)", 
      "Population Studies (Density, Natality, Mortality)", 
      "Nutrient Cycling (Nitrogen, Carbon, Water Cycles)",
      "Conservation and Pollution (Natural Resources, Biodegradable)"
    ],
    "Reproduction and Genetics": [
      "Cell Division (Mitosis and Meiosis)", 
      "Reproduction in Flowering Plants (Pollination, Fertilization)", 
      "Reproduction in Animals (Menstruation, Fertilization, Birth)", 
      "Biology of Heredity (Mendel’s Laws and DNA Structure)",
      "Chromosomes, Genes and Sex Determination",
      "Morphological and Physiological Variation",
      "Theories and Evidence of Evolution"
    ]
  },
  Chemistry: {
    "Foundations: Nature of Matter & Atomic Structure": [
      "Introduction to Chemistry and Chemical Industries", 
      "Particulate Nature of Matter (Atoms, Molecules, Ions)", 
      "Dalton's Atomic Theory and its Modifications", 
      "Subatomic Particles and Isotopy (Calculations)", 
      "Electronic Configuration (Shells and Orbitals)", 
      "Chemical Bonding (Ionic, Covalent, Metallic, Dative)", 
      "Shapes of Molecules and Intermolecular Forces"
    ],
    "Quantitative Chemistry (The Math of Chemistry)": [
      "Symbols, Formulae and Chemical Equations", 
      "The Mole Concept and Avogadro's Number", 
      "Molar Mass and Molar Volume (22.4 dm3 at STP)", 
      "Empirical and Molecular Formulae Calculations", 
      "Stoichiometry and Limiting Reactants", 
      "Gas Laws (Boyle, Charles, Dalton, Graham)"
    ],
    "Physical Chemistry: Energy & Reactions": [
      "Energetics (Enthalpy, Entropy, Free Energy)", 
      "Chemical Kinetics and Collision Theory", 
      "Chemical Equilibrium (Le Chatelier’s Principle)", 
      "Acids, Bases, pH Scale and Indicators", 
      "Acid-Base Titrations (Volumetric Analysis)", 
      "Redox Reactions and Oxidation Numbers", 
      "Electrolysis: Faraday’s Laws and Applications", 
      "Electrochemical Cells (Primary and Secondary)"
    ],
    "Inorganic Chemistry: The Elements": [
      "The Periodic Table and Periodic Trends", 
      "Group I – VII Elements and Transition Metals", 
      "Hydrogen, Oxygen, Air and Water Treatment", 
      "Carbon: Allotropes and Oxides", 
      "Nitrogen: Ammonia and Nitric Acid (Haber/Ostwald)", 
      "Sulphur: Extraction and H2SO4 (Frasch/Contact)", 
      "Chlorine and its Compounds"
    ],
    "Organic Chemistry: The Chemistry of Carbon": [
      "Introduction: Homologous Series and Functional Groups", 
      "Hydrocarbons (Alkanes, Alkenes, Alkynes, Benzene)", 
      "Alkanols and Fermentation", 
      "Alkanoic Acids, Esters and Saponification", 
      "Biomolecules (Carbohydrates, Proteins, Fats/Oils)", 
      "Polymers and Plastics"
    ],
    "Applied & Analytical Chemistry": [
      "Chemical Industries and Environmental Impact", 
      "Pollution (Air, Water, Soil, Greenhouse Effect)", 
      "Qualitative Analysis: Identification of Cations", 
      "Qualitative Analysis: Identification of Anions", 
      "Flame Tests and Gas Identification Tests"
    ]
  },
  Economics: {
    "Fundamental Concepts & Tools": [
      "Introduction to Economics and Definitions", 
      "Basic Concepts (Scarcity, Choice, etc.)", 
      "Economic Problems of Society", 
      "Tools of Economic Analysis (Graphs, Tables)", 
      "Measures of Central Tendency and Dispersion"
    ],
    "Microeconomics: The Theory of the Market": [
      "Theory of Demand and Determinants", 
      "Theory of Supply and Determinants", 
      "Elasticity of Demand and Supply", 
      "Price Determination and Price Control", 
      "Theory of Consumer Behaviour and Utility"
    ],
    "Theory of Production & Business Organizations": [
      "Theory of Production and Factors of Production", 
      "Division of Labour and Returns to Scale", 
      "Theory of Costs and Revenue", 
      "Business Organizations (Sole Trader, LLC, Co-ops)", 
      "Localization of Industries and Economies of Scale"
    ],
    "Market Structures": [
      "Perfect Competition (Short/Long Run)", 
      "Monopoly: Causes and Control", 
      "Monopolistic Competition", 
      "Oligopoly and Duopoly"
    ],
    "Macroeconomics: The National Economy": [
      "National Income (GNP, GDP, NNP)", 
      "Money and Inflation (Fisher's Equation)", 
      "Financial Institutions and Monetary Policy", 
      "Public Finance, Taxation and National Budget"
    ],
    "Development & International Economics": [
      "Population and Malthusian Theory", 
      "Labour Market, Wage and Unemployment", 
      "International Trade and Trade Barriers", 
      "International Economic Organizations (ECOWAS, IMF, WTO)", 
      "Economic Growth and Planning in Nigeria"
    ]
  },
  Government: {
    "Elements of Government (Theory)": [
      "Basic Concepts (State, Power, Sovereignty)", 
      "Political Ideologies and Forms of Government", 
      "Arms of Government (Legislature, Executive, Judiciary)", 
      "Structures of Governance (Unitary, Federal, Confederal)", 
      "Constitutions: Definition, Types and Sources", 
      "Principles of Democratic Government (Rule of Law, Separation of Powers)"
    ],
    "Political Processes & Institutions": [
      "Citizenship: Rights, Duties and Acquisition", 
      "Electoral Process (Suffrage and Systems)", 
      "Political Parties and Party Systems", 
      "Pressure Groups and Public Opinion", 
      "Mass Media and its Role", 
      "Public/Civil Service and Local Government"
    ],
    "Political Development in Nigeria (History)": [
      "Pre-Colonial Political Systems (Hausa, Igbo, Yoruba)", 
      "Colonial Administration and Indirect Rule", 
      "Nationalism and Roles of Early Nationalists", 
      "Pre-Independence Constitutions (Clifford, Richards, etc.)", 
      "Post-Independence and Military Rule", 
      "Nigerian Federalism and Federal Character"
    ]
  },
  "Literature in English": {
    "General Literary Principles and Terms": [
      "Figures of Speech (Metaphor, Simile, Irony, etc.)", 
      "Literary Appreciation (Mood, Tone, and Atmosphere)", 
      "Plot, Theme, and Characterization", 
      "Setting and Historical/Cultural Context", 
      "Symbols, Allusions, and Imagery"
    ],
    "Drama (Techniques and Prescribed Texts)": [
      "Dramatic Techniques (Soliloquy, Aside, Irony)", 
      "Types of Drama (Tragedy, Comedy, Tragi-comedy)", 
      "Stage Directions, Dialogue, and Conflict", 
      "Analysis of Prescribed African Drama", 
      "Analysis of Prescribed Non-African Drama"
    ],
    "Prose (Techniques and Prescribed Texts)": [
      "Narrative Techniques and Point of View", 
      "Prose Styles, Diction, and Pacing", 
      "Analysis of Prescribed African Prose", 
      "Analysis of Prescribed Non-African Prose", 
      "Short Stories and Narrative Essays"
    ],
    "Poetry (Appreciation and Prescribed Texts)": [
      "Poetic Devices (Alliteration, Assonance, Personification)", 
      "Structure (Stanza, Meter, Rhyme Scheme, and Rhythm)", 
      "Mood, Tone, and the Poet's Attitude", 
      "Analysis of Prescribed African Poetry", 
      "Analysis of Prescribed Non-African Poetry"
    ]
  },
  "Geography": {
    "Practical Geography": [
      "Map Reading and Interpretation (Scales, Bearing)", 
      "Relief Representation and Cross-sections", 
      "Map Interpretation (Settlement, Drainage)", 
      "Statistical Mapping (Charts, Dot maps)", 
      "Surveying and GIS Applications"
    ],
    "Physical Geography": [
      "The Earth in the Solar System and Movements", 
      "The Earth's Crust (Rocks, Vulcanicity, Earthquakes)", 
      "Landform Evolution and Weathering", 
      "Hydrosphere: Rivers, Oceans and Currents", 
      "Atmosphere: Weather and Climatic Regions", 
      "Biosphere: Vegetation and Soils"
    ],
    "Human and Economic Geography": [
      "Population: Distribution, Density and Growth", 
      "Settlement Patterns (Rural vs Urban)", 
      "Economic Activities: Agriculture and Mining", 
      "Transport, Communication and Industry", 
      "Environmental Hazards (Erosion, Flooding, etc.)"
    ],
    "Regional Geography": [
      "Nigeria: Physical Setting and Drainage", 
      "Nigeria: Human and Economic Geography", 
      "Africa: Relief, Climate and Regional Overview"
    ]
  },
  "CRK": {
    "The Old Testament: The History of God's People": [
      "The Sovereignty and Nature of God", 
      "Leadership: Call of Abraham, Moses and Joshua", 
      "Kingship in Israel (Saul, David, Solomon)", 
      "Prophets and Social Justice (Amos, Hosea, Isaiah)", 
      "Confronting Evil: Elijah and King Ahab"
    ],
    "The New Testament: The Life of Christ & The Early Church": [
      "The Birth, Baptism and Temptations of Jesus", 
      "Ministry of Jesus: Parables and Miracles", 
      "The Sermon on the Mount and Law of Love", 
      "The Passion, Crucifixion and Resurrection", 
      "The Great Commission and Pentecost", 
      "Missions of Peter and Paul"
    ],
    "Christian Ethics & Daily Living": [
      "Humility, Forgiveness and the Lord's Prayer", 
      "Civic Responsibility and Obedience", 
      "Dignity of Labour and Paul's Teaching", 
      "The Fruit of the Spirit and Spiritual Gifts"
    ]
  },
  "Financial Accounting": {
    "Foundations: The Accounting Framework": [
      "Introduction and Accounting Concepts", 
      "The Accounting Equation (A = L + C)", 
      "Double-Entry Bookkeeping and Ledgers", 
      "The Trial Balance and Limitations"
    ],
    "Books of Original Entry (Subsidiary Books)": [
      "Sales, Purchase and Returns Day Books", 
      "Cash Books (Single, Double, Three-column)", 
      "Petty Cash and the Imprest System", 
      "The Journal and Opening Entries"
    ],
    "Regulatory & Reconciliation Tools": [
      "Bank Reconciliation Statements", 
      "Control Accounts (Debtors and Creditors)", 
      "Correction of Errors and Suspense Account"
    ],
    "Final Accounts (Financial Statements)": [
      "Trading, Profit and Loss Accounts", 
      "Balance Sheet (Statement of Financial Position)", 
      "Adjustments: Accruals and Prepayments", 
      "Depreciation Methods and Bad Debts"
    ],
    "Specialized Accounting": [
      "Manufacturing Accounts and Production Cost", 
      "Partnership Accounts and Appropriation", 
      "Company Accounts: Shares and Debentures", 
      "Not-for-Profit and Incomplete Records"
    ],
    "Analysis & Interpretation": [
      "Liquidity Ratios (Current, Quick)", 
      "Profitability Ratios (ROCE, Margins)", 
      "Efficiency Ratios (Stock Turnover, etc.)"
    ]
  },
  "Physics": {
    "Mechanics (The Foundation)": [
      "Measurement: Quantities, Units and Instruments", 
      "Scalars and Vectors (Addition and Resolution)", 
      "Linear, Projectile and Circular Motion", 
      "Equilibrium of Forces and Statics", 
      "Friction (Static and Dynamic)", 
      "Work, Energy and Power", 
      "Machines (Pulleys, Inclined planes, Levers)"
    ],
    "Thermal Physics (Heat)": [
      "Temperature and Thermometers", 
      "Thermal Expansion (Linear, Area, Volume)", 
      "Heat Transfer (Conduction, Convection, Radiation)", 
      "Gas Laws (Boyle, Charles, Pressure)", 
      "Quantity of Heat (Specific and Latent Heat)", 
      "Evaporation, Boiling and Hygrometry"
    ],
    "Waves and Optics": [
      "Wave Motion and characteristics (f, lambda, v)", 
      "Sound Waves (Phenomena and Characteristics)", 
      "Light Waves: Reflection and Spherical Mirrors", 
      "Light Waves: Refraction and Fiber Optics", 
      "Lenses and Lens Formula", 
      "Optical Instruments (Microscopes, Telescopes, Eye)", 
      "Dispersion and Electromagnetic Spectrum"
    ],
    "Electricity and Magnetism": [
      "Electrostatics and Coulomb's Law", 
      "Current Electricity (Ohm's Law, Resistivity)", 
      "Circuits (Series and Parallel)", 
      "Electrical Energy, Power and House Wiring", 
      "Magnetic Fields and Electromagnetism", 
      "Electromagnetic Induction, Transformers and Generators"
    ],
    "Modern Physics (Atomic and Nuclear)": [
      "Structure of the Atom and Photoelectric Effect", 
      "X-Rays: Production and Applications", 
      "Radioactivity and Half-life Calculations", 
      "Nuclear Energy (Fission and Fusion)", 
      "Wave-Particle Duality (De Broglie)"
    ]
  },
  "History": {
    "Pre-Colonial Nigeria (Origins and Early States)": [
      "Land and People of Nigeria", 
      "Archaeological Sources (Nok, Ife, Benin, Igbo-Ukwu)", 
      "The Sudanic States (Hausa, Borno)", 
      "The Forest States (Oyo, Benin)", 
      "Igbo Segmentary System", 
      "Inter-group Relations before 1800"
    ],
    "The Impact of External Influences": [
      "Islamic Influence and Sokoto Jihad", 
      "Trans-Saharan and Trans-Atlantic Slave Trade", 
      "Abolition of Slave Trade and Legitimate Trade", 
      "Christian Missionary Activities"
    ],
    "The Colonial Period (1861–1960)": [
      "The British Conquest (Lagos, Benin, Sokoto)", 
      "Amalgamation (1914) and Lord Lugard", 
      "Colonial Administration (Indirect vs Direct Rule)", 
      "Colonial Economy (Railways, Cash Crops)"
    ],
    "Nationalism and Independence": [
      "Factors for Nationalism and Early Movements", 
      "Constitutional Road to Independence", 
      "1960 Independence Declaration"
    ],
    "Post-Independence Nigeria (1960–Present)": [
      "The First Republic and Crises", 
      "Military Interventions and 1966 Coups", 
      "The Nigerian Civil War (1967–1970)", 
      "The Oil Boom Era and Economic Growth", 
      "Second, Third, and Fourth Republics", 
      "Nigeria and International Organizations (ECOWAS, UN)"
    ]
  }
};


const urlToGenerativePart = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const base64Data = Buffer.from(response.data).toString('base64');
        return { inlineData: { data: base64Data, mimeType } };
    } catch (error) {
        console.error(`Error fetching image from ${url}:`, error.message);
        return null;
    }
};

async function getLabelsFromAI(subject, questionData) {
  try {
    const taxonomyForSubject = syllabusTaxonomy[subject] || {};
    let taxonomyString = JSON.stringify(taxonomyForSubject, null, 2);
    
    const promptText = `
You are an expert Nigerian WAEC/JAMB exam question analyzer.
Analyze the following exam question and determine its granular topic and sub-topic based ONLY on the provided taxonomy for ${subject}.
Also, generate 4 distinct explanations for the correct answer.

SUBJECT: ${subject}

QUESTION TEXT:
${questionData.question || 'N/A'}

SUBHEADING A (Context/Passage): 
${questionData.subheadingA || 'N/A'}

SUBHEADING B (Context/Passage): 
${questionData.subheadingB || 'N/A'}

OPTIONS:
${questionData.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\\n')}

CORRECT ANSWER: ${questionData.answer}

YOUR TASK:
1. "topic": Categorize the question using exactly ONE "Key" from the taxonomy below.
2. "subTopic": Categorize the question using exactly ONE "Value" from the array belonging to that Topic.
3. "explanations": Provide an array of exactly 4 distinct explanations for the correct answer. The 4 explanations should vary in style (e.g., short summary, step-by-step breakdown, real-world analogy, academic detail).

TAXONOMY FOR ${subject}:
${taxonomyString}

IF NO MATCH: If the question clearly does not fit into ANY of the topics on the list, you MUST respond with "topic": "Uncategorized" and "subTopic": "Uncategorized".

OUTPUT FORMAT:
Return ONLY a valid JSON object with THREE keys: "topic" (string), "subTopic" (string), and "explanations" (array of 4 strings). Do not wrap it in markdown code blocks.
`;

    let imageParts = [];
    if (questionData.diagramUrlA) {
        const partA = await urlToGenerativePart(questionData.diagramUrlA);
        if (partA) imageParts.push(partA);
    }
    if (questionData.diagramUrlB) {
        const partB = await urlToGenerativePart(questionData.diagramUrlB);
        if (partB) imageParts.push(partB);
    }

    const contentsParams = [
        ...imageParts,
        { text: promptText }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Fixed model name
      contents: [{ role: "user", parts: contentsParams }],
      generationConfig: {
        temperature: 0.1, 
        responseMimeType: "application/json" 
      }
    });

    const aiText = response.text.trim();
    return JSON.parse(aiText);

  } catch (error) {
    console.error(`  [AI Error] Generating labels for question:`, error.message);
    return null;
  }
}

async function labelAllQuestions(targetSubjects = [], targetYears = []) {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB for Batch Processing");

    // If no subjects are provided, default to all of them
    const subjectsToProcess = targetSubjects.length > 0 ? targetSubjects : Object.keys(syllabusTaxonomy);

    for (const targetSubject of subjectsToProcess) {
        console.log(`\\n--- Searching database for subject: ${targetSubject} ---`);
        let query = { subjectName: { $in: [targetSubject] } };
        
        // If specific years are passed, restrict to those years
        if (targetYears.length > 0) {
             query.year = { $in: targetYears };
        }
        const examDocs = await QuestionModel.find(query);

        if (examDocs.length === 0) {
          console.log(`  No exam documents found for ${targetSubject}`);
          continue;
        }

        for (const examDoc of examDocs) {
            console.log(`\\nFound exam document: _id ${examDoc._id} (Year: ${examDoc.year || 'Unknown'}). Total questions: ${examDoc.questions.length}`);
            let updateCount = 0;

            for (let i = 0; i < examDoc.questions.length; i++) {
                let question = examDoc.questions[i];
                
                const subjectTaxonomy = syllabusTaxonomy[targetSubject];
                const isTopicValid = subjectTaxonomy && Object.keys(subjectTaxonomy).includes(question.topic);
                const isSubTopicValid = isTopicValid && subjectTaxonomy[question.topic].includes(question.subTopic);
                const hasValidTaxonomy = isTopicValid && isSubTopicValid;

                if (hasValidTaxonomy && question.aiGeneratedResponses.length === 4) {
                    continue;
                }

                console.log(`Processing ${targetSubject} ${examDoc.year || ''} Q${question.number || i+1}...`);
                
                if (!question.question && !question.subheadingA && !question.diagramUrlA) {
                     continue;
                }

                const labels = await getLabelsFromAI(targetSubject, question);

                if (labels && labels.topic && labels.subTopic && labels.explanations && labels.explanations.length === 4) {
                    console.log(`  ✓ Topic: ${labels.topic} | Sub-topic: ${labels.subTopic}`);
                    question.topic = labels.topic;
                    question.subTopic = labels.subTopic;
                    
                    // We keep the first paragraph of the AI generated response if it's already good, 
                    // or use the new ones. For Chemistry, we'll refresh them to be safe.
                    question.aiGeneratedResponses = labels.explanations.map((resp, idx) => {
                         const prefix = ["Summary:", "Rule/Context:", "Analogy:", "Analysis:"][idx];
                         if (resp.startsWith(prefix)) return resp;
                         return `${prefix} ${resp}`;
                    });
                    
                    examDoc.markModified('questions');
                    await examDoc.save();

                    updateCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                     console.log(`  ✗ Error hit for Q${question.number || i+1}. Activating quick 15-second smart-pause...`);
                     await new Promise(resolve => setTimeout(resolve, 15000));
                }
            }

            if (updateCount > 0) {
                console.log(`Saving ${updateCount} newly labeled questions back to document ${examDoc._id}...`);
                examDoc.markModified('questions');
                await examDoc.save();
                console.log(`Document ${examDoc._id} successfully saved!`);
            } else {
                console.log(`No new questions needed updates in document ${examDoc._id}.`);
            }
        }
    }
  } catch (error) {
    console.error("Critical Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. Batch process complete.");
  }
}

if (!process.env.GOOGLE_GEN_AI_KEY) {
    console.error("Missing GOOGLE_GEN_AI_KEY in .env");
    process.exit(1);
}

const specificSubjects = ["Chemistry"]; 
const specificYears = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

labelAllQuestions(specificSubjects, specificYears);
